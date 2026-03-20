# Roadmap: PHPro CRM — Full Demo Port

## Overview

This roadmap ports every feature from the demo_crm Vue prototype into the production Next.js application. Work proceeds domain-by-domain in dependency order: reference data first (unblocks all testing), then contracts (the hub feature), then account completion, then analytics layers (revenue, prognose, pipeline), then dashboard polish, and finally cross-cutting system completeness. Each phase delivers one fully working domain with DB persistence, server-first data flow, and i18n strings — no UI-only or in-memory-only work counts as done.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Reference Data** - Seed all reference data, complete fixtures, install additive libraries
- [ ] **Phase 2: Account Detail Completion** - All 7 account tabs fully functional with DB-backed CRUD
- [ ] **Phase 3: Contacts & Deals** - Contact steerco/role/personal info complete; deal origin, bench shortcut, and pipelines working
- [ ] **Phase 4: Contract Domain** - Full 7-section contract tab, hourly/SLA tariffs, indexation wizard persistence, attribution
- [ ] **Phase 5: Consultant Detail** - Attribution modal, rate history timeline, full detail modal, list indicators
- [ ] **Phase 6: Revenue Analytics** - Multi-year revenue grid with drill-down, per-account OmzetTab, filters
- [ ] **Phase 7: Prognose** - DB-backed forecast with persistence, editing, year-over-year comparison
- [ ] **Phase 8: Pipeline Analytics** - Pipeline analytics tab, entry CRUD, monthly spread, totals
- [ ] **Phase 9: Dashboard** - Activity feed, pipeline stage overview, stats grid, upcoming tasks
- [ ] **Phase 10: System Completeness** - Pipeline config admin, loading/error coverage, i18n audit, proxy.ts, RLS/grants

## Phase Details

### Phase 1: Foundation & Reference Data
**Goal**: All reference data is seeded in the database and all additive libraries are installed, unblocking every subsequent phase from being testable with realistic data
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. Competence centers, tariff roles, SLA tool suggestions, hosting providers, Agoria indices, CC services, language levels, hobby suggestions, contact roles, deal lead sources, and verdeling opties are all queryable via the Supabase dashboard with populated rows
  2. Demo fixture data (sample accounts, contacts, deals, activities, bench consultants, active consultants, contracts, revenue entries, employees, equipment, HR documents, leave balances, evaluations) loads without FK constraint errors after `task db:fixtures`
  3. `recharts`, `react-number-format`, and `nuqs` are importable in the codebase without TypeScript or build errors
  4. Running `task db:reset` produces a fully seeded local DB where all reference selects return data
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Create 13 reference tables, seed production data, migrate junction tables to FK references
- [ ] 01-02-PLAN.md — Update fixture files for FK references, expand demo data (10+ accounts, 20+ contacts), update application code (types, queries, actions, components)
- [ ] 01-03-PLAN.md — Install recharts (shadcn chart), react-number-format, nuqs; add NuqsAdapter to root layout
- [ ] 01-04-PLAN.md — Admin UI for managing reference tables (CRUD for all 13 lookup tables)

### Phase 2: Account Detail Completion
**Goal**: The account detail page is fully functional with all 7 tabs working against DB-persisted data, including hosting CRUD and per-account revenue entry
**Depends on**: Phase 1
**Requirements**: ACCT-01, ACCT-02, ACCT-03, ACCT-04, ACCT-05, ACCT-06
**Success Criteria** (what must be TRUE):
  1. Navigating to any account detail page shows all 7 tabs (overview, contacts, deals, activities, contracts, communication, revenue) with data loaded — no blank or broken tabs
  2. User can create, edit, and delete hosting environments (provider, environment type, URL, notes) on the account hosting tab, and changes persist after page refresh
  3. User can view per-account revenue entries on the revenue tab grouped by category and year, and can create, edit, and delete entries — data survives refresh
  4. The communication tab displays the full interaction history and allows creating new entries (emails, notes, meetings, calls) via a modal
  5. Account overview tab shows contract status, health score, tech stack, services, competence centers, and samenwerkingsvormen with working multi-select editors
  6. All relation management (tech stacks, services, hosting, competence centers) allows add and remove operations that persist to the database
**Plans**: TBD

Plans:
- [ ] 02-01: Account detail page server wiring — parallel fetch for all 7 tab data sources, `generateMetadata`, `loading.tsx`/`error.tsx`
- [ ] 02-02: Hosting environment feature module (migration, types, queries, actions, HostingTab component)
- [ ] 02-03: Account overview tab — contract status, health score display, relation multi-selects (tech stack, services, competence centers, samenwerkingsvormen)
- [ ] 02-04: Account communication tab — interaction history list, create modal, server-filtered by account_id
- [ ] 02-05: Account revenue tab (OmzetTab) — revenue entries CRUD filtered by account_id, wired to Phase 6 data model

### Phase 3: Contacts & Deals
**Goal**: Contacts have full personal info, steerco flag, and role tracking; deals have origin tracking, bench shortcut, and all three pipelines functioning with correct stages
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, DEAL-01, DEAL-02, DEAL-03, DEAL-04, DEAL-05
**Success Criteria** (what must be TRUE):
  1. The contact list and detail page show the steerco flag (is_steerco boolean) and it can be toggled and saved
  2. A contact's role can be set to any of the 9 demo roles (Decision Maker, Influencer, Champion, Sponsor, Steerco Lid, Technisch, Financieel, Operationeel, Contact) and persists
  3. All personal info fields on a contact — hobbies, marital status, children, birthday, partner info, gift/dinner/event invite preferences — are editable and persist after refresh
  4. A deal can be marked as "rechtstreeks" or "via Cronos" with competence center metadata; this choice is visible on the deal detail and list
  5. Clicking "quick deal" from a bench consultant opens a pre-filled deal creation modal with consultant info populated
  6. All three pipelines (Projecten, RFP, Consultancy Profielen) display with their correct stages; kanban and list views both work
  7. Deal detail page shows activities, tasks, and communication linked to that specific deal
**Plans**: TBD

Plans:
- [ ] 03-01: Contact steerco flag and role tracking (migration for is_steerco + role field, types update, contact list/detail display, edit form)
- [ ] 03-02: Contact personal info completeness audit and form completion (hobbies, marital status, children, birthday, partner info, invite preferences)
- [ ] 03-03: Deal origin tracking (migration for origin type + CC metadata fields, types, form fields, list/detail display)
- [ ] 03-04: Quick deal from bench (bench page UI button, pre-filled deal modal integration)
- [ ] 03-05: Pipeline types and stages — ensure all 3 pipelines are seeded with correct stages, kanban and list views honour pipeline type

### Phase 4: Contract Domain
**Goal**: The contract tab on an account shows all 7 sections with DB persistence; the indexation wizard writes approved rates to the database; consultant attribution with split % is enforced
**Depends on**: Phase 1, Phase 2
**Requirements**: CNTR-01, CNTR-02, CNTR-03, CNTR-04, CNTR-05, CNTR-06, CNTR-07
**Success Criteria** (what must be TRUE):
  1. The contract tab on an account detail page shows all 7 sections: raamcontract (with dates and PDF upload), servicecontract (dates and PDF), bestelbon (URL), hourly tariffs, SLA tariffs, indexation history, and contract attribution
  2. Hourly tariff grid shows per-role per-year rates with 3-year history; user can add/remove roles and edit rates, and saves persist
  3. SLA tariff section shows monthly fixed fee, hourly support rate, and per-tool fees with autocomplete from SLA_TOOL_SUGGESTIONS; edits persist
  4. Completing the 4-step indexation wizard and clicking "approve" inserts a new row in `hourly_rates` for the target year AND an entry in `indexation_history` — verified by checking DB rows after approval, not just UI
  5. Indexation history view lists all past indexations for the account with date, percentage, Agoria index reference, and affected rate count
  6. Setting a consultant's contract attribution to "via CC" with a split % persists; the split percentages shown sum to ≤ 100% with server-side enforcement
  7. Bestelbon URL field is editable and displayed on the contract tab
**Plans**: TBD

Plans:
- [ ] 04-01: Contract tab shell — 7-section layout with raamcontract and servicecontract dates/PDF, bestelbon URL field
- [ ] 04-02: Hourly tariff management (migration if needed, types, queries, actions, editable grid component with role add/remove)
- [ ] 04-03: SLA tariff management (migration for tool fees, types, queries, actions, SLA tariff form with tool autocomplete)
- [ ] 04-04: Indexation wizard DB persistence (drafts persisted, approve action writes hourly_rates row + indexation_history row, wizard reads from DB)
- [ ] 04-05: Indexation history view (query + list component showing date, %, Agoria ref, affected rates)
- [ ] 04-06: Contract attribution (migration for attribution type + split %, types, attribution modal, split sum validation server-side, visual indicator)

### Phase 5: Consultant Detail
**Goal**: Consultants have a fully detailed view showing contract info, rate history timeline, and attribution status; the consultant list shows attribution indicators
**Depends on**: Phase 4
**Requirements**: CONS-01, CONS-02, CONS-03, CONS-04
**Success Criteria** (what must be TRUE):
  1. Opening a consultant's detail modal shows all contract info: start/end dates, current rate, rate history, attribution type, any extensions, and stop reason if applicable
  2. The rate history section shows a timeline of all past tarief changes with date, amount, reason, and notes — data is DB-backed and persists
  3. The attribution modal can be opened from the consultant record; user can set direct/CC with split % and save; changes persist after page refresh
  4. The consultant list shows a visual badge on each row indicating "rechtstreeks" or "via [CC name]" for attributed consultants
**Plans**: TBD

Plans:
- [ ] 05-01: Consultant rate history (migration for rate_changes table or field additions, query, rate timeline component in detail modal)
- [ ] 05-02: Consultant attribution modal (reuse attribution data from Phase 4, surface in consultant detail modal with set/update flow)
- [ ] 05-03: Consultant detail modal completeness (start/end dates, extensions, stop reason, all fields wired to DB)
- [ ] 05-04: Consultant list attribution indicators (badge component showing rechtstreeks vs via CC name, query join to attribution data)

### Phase 6: Revenue Analytics
**Goal**: The revenue analytics page shows a multi-year grid with client, division, and service drill-down; users can filter by year, month/year toggle, division, and client; per-account revenue is editable on the account detail
**Depends on**: Phase 1, Phase 2
**Requirements**: REV-01, REV-02, REV-03, REV-04, REV-05
**Success Criteria** (what must be TRUE):
  1. The revenue analytics page renders a grid with expandable client rows showing division and service sub-rows with monthly revenue columns — data comes from the database, not hardcoded values
  2. User can switch between "by client" and "by service" groupings and the grid reorganises correctly
  3. Year selector, month/year toggle, division filter, and multi-client filter all update the grid via URL-synced state (nuqs) — filter state survives page refresh
  4. Filtering by year 2 on a multi-page result set returns the correct server-filtered results (no client-side filtering)
  5. Revenue entries on the account detail tab (Phase 2) correctly feed the aggregate totals visible on the analytics page
**Plans**: TBD

Plans:
- [ ] 06-01: Revenue analytics query (server-side group-by with account_id FK joins, aggregation by division/service/month)
- [ ] 06-02: Revenue grid component (expandable rows, client/division/service grouping, monthly columns, TanStack Table)
- [ ] 06-03: Revenue view by service (alternative grouping mode, service/division as primary rows)
- [ ] 06-04: Revenue page filters (nuqs-backed year selector, month/year toggle, division filter, multi-client select)

### Phase 7: Prognose
**Goal**: The prognose page reads from and writes to the database; forecast entries survive page refresh; year-over-year comparison shows prior year revenue alongside forecast
**Depends on**: Phase 6
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04
**Success Criteria** (what must be TRUE):
  1. After editing a forecast cell and refreshing the page, the edited value is still present — prognose data is persisted to the database, not stored in client state
  2. Each client row in the prognose page shows the previous year's known revenue alongside the current year forecast for direct comparison
  3. The per-client per-service forecast supports copy-from-previous, custom value, and stop modes; mode selection persists
  4. Clients in the prognose list are sorted by previous year total descending — highest-revenue clients appear first
**Plans**: TBD

Plans:
- [ ] 07-01: Prognose DB schema (migration for prognose_lines with account_id FK, service, mode, monthly amounts or spread, year; queries wrapped in React.cache; actions with ActionResult)
- [ ] 07-02: Prognose editing component (per-client per-service rows, copy/custom/stop mode, react-number-format cells, optimistic save)
- [ ] 07-03: Year-over-year comparison (join prognose_lines to revenue_entries for prior year actuals, display alongside forecast, sort by prior year total desc)

### Phase 8: Pipeline Analytics
**Goal**: The pipeline analytics tab shows deal revenue spread across months; pipeline entries can be created, edited, and deleted; totals by division and grand total are displayed
**Depends on**: Phase 1, Phase 3
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04
**Success Criteria** (what must be TRUE):
  1. The pipeline analytics tab renders a monthly revenue contribution view (RTForecastTab equivalent) where each deal's value is spread across its start-to-end month range — data is server-fetched
  2. User can create a pipeline entry with client, division, service, sold month, start month, duration, and total amount; entry persists after refresh
  3. User can edit and delete existing pipeline entries; changes persist
  4. Division subtotals and a grand total row are displayed at the bottom of the pipeline grid
**Plans**: TBD

Plans:
- [ ] 08-01: Pipeline analytics query and tab component (monthly spread calculation server-side or via useMemo, RTForecastTab equivalent layout)
- [ ] 08-02: Pipeline entry CRUD (migration if needed for pipeline_entries table, types, queries, actions, create/edit/delete modal)
- [ ] 08-03: Pipeline totals and spread visualization (division subtotals, grand total row, visual bar or indicator per month)

### Phase 9: Dashboard
**Goal**: The dashboard shows live activity feed, pipeline stage counts, key metric stats, and upcoming tasks — all sourced from real database queries
**Depends on**: Phase 2, Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. The dashboard activity feed shows recent activities (meetings, calls, demos) with linked account and deal names — feed updates when new activities are created
  2. The pipeline stage overview shows the count of deals per stage with monetary totals — accurate to current deal state in the database
  3. The stats grid shows correct live values for total accounts, open deals, total pipeline value, active consultant count, and bench count
  4. Upcoming tasks section shows the next due tasks ordered by due date with priority indicators
**Plans**: TBD

Plans:
- [ ] 09-01: Dashboard stats and pipeline stage overview (parallel queries for counts/totals, stats grid component, stage overview component)
- [ ] 09-02: Dashboard activity feed (recent activities query with account/deal joins, feed component with linked names)
- [ ] 09-03: Dashboard upcoming tasks (next-due tasks query ordered by due_date, priority badge display)

### Phase 10: System Completeness
**Goal**: All new routes have loading/error coverage, all new UI strings are in the i18n system, proxy.ts is accurate for all routes, all migrations have GRANT statements and RLS policies, and pipeline configuration is admin-manageable
**Depends on**: Phases 1-9
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05
**Success Criteria** (what must be TRUE):
  1. Admin can create, reorder, and delete pipeline stages for all three pipeline types from the admin panel — changes are reflected immediately in the deal creation form and kanban board
  2. Every new route added in Phases 1-9 has a `loading.tsx` with a matching skeleton and an `error.tsx` with a contextual error message — no route shows a blank page or unhandled error during load
  3. Switching the application language (Dutch / English) shows correctly translated labels for every UI string introduced in Phases 1-9 — no hardcoded Dutch strings remain
  4. All Supabase tables introduced in Phases 1-9 appear in `proxy.ts` with correct role mappings — navigating to any new route as an authenticated user does not produce a 403 or proxy error
  5. All migrations introduced in Phases 1-9 have explicit `GRANT` statements and `CREATE POLICY` rules — RLS is enabled on every new table and the authenticated role can perform the operations the UI requires
**Plans**: TBD

Plans:
- [ ] 10-01: Pipeline configuration admin page (CRUD for pipeline definitions and stage order for all 3 pipeline types)
- [ ] 10-02: Loading/error coverage audit (create missing `loading.tsx` skeletons and `error.tsx` boundaries for all routes from Phases 1-9)
- [ ] 10-03: i18n completeness audit (scan all new components for hardcoded strings, add to `messages/nl.json` and `messages/en.json`)
- [ ] 10-04: proxy.ts and RLS/grants audit (verify all new tables in proxy.ts, verify all migrations have GRANT + RLS + policies)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Reference Data | 0/3 | Planning complete | - |
| 2. Account Detail Completion | 0/5 | Not started | - |
| 3. Contacts & Deals | 0/5 | Not started | - |
| 4. Contract Domain | 0/6 | Not started | - |
| 5. Consultant Detail | 0/4 | Not started | - |
| 6. Revenue Analytics | 0/4 | Not started | - |
| 7. Prognose | 0/3 | Not started | - |
| 8. Pipeline Analytics | 0/3 | Not started | - |
| 9. Dashboard | 0/3 | Not started | - |
| 10. System Completeness | 0/4 | Not started | - |
