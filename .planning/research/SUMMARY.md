# Project Research Summary

**Project:** PHPro CRM — demo-to-production port
**Domain:** Consultancy staffing CRM (contracts, tariffs, revenue analytics, placement tracking)
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

This is a port project, not a greenfield build. The definitive feature specification is `demo_crm/src/App.tsx` (~5800 lines, Vue, all in-memory state) and the goal is 100% feature parity. The existing Next.js codebase already implements a substantial portion — accounts, contacts, deals, pipeline, kanban, bench management, HR/people, and base analytics scaffolding. What remains is completing the contract domain (7-section contract tab, hourly tariffs, SLA tariffs, indexation wizard persistence), wiring the revenue analytics to real DB data (prognose has no queries or actions yet), and several medium-complexity features that are partially modelled but not fully built (contract attribution, hosting environments, indexation history).

The recommended approach is to work domain-by-domain in dependency order: reference data first (it unblocks everything else), then the contract domain (it is the hub for indexation, SLA, hourly rates, and attribution), then revenue/analytics (which requires contract and revenue entry data to exist), and finally polish features (pipeline analytics tab, dashboard activity feed, quick-deal-from-bench). Each domain follows the established build order: migration → types → queries → actions → tab components → page integration → analytics. The architecture is well-established with 21 existing feature modules as templates — no architectural decisions remain open.

The primary risk is the gap between "looks done" and "actually persists." The demo uses in-memory state throughout, so many UI components exist in the Next.js project that appear complete but have no server-side wiring (prognose editing, indexation draft approval, file upload storing base64 instead of Storage paths). Every phase must include an explicit acceptance criterion that exercises the full persistence round-trip: edit → refresh → verify data survives. Secondary risks are client-side filtering (144 `.filter()` calls in the demo that must all become Supabase query parameters) and missing reference data blocking feature testing.

---

## Key Findings

### Recommended Stack

The base stack is fully established and requires no changes. Three additive libraries are needed for gap features: **recharts 2.x** (via `shadcn/ui chart` component) for revenue/prognose/pipeline bar and line charts; **react-number-format ^5.4.4** for editable currency cells in the prognose and pipeline grids; and **nuqs ^2.8.6** for URL-synced filter state on analytics list pages. All other gap features are covered by existing libraries (TanStack Table editable cells via `meta.updateData`, React Hook Form `useFieldArray` for nested contract forms, framer-motion for wizard transitions).

**Core additive technologies:**
- `recharts@^2.15.0` + shadcn chart component: charts for revenue analytics, prognose summaries, pipeline — must stay on v2.x until shadcn officially ports to v3; requires `react-is` override for React 19 compat
- `react-number-format@^5.4.4`: `nl-BE` locale currency inputs in editable grids — React 19 declared in peer deps
- `nuqs@^2.8.6`: type-safe URL search params for year/filter state on analytics pages — 6 kB, used by Supabase/Vercel/Sentry in production

**What NOT to add:** ag-grid, handsontable (overkill for N×12 grids), recharts v3 (shadcn not yet ported), tremor (redundant with shadcn chart), Zustand (existing wizards use local state and already work).

See `.planning/research/STACK.md` for full version compatibility notes and installation commands.

### Expected Features

This is a port, so "table stakes" means: already implemented in demo. The classification below reflects implementation status in the production codebase.

**Must have — P1 (blocks other work or is core workflow):**
- Reference data in `supabase/data/`: CC_NAMEN, TARIEF_ROLLEN, SLA_TOOL_SUGGESTIONS, HOSTING_PROVIDERS, AGORIA_INDICES — blocks every dependent feature from being testable
- Account detail full 7-tab wiring (contracts, revenue, contacts fully functional)
- Contract tab — complete 7-section view (raamcontract, servicecontract, bestelbon, hourly tariffs, SLA tariffs, indexation history, attribution)
- Per-account revenue tab (OmzetTab) wired to `revenue_entries` table
- Consultant contract attribution (direct vs. CC with split %)
- Indexation drafts persistence + history view
- Contact steerco flag (minor field addition)
- All missing demo data fixtures completed

**Should have — P2 (completes a domain, not blocking):**
- Hosting environment CRUD per account
- SLA tariff tools management
- Indexation history view
- Revenue multi-year grid with client/division/service drill-down
- Quick deal creation from bench
- Deal origin tracking (rechtstreeks/cronos with CC metadata)
- Prognose editing with year-over-year comparison

**Nice to have — P3 (polish or low-frequency):**
- Pipeline analytics tab (RTForecastTab equivalent)
- Dashboard activity feed

**Defer to v1.x/v2+:**
- Revenue bar chart visualizations (demo has rudimentary bars; charting adds polish, not core functionality)
- Consultant utilization rate calculation
- AI bench matching, external API integrations (Exact, Teamleader)

See `.planning/research/FEATURES.md` for full dependency graph and prioritization matrix.

### Architecture Approach

The architecture is established and documented — 21 existing feature modules serve as templates. The pattern is: async server page component fetches all tab data in `Promise.all` and passes as props; client components receive `initialData` and never fetch on mount; tab components from sibling features (e.g., `AccountDealsTab` in `features/deals/`) are imported into the parent detail component; mutations call server actions returning `ActionResult<T>` and update local state optimistically. No architectural decisions remain open — every new feature must follow the established build order: migration → types → queries → actions → tab components → parent detail integration → analytics components last.

**Major components and responsibilities:**
1. Page server component (`src/app/admin/<name>/page.tsx`) — parallel fetch, metadata export, props passthrough only
2. Detail component (client) — tab shell, assembles tabs from sibling features, never fetches
3. Tab component (client, owned by its feature) — scoped CRUD for one entity, receives `initialData`, local state after mutations
4. Wizard component (client) — multi-step modal with local step state, assembles after all step actions exist
5. Analytics component (client) — read-only, `useMemo` aggregation from server-provided flat rows
6. Queries (`React.cache`-wrapped) — server-side reads, one per entity type/list
7. Actions (`'use server'`) — Zod-validated mutations, always return `ActionResult<T>`, always call `revalidatePath`

See `.planning/research/ARCHITECTURE.md` for data flow diagrams and anti-pattern documentation.

### Critical Pitfalls

1. **Prognose has no DB schema or persistence** — `src/features/prognose/` has no `queries/` or `actions/` directories. UI exists and looks functional but resets to defaults on every visit. Must create `prognose_lines` migration, queries, and actions before any prognose UI work.

2. **Indexation approval must write to two tables** — the demo's "approve" mutates in-memory state. Production approve action must insert a new `hourly_rates` row for the target year AND an `indexation_history` entry. Wizard visually completes with just `revalidatePath()` — always verify a new rate row was created after approval.

3. **Revenue taxonomy must use FK references, not string keys** — the demo uses `RT_CLIENTS` (hardcoded constant with client names as keys). Any new revenue-related migration must use `account_id uuid` FK, not `client_name text`. Revenue entries already follow this pattern; verify any new prognose/forecast tables do too.

4. **Client-side filtering is endemic in the demo** — 144 `.filter()` calls in `demo_crm/src/App.tsx`. All must become `eqFilters`/`orFilter` in `fetchList`. Add "filter works correctly on page 2" to every list feature's acceptance criteria.

5. **Attribution split percentage needs sum constraint** — the demo allows any split percentage with no validation. Production must enforce `SUM(split_percentage) <= 100` per contract at the DB or action level. Show a "remaining: X%" counter in the UI.

Additional pitfalls: base64 PDF storage (use `useFileUpload` and Supabase Storage), missing `GRANT` in migrations (every new table needs explicit grants), missing `proxy.ts` entry for new routes (every new `/admin/*` route needs role mapping).

---

## Implications for Roadmap

### Phase 1: Foundation & Reference Data
**Rationale:** Reference data (CC names, tariff roles, SLA tools, hosting providers, Agoria indices) blocks testing of virtually every remaining feature. Without it, contract, indexation, SLA, hosting, and attribution features cannot be validated with realistic data. This is a low-cost, high-unblocking phase.
**Delivers:** All `supabase/data/` reference tables seeded; missing fixtures completed; `proxy.ts` entries added for any new routes planned in subsequent phases.
**Addresses:** CC_NAMEN, TARIEF_ROLLEN, SLA_TOOL_SUGGESTIONS, HOSTING_PROVIDERS, AGORIA_INDICES, CONSULTANT_ROLES, CC_SERVICES, VERDELING_OPTIES reference data; complete demo fixtures.
**Avoids:** Pitfall of building features that can't be tested because foreign key references don't exist.
**Research flag:** None — this is pure data migration, well-documented patterns.

### Phase 2: Contract Domain Completion
**Rationale:** The contract model is the hub feature: indexation, hourly rates, SLA tariffs, indexation history, and contract attribution all extend it. Completing contracts before analytics ensures the analytics phases have real data to display. The contract tab already has scaffolding (`contracts-tab.tsx`) but lacks all 7 sections.
**Delivers:** Full 7-section contract tab (raamcontract, servicecontract, bestelbon, hourly tariffs, SLA tariffs, indexation history, attribution); indexation wizard with DB persistence (drafts + approval writing `hourly_rates` + `indexation_history`); consultant contract attribution with split % validation; SLA tools management.
**Addresses:** Contract tab full view, SLA tariff management, indexation drafts persistence, indexation history view, contract attribution.
**Avoids:** Pitfall 3 (indexation approval not writing to DB), Pitfall 5 (embedded arrays as jsonb), Pitfall 7 (attribution sum > 100%).
**Architecture patterns:** Tab-with-embedded-sub-CRUD, multi-step wizard as modal (indexation wizard already established).
**Research flag:** None — all patterns are established in the codebase.

### Phase 3: Account Detail Completion
**Rationale:** The account detail page is the primary navigation target for sales managers. After contract domain is complete, all 7 account tabs can be fully wired. The per-account revenue tab and contacts steerco flag are here because they depend on revenue entries and contact model updates.
**Delivers:** All 7 account detail tabs fully functional; per-account revenue tab wired to `revenue_entries` filtered by `account_id`; contact steerco flag; hosting environment CRUD.
**Addresses:** Per-account revenue tab (OmzetTab), contact steerco flag, hosting environment CRUD, account detail 7-tab wiring.
**Avoids:** Pitfall 4 (client-side filtering in tab components), anti-pattern of fetching in tab components.
**Architecture patterns:** Cross-feature tab ownership (OmzetTab owned by `features/revenue/`, HostingTab owned by `features/hosting/`), parallel fetch at page level.
**Research flag:** None — established patterns.

### Phase 4: Revenue Analytics & Prognose
**Rationale:** Revenue analytics and prognose both depend on `revenue_entries` data existing (Phase 3) and reference taxonomy via FK (Phase 1). The prognose feature requires a DB migration before any UI work — this is the highest-risk phase because the existing UI gives a false impression of completeness.
**Delivers:** `prognose_lines` DB schema, queries, and actions; prognose editing with persistence and year-over-year comparison; revenue multi-year grid with client/division/service drill-down and expandable rows.
**Addresses:** Prognose editing with year comparison, revenue multi-year grid.
**Avoids:** Pitfall 1 (prognose has no DB schema — must create migration before any UI), Pitfall 6 (revenue taxonomy as string keys instead of FK), Pitfall 8 (prognose "looks done" after UI port).
**Stack additions:** recharts 2.x + shadcn chart component, react-number-format, nuqs for URL-synced year filter.
**Architecture patterns:** Cross-entity analytics as read-only client component with `useMemo` aggregation.
**Research flag:** Needs care — highest risk of "looks done but isn't." Mandate a refresh-persistence acceptance test for every editable cell.

### Phase 5: Pipeline Analytics & Deal Features
**Rationale:** Pipeline analytics (RTForecastTab equivalent) depends on deal data with stage and pipeline type, which is available after earlier phases. Quick deal creation from bench and deal origin tracking are low-complexity additions that round out the deal domain.
**Delivers:** Pipeline analytics tab with revenue contribution view; quick deal creation from bench; deal origin tracking (rechtstreeks/cronos with CC metadata).
**Addresses:** Pipeline analytics tab, quick deal from bench, deal origin tracking.
**Avoids:** Pitfall 4 (client-side filtering on pipeline data).
**Architecture patterns:** Cross-entity analytics as read-only client component.
**Research flag:** None — analytics pattern is well-established; deal additions are low-complexity.

### Phase 6: Polish & Dashboard
**Rationale:** Dashboard activity feed and any remaining UX polish (loading skeletons, error states, i18n completeness) are best left until core workflows are complete to avoid rework.
**Delivers:** Dashboard activity feed; complete `loading.tsx`/`error.tsx` coverage for all new routes; all UI strings in `messages/nl.json` + `messages/en.json`; `proxy.ts` audit for all routes added in Phases 1–5.
**Addresses:** Dashboard activity feed, UX completeness.
**Avoids:** Pitfall of hardcoded Dutch strings, missing `loading.tsx`/`error.tsx`, missing `proxy.ts` entries.
**Research flag:** None — standard patterns.

### Phase Ordering Rationale

- **Reference data must be Phase 1** because it is a prerequisite for testing any contract, attribution, SLA, or hosting feature. Zero implementation risk, maximum unblocking value.
- **Contracts before Analytics** because prognose and revenue analytics need real tariff and revenue entry data to display. Building analytics UI against empty tables produces false confidence.
- **Account completion before Analytics** because the per-account OmzetTab provides the data-entry surface that populates `revenue_entries`, which analytics reads.
- **Analytics before Pipeline** because pipeline analytics extends the same revenue contribution model established in the revenue analytics phase.
- **Deal features in Phase 5 not Phase 1** because quick-deal-from-bench and origin tracking have no blocking dependencies and low usage frequency compared to contract/revenue workflows.

### Research Flags

Phases needing particular care during implementation:
- **Phase 4 (Prognose/Analytics):** Highest risk of "looks done but isn't." Mandate refresh-persistence acceptance test. Enforce DB-first discipline: migration and actions before any UI component is touched.
- **Phase 2 (Contracts):** Indexation approval must be verified to write `hourly_rates` and `indexation_history` rows — not just call `revalidatePath`. Attribution split sum constraint must be enforced server-side.

Phases with standard, well-documented patterns:
- **Phase 1 (Reference Data):** Pure SQL data migrations following established `supabase/data/` pattern.
- **Phase 3 (Account Detail):** Cross-feature tab ownership pattern is established; just follow the build order.
- **Phase 5 (Pipeline/Deals):** Analytics and deal CRUD patterns fully established in the codebase.
- **Phase 6 (Polish):** Checklist work — loading/error files, i18n, proxy.ts audit.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack is established. Additive libraries (recharts, react-number-format, nuqs) verified against React 19 and Next.js 16 compatibility. One MEDIUM note: recharts 2.x React 19 compat requires `react-is` override — confirmed workaround from shadcn/ui official docs. |
| Features | HIGH | Primary source is `demo_crm/src/App.tsx` (authoritative, 5809 lines, directly inspected). Feature status validated against `PROJECT.md` and production codebase. |
| Architecture | HIGH | Based on direct codebase analysis of 21 existing feature modules. No inference required — patterns are already implemented and working. |
| Pitfalls | HIGH | Derived from direct code inspection of demo vs. production codebase differences, plus `CONCERNS.md` audit of existing bugs and fragile areas. |

**Overall confidence:** HIGH

### Gaps to Address

- **recharts v3 timeline:** shadcn/ui has not yet officially ported the chart component to recharts v3. This is fine for now (recharts 2.x works), but monitor the shadcn changelog. When shadcn releases official v3 support, upgrade to remove the `react-is` override.
- **Prognose line schema design:** The `prognose_lines` table schema needs to be designed before Phase 4. Key questions: how to model `mode` (copy/custom/stop), how to store the `12-month custom_amounts` array (separate columns vs. jsonb), and whether to store per-service lines or per-division totals. This is the one schema decision not already settled by the codebase.
- **Multi-tenant readiness:** Current schema has no `company_id` on most tables. Not a gap for this project (single-tenant use), but worth noting if PHPro ever wants to offer this to other Cronos entities.

---

## Sources

### Primary (HIGH confidence)
- `demo_crm/src/App.tsx` (5809 lines) — authoritative feature specification
- `demo_crm/src/constants.ts` — reference data schema and taxonomy
- `.planning/PROJECT.md` — validated active/done feature list
- `.planning/codebase/CONCERNS.md` — existing bugs, security gaps, fragile areas
- Direct codebase analysis: `src/features/accounts/`, `src/features/contracts/`, `src/features/prognose/`, `src/features/revenue/`, `src/features/indexation/`, `src/app/admin/accounts/[id]/page.tsx`
- `CLAUDE.md` (project rules) — authoritative architecture constraints

### Secondary (MEDIUM confidence)
- [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/radix/chart) — recharts v2 dependency confirmed
- [shadcn/ui React 19 guide](https://ui.shadcn.com/docs/react-19) — `react-is` override pattern
- [nuqs Next.js Conf 2025](https://nextjs.org/conf/session/type-safe-url-state-in-nextjs-with-nuqs) — App Router support confirmed
- [TanStack Table editable cells](https://tanstack.com/table/v8/docs/framework/react/examples/editable-data) — `meta.updateData` pattern
- [react-number-format npm](https://www.npmjs.com/package/react-number-format) — React 19 peer dep declared

### Tertiary (LOW confidence)
- [Contract Staffing: The Ultimate Agency Playbook](https://atzcrm.com/blog/contract-staffing-playbook/) — used for table-stakes validation only
- [Top 10 Consulting CRM](https://productive.io/blog/consulting-crm/) — competitive landscape, not architecture decisions

---

*Research completed: 2026-03-20*
*Ready for roadmap: yes*
