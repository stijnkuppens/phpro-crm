# Phase 3: Contacts & Deals - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete contact personal info editing, steerco flag visibility, and role tracking in list/detail. Complete deal origin display, quick deal creation from bench, archief view, and ensure all three pipelines (Projecten, RFP, Consultancy Profielen) function correctly with pipeline-specific stages in both kanban and list views. Deal detail shows linked activities, tasks, and communications.

</domain>

<decisions>
## Implementation Decisions

### Contact List & Detail Display
- Steerco contacts shown as **badge in name column** in contact list — small "Steerco" badge next to name, no dedicated column
- Contact list gets **both role dropdown filter and steerco toggle** — server-side via eqFilters
- Contact detail page gets **inline editable personal info section** — a card with "Bewerken" button that toggles to edit mode, using existing `update-personal-info.ts` action
- Personal info displayed as **all fields visible** in a single card with 2-column grid layout — no collapsible sections (~12 fields is manageable)

### Deal Origin Display
- Origin shown as **colored badge in deal title column** in list view — "Direct" (green) or "Cronos" (blue), no extra column
- Kanban deal cards **also show origin badge** — subtle badge below the amount, fitting with existing card density
- Deal list gets **origin filter** dropdown alongside existing pipeline/owner/forecast filters — server-side via eqFilters

### Quick Deal from Bench
- QuickDealModal accessible from **both bench detail modal AND deals page**:
  - Bench detail modal: "Maak deal aan" button, pre-fills `bench_consultant_id`, `consultant_role`, auto-selects "Consultancy Profielen" pipeline
  - Deals page: "RFP / Profiel" secondary button (matching demo), user manually selects consultant
- Quick deal opens as **modal** (consistent with CommunicationModal pattern) — user stays on current page
- Pre-filled fields from bench: `bench_consultant_id`, `consultant_role` from consultant's role, pipeline auto-set to "Consultancy Profielen"
- QuickDealModal supports **both RFP and Consultancy Profielen** pipelines with toggle (matching demo) — shows hourly rate fields for Consultancy, amount field for RFP

### Deals Page Sub-Views
- Deals page has **3 sub-views** matching demo: "Deals" (list table), "Pipeline" (kanban), "Archief" (closed deals)
- Archief view shows closed deals (won/lost/longterm) separately from active list
- Pipeline kanban view has **pipeline tabs** (Projecten/RFP/Consultancy) to switch between pipeline-specific stage sets
- Deal list filters: pipeline chips, search, stage (dynamic per pipeline), lead source, owner, origin — all server-side

### Pipeline Stage Correctness
- All 3 pipeline stage sets are **confirmed correct** as currently seeded:
  - Projecten: Lead → Meeting → Demo → Voorstel → Onderhandeling → Gewonnen/Verloren/Longterm
  - RFP: Ontvangen → Kandidaatstelling → RFI → RFP → Onderhandeling → Gewonnen/Verloren/Longterm
  - Consultancy: Lead → CV/Info → Intake → Contract → Geplaatst/Niet weerhouden
- Pipeline stage management (CRUD) remains in **Phase 10** (ADMN-01) — no stage admin in this phase

### Deal Detail Linked Data
- Deal detail page shows **activities, tasks, and communications** linked to that deal (DEAL-04)
- Use existing feature module queries with `deal_id` filter

### Claude's Discretion
- Exact filter component layout and responsive behavior
- Archief view layout (table vs cards)
- Personal info edit mode toggle animation
- QuickDealModal responsive layout
- How to handle empty states for linked deal activities/tasks/communications

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Demo Reference
- `demo_crm/src/App.tsx` lines 2774-2860 — DealsListView with filters (pipeline chips, stage, lead source, owner, tags, show-closed toggle)
- `demo_crm/src/App.tsx` lines 3285-3365 — QuickDealModal for RFP/Consultancy with bench consultant selector, hourly rates, origin/Cronos fields
- `demo_crm/src/App.tsx` lines 3995-4027 — DealsPage with 3 sub-views (lijst/pipeline/archief), QuickDealModal + NewDealModal
- `demo_crm/src/App.tsx` lines 4126-4170 — Pipe (kanban) component with pipeline tabs, drag-and-drop, close deal strips

### Existing Implementation
- `src/features/contacts/types.ts` — Contact schemas with is_steerco, role, personalInfoFormSchema already defined
- `src/features/contacts/components/contact-detail.tsx` — Already shows steerco badge + role badge
- `src/features/contacts/components/contact-form.tsx` — Already has role select + is_steerco checkbox
- `src/features/contacts/actions/update-personal-info.ts` — Personal info update action exists
- `src/features/deals/types.ts` — Deal schema with origin, cronos_*, bench_consultant_id, consultant_role already defined
- `src/features/deals/components/deal-detail.tsx` — Already displays origin + Cronos fields
- `src/features/deals/components/deal-kanban.tsx` — Kanban with dnd-kit drag-and-drop
- `src/features/deals/components/deals-page-client.tsx` — Current deals page client component
- `src/features/deals/actions/close-deal.ts` — Close deal action exists
- `src/features/deals/components/close-deal-modal.tsx` — Close deal modal exists
- `src/features/deals/queries/get-deals-by-pipeline.ts` — Pipeline-specific deal query exists
- `src/features/bench/components/bench-detail-modal.tsx` — Bench detail modal (add button here)
- `src/features/bench/types.ts` — Bench consultant type for pre-fill data

### Seed Data
- `supabase/data/002_pipelines.sql` — Pipeline and stage seed data (confirmed correct)

### Architecture Rules
- `CLAUDE.md` §Server-First Data Flow — initialData pattern, no client-side waterfalls
- `CLAUDE.md` §Filtering — server-side only, no client-side .filter()
- `CLAUDE.md` §Feature Module Structure — actions, queries, components, types layout

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `contactFormSchema` + `personalInfoFormSchema`: All Zod schemas already defined with correct fields
- `update-personal-info.ts`: Server action ready to use for inline editing
- `DealKanban`: Fully working dnd-kit kanban — needs pipeline tab switcher added
- `close-deal-modal.tsx`: Close modal with won/lost/longterm selection — reuse for archief marking
- `deal-form.tsx`: Has origin/Cronos fields — reuse patterns for QuickDealModal
- `get-deals-by-pipeline.ts`: Pipeline-specific query — use for kanban pipeline tabs

### Established Patterns
- Badge in name column: used for account type badges in account list — apply same for steerco/origin
- Server-side filtering via `eqFilters` in `useEntity` hook
- Modal CRUD: CommunicationModal pattern (form in dialog, refresh on save)
- Tab/sub-view switching: account detail uses Tabs component; deals page demo uses button group

### Integration Points
- `src/features/contacts/columns.ts` — Add steerco badge to name column
- `src/features/contacts/components/contact-list.tsx` — Add role/steerco filters
- `src/features/contacts/components/contact-detail.tsx` — Add inline personal info edit section
- `src/features/deals/columns.ts` — Add origin badge to title column
- `src/features/deals/components/deals-page-client.tsx` — Add archief view, pipeline tabs on kanban
- `src/features/bench/components/bench-detail-modal.tsx` — Add "Maak deal aan" button
- `src/app/admin/deals/page.tsx` — May need additional queries for archief count

</code_context>

<specifics>
## Specific Ideas

- QuickDealModal should match the demo's 2-column wide layout with pipeline toggle (RFP/Consultancy), bench consultant selector for Consultancy, and hourly rate fields (gewenst/aangeboden) for Consultancy vs amount for RFP
- Deal list pipeline filter should use chip-style buttons (Alle/Projecten/RFP/Consultancy) matching the demo, not a dropdown
- Origin badges: "Direct" in green for rechtstreeks, "Cronos" in blue/amber for via Cronos — consistent with demo color scheme
- Personal info edit should feel lightweight — toggle to edit mode on the same card, not navigate away

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Pipeline stage CRUD confirmed to stay in Phase 10 (ADMN-01).

</deferred>

---

*Phase: 03-contacts-deals*
*Context gathered: 2026-03-20*
