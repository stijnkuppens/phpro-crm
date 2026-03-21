# Plan: Unified Consultants

## Overview
Merge bench_consultants and active_consultants into a single `consultants` table, then rebuild the UI as one unified DataTable with status-based filtering and row actions. Work is split into 6 subplans: DB migration, types/queries, actions, unified DataTable, bench form + file uploads, and cleanup.

## Matched Skills
| Skill | Applies To | Reason |
|-------|-----------|--------|
| `add-supabase-migration` | Subplan 1 | Creating migration to merge tables |

## Subplans

### Subplan 1: Database Migration — Merge Tables
**Files** (creation order):
1. `supabase/migrations/00069_merge_consultant_tables.sql` — DDL: create consultants, migrate data, update FKs, drop old tables
2. `supabase/fixtures/004_consultancy.sql` — rewrite fixtures for unified table
3. `supabase/seed.sql` — update if fixture references changed

**Depends on**: none
**Skills**: `add-supabase-migration`
**What**: Create unified `consultants` table, migrate all data from both old tables, update child table FKs, update deals FK, drop old tables, replace link_bench_to_account() RPC function.
**How**:
1. CREATE TABLE consultants with all columns:
   - Shared: id, first_name, last_name, city, cv_pdf_url, avatar_path (NEW column — no source data, NULL for all migrated rows, populated going forward via AvatarUpload), created_at, updated_at
   - Status: status TEXT NOT NULL CHECK IN ('bench','actief','stopgezet') DEFAULT 'bench'
   - Archived: is_archived BOOLEAN NOT NULL DEFAULT false (bench-specific soft delete, separate from stopgezet status)
   - Bench-nullable: priority, available_date, min_hourly_rate, max_hourly_rate, roles[], technologies[], description
   - Active-nullable: account_id (FK→accounts), role, client_name, client_city, start_date, end_date, is_indefinite, hourly_rate, sow_url, notice_period_days, notes
   - Stop-nullable: stop_date, stop_reason
2. INSERT INTO consultants SELECT from bench_consultants:
   - Where is_archived = false → status='bench'
   - Where is_archived = true → SKIP ALL archived bench rows. There is no FK from active_consultants back to bench_consultants, so there's no reliable way to distinguish "linked" from "standalone" archived. Since link_bench_to_account() always creates a new active record when archiving, all archived bench consultants have a corresponding active record that will be migrated in step 3. Simply: `INSERT INTO consultants ... FROM bench_consultants WHERE is_archived = false`.
3. INSERT INTO consultants SELECT from active_consultants:
   - Where is_stopped = false → status='actief'
   - Where is_stopped = true → status='stopgezet'
4. ALTER child tables: rename FKs to consultant_id, re-point to consultants(id)
   - consultant_languages (renamed from bench_consultant_languages)
   - consultant_rate_history (rename active_consultant_id → consultant_id)
   - consultant_extensions (rename active_consultant_id → consultant_id)
   - consultant_contract_attributions (rename active_consultant_id → consultant_id)
5. ALTER deals: rename bench_consultant_id → consultant_id
6. DROP old tables (bench_consultants, active_consultants, bench_consultant_languages)
7. DROP function link_bench_to_account()
8. CREATE new function link_consultant_to_account() that UPDATEs status bench→actief, populates active fields, creates initial rate_history entry — all in a transaction
9. RLS policies on consultants table:
   - SELECT: all authenticated
   - INSERT: admin, sales_manager (bench creation elevated to manager level)
   - UPDATE: admin, sales_manager
   - DELETE: admin only
   - GRANT SELECT, INSERT, UPDATE, DELETE ON consultants TO authenticated
10. Indexes: idx_consultants_status, idx_consultants_account, idx_consultants_archived
11. set_updated_at trigger, add to realtime publication

**Acceptance Criteria**:
- [ ] `task db:reset` completes without errors
- [ ] `SELECT count(*) FROM consultants` returns correct migrated count (non-archived bench + all active)
- [ ] `SELECT count(*) FROM consultant_languages` matches old bench_consultant_languages count
- [ ] Child tables (rate_history, extensions, attributions) FKs point to consultants(id)
- [ ] `grep -r 'active_consultant_id' supabase/migrations/00069*` returns 0 results in final schema
- [ ] `grep -r 'bench_consultant_id' supabase/migrations/00069*` returns 0 results in final schema (except in DROP statements)
- [ ] deals table has consultant_id column (not bench_consultant_id)
- [ ] RLS policies exist on consultants table (SELECT for authenticated, INSERT/UPDATE for admin+sales_manager)
- [ ] `SELECT * FROM consultants WHERE status = 'bench'` returns bench data
- [ ] `SELECT * FROM consultants WHERE status = 'actief'` returns active data
- [ ] Archived bench consultants that were linked to active records are NOT duplicated

**Model hint**: opus

### Subplan 2: Types, Queries & Permissions
**Files** (creation order):
1. `src/features/consultants/types.ts` — unified Consultant type, Zod schemas, helper functions
2. `src/features/consultants/queries/get-consultants.ts` — single query replacing both old queries
3. `src/features/consultants/queries/get-consultant.ts` — NEW single record query (does not exist yet)
4. `src/features/consultants/queries/get-consultants-by-account.ts` — update to use new table

**Depends on**: Subplan 1
**Skills**: none
**What**: Create unified TypeScript types, Zod schemas, and query functions for the merged table.
**How**:
- Consultant type with all fields + status: 'bench' | 'actief' | 'stopgezet'
- ConsultantWithDetails includes languages, rate_history, extensions, contract_attribution
- Zod schemas: benchConsultantFormSchema (for bench creation), consultantFormSchema (for active editing)
- getConsultants() query with status[] filter, search, pagination — supports multi-status filtering (default: ['bench','actief'])
- getConsultant(id) — NEW: returns ConsultantWithDetails | null for detail views
- getConsultantsByAccount(accountId) — update table name to 'consultants'
- Helper functions: getContractStatus(), getCurrentRate() (carried from existing)
- Remove old bench types/queries (moved to cleanup subplan)

**Acceptance Criteria**:
- [ ] `Consultant` type exported from types.ts with status field
- [ ] `getConsultants()` accepts status[] filter parameter (array of statuses)
- [ ] `getConsultant(id)` returns ConsultantWithDetails | null
- [ ] `getConsultantsByAccount()` queries `consultants` table (not active_consultants)
- [ ] All queries wrapped in React.cache()
- [ ] Zod schemas validate bench-specific and active-specific fields appropriately
- [ ] `grep -r 'active_consultants' src/features/consultants/queries/` returns 0 results
- [ ] `grep -r 'bench_consultants' src/features/consultants/queries/` returns 0 results

**Model hint**: sonnet

### Subplan 3: Server Actions — Consolidate
**Files** (creation order):
1. `src/features/consultants/actions/create-bench-consultant.ts` — new bench creation
2. `src/features/consultants/actions/update-consultant.ts` — unified update (replaces update-active + update-bench)
3. `src/features/consultants/actions/link-consultant-to-account.ts` — replace link-bench-to-account (calls new RPC)
4. `src/features/consultants/actions/stop-consultant.ts` — update: set status='stopgezet'
5. `src/features/consultants/actions/move-to-bench.ts` — replace move-stopped-to-bench (UPDATE status='bench')
6. `src/features/consultants/actions/archive-consultant.ts` — set is_archived=true on bench consultants (distinct from stopgezet)
7. `src/features/consultants/actions/extend-consultant.ts` — update FK column name to consultant_id
8. `src/features/consultants/actions/add-rate-change.ts` — update FK column name to consultant_id
9. `src/features/consultants/actions/upsert-contract-attribution.ts` — update FK column name to consultant_id

**Depends on**: Subplan 2
**Skills**: none
**What**: Consolidate all mutations to work with unified consultants table.
**How**:
- create-bench-consultant: INSERT into consultants with status='bench', validate bench fields
- update-consultant: UPDATE with status-aware validation (different fields writable per status)
- link-consultant-to-account: Call RPC link_consultant_to_account() (atomic: UPDATE status bench→actief, set active fields, create rate_history)
- stop-consultant: UPDATE status='stopgezet', set stop_date/reason, clear is_active semantics
- move-to-bench: UPDATE status='bench', clear active-specific fields (account_id, client_name, client_city, start_date, end_date, hourly_rate, sow_url, stop_date, stop_reason) to NULL. Bench fields (priority, available_date, rates, roles, technologies) that were populated when originally bench are still present — they were never cleared on transition to actief
- archive-consultant: UPDATE is_archived=true on bench consultants (NOT status change — archival is separate from stopping)
- extend-consultant, add-rate-change, upsert-contract-attribution: update FK column from active_consultant_id → consultant_id
- All use ActionResult<T>, audit logging with `consultant.*` prefix (not `active_consultant.*` or `bench_consultant.*`), revalidatePath

**Acceptance Criteria**:
- [ ] createBenchConsultant inserts with status='bench'
- [ ] linkConsultantToAccount updates status from bench→actief
- [ ] stopConsultant sets status='stopgezet'
- [ ] moveToBench sets status='bench'
- [ ] archiveConsultant sets is_archived=true (does NOT set status='stopgezet')
- [ ] All actions use ActionResult<T> pattern
- [ ] All actions call revalidatePath('/admin/consultants')
- [ ] `grep -r 'active_consultant_id' src/features/consultants/actions/` returns 0 results
- [ ] `grep -rF 'active_consultant.' src/features/consultants/actions/` returns 0 results (audit events use consultant.* prefix)
- [ ] Old action files (create-active-consultant, link-bench-to-account, move-stopped-to-bench) removed

**Model hint**: sonnet

### Subplan 4: Unified DataTable & Page
**Files** (creation order):
1. `src/features/consultants/columns.tsx` — rewrite with status badge, conditional columns
2. `src/features/consultants/components/consultant-list.tsx` — unified list with status filter pills
3. `src/features/consultants/components/stop-consultant-modal.tsx` — update: references consultants table, consultant_id FK
4. `src/features/consultants/components/extend-consultant-modal.tsx` — update: references consultants table
5. `src/features/consultants/components/rate-change-modal.tsx` — update: references consultants table
6. `src/features/consultants/components/contract-attribution-modal.tsx` — update: references consultant_id FK
7. `src/app/admin/consultants/page.tsx` — fetch unified data
8. `src/app/admin/consultants/loading.tsx` — update skeleton

**Depends on**: Subplan 2, Subplan 3
**Skills**: none
**What**: Single DataTable showing all consultants with status badges, filter pills, and status-dependent row actions. Update all action modals to use unified table references.
**How**:
- Status filter as toggle pills (Bench, Actief, Stopgezet) — default Bench + Actief selected
- Status badge column: green "Actief", orange "Bench", gray "Stopgezet"
- Columns adapt: bench shows priority+roles+rate range, actief shows account+rate+period, stopgezet shows account+stop date
- Row actions dropdown varies by status (as specified in DESIGN):
  - Bench: Koppel, Bewerk, Archiveer
  - Actief: Bekijken, Bewerk, Verlengen, Tariefwijziging, Stopzetten
  - Stopgezet: Bekijken, Naar bench
- Stats cards: total per status, max revenue (actief only), critical contracts
- Search across name, role, client_name
- Server-first data flow: page fetches → passes initialData to client component
- Update all action modals (stop, extend, rate-change, contract-attribution) to import from new action files and use consultant_id FK

**Acceptance Criteria**:
- [ ] DataTable renders all consultant statuses
- [ ] Status badge shows correct color per status (green/orange/gray)
- [ ] Default filter shows Bench + Actief (Stopgezet hidden)
- [ ] Toggling filter pills updates the table
- [ ] Row actions differ per status (as specified in DESIGN)
- [ ] Search works across name, role, account
- [ ] Stats cards show correct counts
- [ ] Server-first data flow (page.tsx fetches, passes to client)
- [ ] `grep -r 'active_consultant_id' src/features/consultants/components/` returns 0 results
- [ ] All modals reference consultants table (not active_consultants)

**Model hint**: opus

### Subplan 5: Bench Form, CV Upload, Avatar
**Files** (creation order):
1. `src/features/consultants/components/bench-form-modal.tsx` — creation/edit modal for bench consultants
2. `src/features/consultants/components/consultant-detail-modal.tsx` — update for all statuses + CV/avatar display

**Depends on**: Subplan 3 (needs createBenchConsultant action)
**Skills**: none
**What**: Bench creation form with CV upload and avatar, plus updated detail modal supporting all statuses.
**How**:
- BenchFormModal: 2-column layout matching demo_crm
  - Left: name, city, priority, available_date, rate range
  - Right: roles (multi-select), technologies (multi-select), description, languages
  - Bottom: CV upload (PdfUploadField), Avatar (AvatarUpload)
- ConsultantDetailModal: adapt to show different info per status
  - Bench: priority, roles, technologies, rate range, languages, CV link, avatar
  - Actief: account, rate, period, contract attribution, rate history, SOW, avatar
  - Stopgezet: stop reason, stop date, original account, avatar
- CV stored in `documents` bucket, path: `consultants/{id}/cv.{ext}`
- Avatar stored in `avatars` bucket, path: `consultants/{id}/avatar.{ext}`
- IMPORTANT: Do not use `<SelectValue />` in `SelectTrigger`. Render label explicitly by looking up selected value in the options array (see CLAUDE.md Gotchas: Base UI Select)

**Acceptance Criteria**:
- [ ] BenchFormModal creates consultant with status='bench'
- [ ] CV upload works via PdfUploadField
- [ ] Avatar upload works via AvatarUpload
- [ ] Detail modal shows appropriate info per status (bench/actief/stopgezet)
- [ ] Languages can be added/removed in bench form
- [ ] No `<SelectValue>` used inside `SelectTrigger` (grep check)

**Model hint**: sonnet

### Subplan 6: Cleanup & Route Removal
**Files** (creation order):
1. Delete `src/features/bench/` (entire directory)
2. Delete `src/app/admin/bench/` (entire directory)
3. Delete `src/features/consultants/components/add-consultant-modal.tsx` (dead code — manual add removed)
4. Delete `src/features/consultants/actions/create-active-consultant.ts`
5. Delete `src/features/consultants/actions/link-bench-to-account.ts`
6. Delete `src/features/consultants/actions/move-stopped-to-bench.ts`
7. Delete `src/features/consultants/queries/get-active-consultants.ts`
8. `src/features/consultants/components/account-consultants-tab.tsx` — remove AddConsultantModal import and button, remove benchConsultants prop
9. `src/features/consultants/components/link-consultant-wizard.tsx` — remove benchConsultants prop from interface; fetch bench consultants internally via getConsultants({ status: ['bench'] }) or receive filtered data from caller. Remove client-side .filter() on bench data.
10. `src/app/admin/accounts/[id]/page.tsx` — remove bench data fetch, remove benchConsultants prop passing
11. `src/features/accounts/components/account-detail.tsx` — remove benchConsultants prop from type and component
12. Remove old imports/references across codebase

**Depends on**: Subplan 4, Subplan 5
**Skills**: none
**What**: Remove all dead code, old routes, and old feature directories. Clean up imports and props.
**How**:
- Delete entire bench feature directory
- Delete bench route pages
- Delete add-consultant-modal.tsx (manueel toevoegen removed)
- Delete obsolete action/query files
- Update account-consultants-tab: remove AddConsultantModal import/button, remove benchConsultants prop from component signature
- Update link-consultant-wizard: remove `benchConsultants` prop from component interface, remove `BenchConsultantWithLanguages` type dependency, fetch bench consultants internally or receive from caller as `Consultant[]` with status='bench' filter already applied
- Update accounts/[id]/page.tsx: stop fetching bench data, remove benchConsultants prop from AccountDetail rendering
- Update account-detail.tsx: remove benchConsultants from props interface and tab component props
- Grep for any remaining references to bench_consultants, active_consultants, old imports

**Acceptance Criteria**:
- [ ] No files exist under src/features/bench/
- [ ] No files exist under src/app/admin/bench/
- [ ] No references to `bench_consultants` or `active_consultants` in src/ (grep returns 0)
- [ ] No references to `active_consultant_id` in src/ (grep returns 0)
- [ ] No references to `AddConsultantModal` in src/
- [ ] No references to `BenchConsultantWithLanguages` in src/
- [ ] Account consultants tab only has "Consultant koppelen" button (no "Manueel toevoegen")
- [ ] Account detail page does not fetch bench data
- [ ] Link wizard queries consultants table with status='bench' filter
- [ ] `npm run build` succeeds with 0 TypeScript errors

**Model hint**: sonnet

## Complexity Decisions
| Decision | Justification | Alternative Considered |
|----------|--------------|----------------------|
| RPC function for link operation | Atomic status transition + field population + rate_history insert needs transaction safety | Direct UPDATE in action — rejected: multiple writes need atomicity |
| Nullable columns over JSONB | Queryable, filterable, type-safe | JSONB — rejected: harder to query/filter in Supabase |
| RLS write: sales_manager + admin only | Bench creation is a manager activity in this CRM, consistent with active consultant access | Allow sales_rep for bench writes — rejected: simplifies permission model |
| is_archived boolean separate from status | Bench archival (removed from pool) is distinct from contract termination (stopgezet). Different semantics, different UI treatment | Overload status='stopgezet' for both — rejected: conflates two lifecycle events |
| avatar_path as new column | Neither source table had avatars. Net-new feature, NULL for all migrated rows | Skip avatar — rejected: user requested it in scope |

## Execution Order
- Wave 1: Subplan 1 (DB migration)
- Wave 2: Subplan 2 (types/queries)
- Wave 3: Subplan 3 (actions — must complete before SP4 and SP5)
- Wave 4 (parallel): Subplan 4 (DataTable + modals) + Subplan 5 (bench form + detail modal)
- Wave 5: Subplan 6 (cleanup — everything must work first)

## Out of Scope
- Consultant reporting/analytics dashboard
- Bulk operations on consultants
- Consultant search across deals
