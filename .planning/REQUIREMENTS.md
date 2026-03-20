# Requirements: PHPro CRM — Full Demo Port

**Defined:** 2026-03-20
**Core Value:** Every feature from the demo CRM must exist with full backend persistence, server-first data flow, and multi-language support

## v1 Requirements

Requirements for full feature parity with demo_crm. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: All reference data tables populated in `supabase/data/` — competence centers (CC_NAMEN), CC services, consultant roles (TARIEF_ROLLEN), tech stack options, hosting providers, hosting environments, Agoria indices, language levels, hobby suggestions, SLA tool suggestions, contact roles, deal lead sources, verdeling opties
- [x] **FOUND-02**: All demo entity fixtures updated in `supabase/fixtures/` — sample accounts, contacts, deals, activities, tasks, bench consultants, active consultants, contracts, revenue entries, employees, equipment, HR documents, leave balances, evaluations
- [x] **FOUND-03**: Install recharts + shadcn chart component for analytics pages
- [x] **FOUND-04**: Install react-number-format for currency input fields in tariff/revenue editors
- [x] **FOUND-05**: Install nuqs for URL-based filter state on analytics pages

### Account Detail

- [ ] **ACCT-01**: Account detail page has all 7 tabs fully functional — overview, contacts, deals, activities, contracts, communication, revenue
- [ ] **ACCT-02**: Account overview tab shows contract status, health score, tech stack, services, competence centers, samenwerkingsvormen
- [x] **ACCT-03**: Account hosting environment CRUD — create/edit/delete hosting entries (provider, environment type, URL, notes) per account
- [ ] **ACCT-04**: Account revenue tab (OmzetTab) — per-account revenue by category/year with create/edit/delete entries
- [ ] **ACCT-05**: Account communication tab shows full interaction history (emails, notes, meetings, calls) with create modal
- [x] **ACCT-06**: All account relation management working — tech stacks, manual services, hosting, competence centers as multi-select with CRUD

### Contacts

- [ ] **CONT-01**: Contact steering committee flag (is_steerco boolean) — visible in contact list and detail
- [ ] **CONT-02**: Contact role tracking with all demo roles (Decision Maker, Influencer, Champion, Sponsor, Steerco Lid, Technisch, Financieel, Operationeel, Contact)
- [ ] **CONT-03**: Contact personal info fully editable — hobbies, marital status, children, birthday, partner info, gift/dinner/event invite preferences

### Deals

- [ ] **DEAL-01**: Deal origin tracking — rechtstreeks vs. Cronos with CC metadata (competence center name, attribution type)
- [ ] **DEAL-02**: Quick deal creation from bench consultant — opens pre-filled deal modal from bench page with consultant info
- [ ] **DEAL-03**: Close deal modal with reason selection (won/lost/longterm) and close date
- [ ] **DEAL-04**: Deal detail page shows activities, tasks, and communication linked to that deal
- [ ] **DEAL-05**: All three pipeline types functional — Projecten, RFP, Consultancy Profielen with correct stages per pipeline

### Contracts

- [ ] **CNTR-01**: Contract tab on account detail — full 7-section view: raamcontract dates/PDF, servicecontract dates/PDF, bestelbon URL, hourly tariffs, SLA tariffs, indexation, contract attribution
- [ ] **CNTR-02**: Hourly tariff management — per-role per-year rates with 3-year history, editable grid, add/remove roles
- [ ] **CNTR-03**: SLA tariff management — monthly fixed + hourly support + per-tool fees by year, with tool autocomplete from SLA_TOOL_SUGGESTIONS
- [ ] **CNTR-04**: Indexation simulator persistence — 4-step wizard (set %, simulate, draft with overrides, approve) writes approved rates to hourly_rates and indexation_history tables
- [ ] **CNTR-05**: Indexation history view — list of all past indexations per account with date, percentage, Agoria index reference, affected rates
- [ ] **CNTR-06**: Contract attribution per consultant — direct client vs. via Competence Center with split % (4% or custom), visual indicator on consultant list
- [ ] **CNTR-07**: Bestelbon (purchase order) tracking with URL field per account contract

### Consultants

- [ ] **CONS-01**: Consultant contract attribution modal — set direct/CC with split %, persist to active_consultants record
- [ ] **CONS-02**: Consultant rate history timeline — all past tarief changes with date, amount, reason, notes in detail modal
- [ ] **CONS-03**: Contract attribution indicator on consultant list — visual badge showing "rechtstreeks" vs "via [CC name]"
- [ ] **CONS-04**: Consultant detail modal shows full contract info — start/end dates, current rate, rate history, attribution, extensions, stop reason

### Revenue & Analytics

- [ ] **REV-01**: Revenue analytics page — multi-year grid with client/division/service drill-down, expandable rows, sortable columns
- [ ] **REV-02**: Revenue view by client — group revenue entries by client with division/service sub-rows and monthly columns
- [ ] **REV-03**: Revenue view by service — group revenue entries by service/division with client sub-rows and monthly columns
- [ ] **REV-04**: Revenue page filters — year selector, month/year toggle, division filter, multi-client selection
- [ ] **REV-05**: Per-account revenue entries (OmzetTab) — CRUD for revenue records by category (Consultancy, Magento, Adobe Commerce, etc.) per year/month

### Prognose

- [ ] **PROG-01**: Prognose page with DB persistence — forecast entries backed by database (schema migration + queries + actions), NOT client-only state
- [ ] **PROG-02**: Prognose editing — per-client per-service forecast with copy-from-previous / custom / stop modes
- [ ] **PROG-03**: Prognose year-over-year comparison — show last known revenue (previous year) alongside forecast for context
- [ ] **PROG-04**: Prognose sorted by last known revenue — clients ordered by previous year total descending

### Pipeline

- [ ] **PIPE-01**: Pipeline analytics tab — deals spread over months as revenue contribution view (RTForecastTab equivalent)
- [ ] **PIPE-02**: Pipeline entry CRUD — create/edit/delete entries with client, division, service, sold month, start month, duration, total amount
- [ ] **PIPE-03**: Pipeline monthly spread visualization — visual representation of deal revenue spread across start-to-end months
- [ ] **PIPE-04**: Pipeline totals by division and grand total

### Dashboard

- [ ] **DASH-01**: Dashboard activity feed — recent activities (meetings, calls, demos) with linked account/deal
- [ ] **DASH-02**: Dashboard pipeline stage overview — deals per stage with totals
- [ ] **DASH-03**: Dashboard stats grid — key metrics (total accounts, open deals, total pipeline value, active consultants, bench count)
- [ ] **DASH-04**: Dashboard upcoming tasks — next due tasks with priority indicators

### Admin & System

- [ ] **ADMN-01**: Pipeline configuration — admin can manage pipeline definitions (stages, order) for all three pipeline types
- [ ] **ADMN-02**: All new pages have loading.tsx skeleton and error.tsx boundary
- [ ] **ADMN-03**: All new UI strings added to i18n system (Dutch + English)
- [ ] **ADMN-04**: proxy.ts updated for all new Supabase tables
- [ ] **ADMN-05**: All new migrations include GRANT statements and RLS policies

## v2 Requirements

Deferred to future release. Not in demo or incremental improvement.

### Analytics Enhancement

- **ANLYT-01**: Revenue chart visualization (bar/line charts for client totals using recharts)
- **ANLYT-02**: Consultant utilization rate calculation (billable days / total days)
- **ANLYT-03**: Pipeline → Revenue attribution (deal won → auto-create revenue entry)

### Future Features

- **FUTR-01**: AI-powered bench matching to open positions
- **FUTR-02**: External API integrations (Exact, Teamleader)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Drag-and-drop deal stage reordering | Demo only implied it, no persistence; high cost for low frequency |
| Real-time chat or messaging | Not in demo |
| Mobile app | Web only per PROJECT.md |
| External API integrations (Jira, Salesforce) | Not in demo, adds complexity |
| Email sending from CRM | Demo only logged communications |
| Client-side data filtering on lists | Breaks pagination, violates CLAUDE.md |
| Real-time sync on revenue grids | Causes row jitter and stale aggregates |
| Pixel-perfect demo recreation | Demo is rough prototype; shadcn/ui patterns preferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| ACCT-01 | Phase 2 | Pending |
| ACCT-02 | Phase 2 | Pending |
| ACCT-03 | Phase 2 | Complete |
| ACCT-04 | Phase 2 | Pending |
| ACCT-05 | Phase 2 | Pending |
| ACCT-06 | Phase 2 | Complete |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-03 | Phase 3 | Pending |
| DEAL-01 | Phase 3 | Pending |
| DEAL-02 | Phase 3 | Pending |
| DEAL-03 | Phase 3 | Pending |
| DEAL-04 | Phase 3 | Pending |
| DEAL-05 | Phase 3 | Pending |
| CNTR-01 | Phase 4 | Pending |
| CNTR-02 | Phase 4 | Pending |
| CNTR-03 | Phase 4 | Pending |
| CNTR-04 | Phase 4 | Pending |
| CNTR-05 | Phase 4 | Pending |
| CNTR-06 | Phase 4 | Pending |
| CNTR-07 | Phase 4 | Pending |
| CONS-01 | Phase 5 | Pending |
| CONS-02 | Phase 5 | Pending |
| CONS-03 | Phase 5 | Pending |
| CONS-04 | Phase 5 | Pending |
| REV-01 | Phase 6 | Pending |
| REV-02 | Phase 6 | Pending |
| REV-03 | Phase 6 | Pending |
| REV-04 | Phase 6 | Pending |
| REV-05 | Phase 6 | Pending |
| PROG-01 | Phase 7 | Pending |
| PROG-02 | Phase 7 | Pending |
| PROG-03 | Phase 7 | Pending |
| PROG-04 | Phase 7 | Pending |
| PIPE-01 | Phase 8 | Pending |
| PIPE-02 | Phase 8 | Pending |
| PIPE-03 | Phase 8 | Pending |
| PIPE-04 | Phase 8 | Pending |
| DASH-01 | Phase 9 | Pending |
| DASH-02 | Phase 9 | Pending |
| DASH-03 | Phase 9 | Pending |
| DASH-04 | Phase 9 | Pending |
| ADMN-01 | Phase 10 | Pending |
| ADMN-02 | Phase 10 | Pending |
| ADMN-03 | Phase 10 | Pending |
| ADMN-04 | Phase 10 | Pending |
| ADMN-05 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
