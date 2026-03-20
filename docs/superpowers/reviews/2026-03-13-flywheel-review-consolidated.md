# CRM Port Plans — Consolidated Flywheel Review

> 4 rounds of review across 6 implementation plans (12,251 total lines)
> 14 review agents dispatched, ~100+ individual findings consolidated below

---

## Executive Summary

The plans provide **excellent backend coverage** — all 50 tables, 42 permissions, 14 nav items, and 14 seed data sets are fully specified. However, there are **5 migration blockers** that would fail on first execution, a **systematic UI gap** (29 of 37 forms/modals missing), and several cross-cutting issues affecting all 6 plans.

### Coverage Scorecard

| Category | Covered | Total | % |
|---|---|---|---|
| Database Tables | 50 | 50 | 100% |
| Permissions | 42 | 42 | 100% |
| Navigation Items | 14 | 14 | 100% |
| Seed Data Sets | 14 | 14 | 100% |
| Routes/Pages | 17 | 18 | 94% |
| **Forms/Modals** | **8** | **37** | **22%** |
| **Business Logic Utils** | **3** | **11** | **27%** |

---

## CRITICAL — Must Fix Before Execution

### C1: Migration number collision (L1 + L2 both use `00010`)
- **Round**: 1, 2, 3, 4 (flagged by all rounds)
- **Impact**: Migration will fail — Supabase CLI rejects duplicate numbers
- **Fix**: Renumber L2 to start at `00011_accounts.sql`, cascade through `00012`, `00013`, `00014`

### C2: Old contacts table not dropped (L2 CREATE TABLE will fail)
- **Round**: 1, 2, 3, 4
- **Impact**: `CREATE TABLE contacts` fails with "relation already exists"
- **Fix**: Add bridge migration `00010b_drop_old_contacts.sql` with `DROP TABLE IF EXISTS contacts CASCADE`

### C3: Duplicate `indexation_indices` table (created in L1 AND L4)
- **Round**: 3, 4
- **Impact**: L4 migration fails with "relation already exists"
- **Fix**: Remove `indexation_indices` CREATE + seed from L4's `00033_indexation.sql`

### C4: Role migration breaks existing data
- **Round**: 1, 3, 4
- **Impact**: CHECK constraint change fails if any user has role `editor` or `viewer`. `handle_new_user()` trigger inserts default `viewer` which violates new constraint.
- **Fix**: Add `UPDATE user_profiles SET role = 'sales_rep' WHERE role = 'editor'` etc. before constraint change. Update trigger default to `'sales_rep'`.

### C5: Storage policies locked to old `editor` role
- **Round**: 4
- **Impact**: After role migration, only `admin` can upload files. All other roles locked out.
- **Fix**: Add migration after `00008` to recreate storage policies with new role names

---

## HIGH — Should Fix Before Execution

### H1: Wrong migration CLI commands (all 6 plans)
- **Round**: 3
- **Impact**: `npx supabase db push` doesn't work — project uses Docker Compose, not `supabase start`
- **Fix**: Replace with `task db:migrate` or `docker compose exec -T db psql` per Taskfile

### H2: `task types:generate` outputs to wrong file
- **Round**: 3
- **Impact**: Types go to `database.types.ts` but all imports use `database.ts`. Every subsequent TypeScript file fails.
- **Fix**: Fix Taskfile output path or add copy step

### H3: Missing `revalidatePath` in ALL server actions (all 6 plans)
- **Round**: 1, 2, 3
- **Impact**: Stale data after every mutation — server components with `cache()` never refresh
- **Fix**: Add `revalidatePath('/admin/<entity>')` to every create/update/delete action (~30+ files)

### H4: Server queries created but never used (L2, L3, L6)
- **Round**: 1, 2
- **Impact**: Plans create `cache()`-wrapped server queries (getAccounts, getContacts, getDealsByPipeline, getEmployees) but pages use `useEntity` client hook instead. Dead code.
- **Fix**: Either use server queries in server components or remove them

### H5: Client-side filtering on paginated data (L2, L3, L6)
- **Round**: 1, 2
- **Impact**: Fetch page of 25, filter client-side — user sees wrong pagination, misses results on other pages
- **Fix**: Pass filters to server query or `useEntity` filter parameter

### H6: 29 missing form/modal components
- **Round**: 2 (spec gap analysis)
- **Impact**: Every layer creates server actions that are unreachable from UI. Features are backend-only.
- **Affected**: Account form, contact form, communication modal, deal form, close-deal modal, activity/task modals, bench/consultant detail modals, indexeringssimulator wizard (4-step), contracten tab, hourly/SLA rate forms, all 6 HR tab forms
- **Fix**: Add form/modal task to each layer plan

### H7: 8 missing business logic utility functions
- **Round**: 2 (spec gap analysis)
- **Impact**: Functions from demo `utils.ts` not implemented: `werkdagenTussen`, `calcTarief`, `calcContactDatum`, `getEffectiveServices`, `calcSlaTotal`, `eindVanJaar`, `daysUntilDate`, formatting utils
- **Fix**: Add `src/lib/business-logic.ts` and `src/lib/format.ts` tasks

### H8: Account detail stub tabs never replaced
- **Round**: 2
- **Impact**: L2 creates stubs ("beschikbaar na Layer X") but no subsequent layer replaces them
- **Fix**: Add tab replacement tasks to L3 (Deals tab), L4 (Contracten + Consultants tabs), L5 (Omzet tab)

### H9: Layout code snippet would destroy theme/fonts
- **Round**: 1, 3
- **Impact**: L1 Task 4 Step 5 shows bare layout losing ThemeProvider, Toaster, Geist font
- **Fix**: Replace with complete merged layout preserving all existing wrappers

### H10: L6 HR tabs are all read-only
- **Round**: 1
- **Impact**: 5 tab components have no add/edit/delete buttons. Actions exist but unreachable.
- **Fix**: Add CRUD modals to salary, equipment, documents, leave, evaluation tabs

### H11: Missing `/admin/accounts/new` page
- **Round**: 2
- **Impact**: Spec lists this route. createAccount action exists but no page/form.
- **Fix**: Add page + form component to L2

---

## MEDIUM — Fix During or After Execution

### M1: Existing RLS policies reference old roles
- L1 migration should update `app_settings` and `contacts` RLS policies after role change

### M2: Non-idempotent seed data (L1, L4, L5)
- Missing `ON CONFLICT DO NOTHING` on pipeline, consultancy, and finance seeds

### M3: Revenue `month` column is 0-indexed (JS convention, not SQL 1-12)
- Document or switch to 1-indexed to prevent `EXTRACT(MONTH)` off-by-one bugs

### M4: Bench consultant priority sorts alphabetically (High < Low < Medium)
- Use integer sort column or application-side sort map

### M5: `closeDeal` sets longterm probability to 0
- Should use stage probability for longterm deals, not 0

### M6: `longterm_date` not conditionally required
- Zod schema should require it when `closed_type === 'longterm'`

### M7: `approveIndexation` action is not transactional
- 6+ sequential operations without transaction — partial failure corrupts data
- Consider PostgreSQL function via `supabase.rpc()`

### M8: `deleteCommunication` permission mismatch with RLS
- Action checks `communications.write` but RLS DELETE only allows admin + sales_manager

### M9: Hardcoded years in Revenue/Prognose pages
- `[2023, 2024, 2025, 2026]` and `FORECAST_YEAR = 2026` will go stale

### M10: Revenue service view mode declared but not implemented
- Toggle exists but table body only renders client view

### M11: Sidebar nav items not gated by role
- All roles see all sections; clicking blocked routes causes redirect

### M12: Missing UNIQUE constraints on junction tables
- `account_tech_stacks`, `account_manual_services`, etc. allow duplicates

### M13: Verification should use `tsc --noEmit` not `next build`
- 6-10x faster for compile-fix loops

### M14: `update-active-consultant.ts` listed but never implemented (L4)
- File in inventory, no step creates it

### M15: `indexation_config` table created but never used (L4)
- No type, query, action, or component references it

### M16: `savePrognose` deletes ALL revenue entries for year, not scoped
- Wipes actual data alongside forecast data

### M17: `contract_attribution` typed as single object but Supabase returns array
- FK is not UNIQUE, so join returns array. Type cast hides mismatch.

### M18: Salary auto-update doesn't check date ordering
- Backdated salary record overwrites current gross_salary

### M19: Missing sidebar navigation for Revenue/Prognose/Pipeline (L5)
- Pages created but no nav links added

### M20: Missing page permission guards (L6 materials + people pages)
- No `requirePermission` call in server components

### M21: `account_services` vs `account_manual_services` confusion
- Two tables with identical structure, unclear distinction

### M22: Missing "Add new service line" in Prognose editor
- Spec requires it, plan only supports copy/custom/stop on existing lines

### M23: Pipeline monthly spread drops months past December
- Entries starting in November with 3-month duration lose 1 month

### M24: `upsertRevenueEntry` missing audit logging
- Other revenue actions log, this one doesn't

### M25: Hardcoded Dutch strings despite i18n setup
- L6 tabs use "Loonhistoriek" etc. instead of `useTranslations`

---

## Upstream Process Recommendations

### P1: Require UI for every server action in plan generation
Every layer creates types + queries + actions but stops short of building forms/modals. Add to plan prompt: "For every server action, there MUST be a corresponding UI component that calls it."

### P2: Require stub-replacement tracking
When a plan creates a placeholder referencing a future layer, that future layer's plan must include a task to replace it.

### P3: Add cross-layer migration audit step
After writing all plans, audit migration numbers across all layers for collisions and verify table names aren't duplicated.

### P4: Verify CLI commands against project infrastructure
Plans should reference the Taskfile and docker-compose setup, not assume standard Supabase CLI.

---

## Fix Priority Matrix

| Priority | Count | Action |
|---|---|---|
| CRITICAL (blocks execution) | 5 | Fix in plans before starting |
| HIGH (causes bugs/dead code) | 11 | Fix in plans or during L1 execution |
| MEDIUM (quality/completeness) | 25 | Fix during layer execution |
| PROCESS (upstream improvement) | 4 | Apply to future plan generation |

**Recommended approach**: Fix C1-C5 and H1-H2 in the plan files first (these are simple edits). Then start executing Layer 1, incorporating H3-H11 fixes as tasks are encountered. Medium items can be addressed during their respective layer's execution.
