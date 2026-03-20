# Phase 2: Account Detail Completion - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

All 7 account detail tabs fully functional with DB-backed CRUD. The detail page already has server-first data flow with Promise.all() parallel fetch for 7 data sources, and all tab components render. This phase completes the gaps: hosting CRUD, relation multi-select editors on the edit page, an Activities tab, communication tab upgrade to match the demo timeline, and missing error.tsx.

</domain>

<decisions>
## Implementation Decisions

### Hosting CRUD
- Hosting create/edit/delete lives in the **account edit page** (not the overview tab) — matching the demo pattern
- Overview tab stays **read-only** for hosting display (cards with provider, environment, URL)
- Hosting editing uses a **modal form** — click "Add hosting" or pencil icon opens a modal with provider (select from ref_hosting_providers), environment type (select from ref_hosting_environments), URL (text input), notes (textarea)
- **Just 4 fields** per hosting entry: provider, environment type, URL, notes — no status field, matches demo exactly
- Delete via trash icon on each hosting card

### Relation Editing (All in Edit Page)
- **All relation CRUD happens in the account edit page/form**, not inline on the overview tab
- Overview tab stays **read-only** — badges and cards for display only
- Keep the existing `/admin/accounts/[id]/edit` **page route** (not switching to modal like demo)
- Relation types to support on edit page:
  - **Tech Stack** — tag chips with × to remove, combobox to add (from ref_technologies)
  - **PHPro Services** — same tag + combobox pattern (from ref_services or manual_services)
  - **Competence Centers** — text input + "Toevoegen" button
  - **Samenwerkingsvormen** — toggle buttons / multi-select chips
  - **Hosting** — inline add form (provider + environment dropdown + "Toevoegen"), expandable cards with URL + notes below
- The `manage-account-relations.ts` server action already supports all junction tables — reuse it

### Tab Structure
- Account detail will have **8 tabs** (7 from requirements + Omzet that already exists):
  1. Overview (read-only summary)
  2. Communicatie (upgraded timeline)
  3. Contracten & Tarieven (existing, completed in Phase 4)
  4. Consultants (existing)
  5. Contacts (existing)
  6. Deals (existing)
  7. Activiteiten (NEW — planned/completed activities for this account)
  8. Omzet (existing with CRUD)
- The demo only had 6 tabs — Activities and Omzet are production additions beyond demo parity

### Activities Tab (New)
- New `account-activities-tab.tsx` component showing activities filtered by `account_id`
- Displays both **planned and completed** activities (meetings, demos, calls, etc.)
- Includes a **"Nieuwe activiteit" button** that opens the activity form pre-filled with `account_id`
- Full CRUD (create, mark done, edit, delete) without leaving the account detail page
- Reuses the existing `activities` feature module (queries support `account_id` filter, form/actions exist)
- Should accept `initialData` from server to follow server-first pattern

### Communication Tab Upgrade
- Replace the current simple list with a **demo-matching expandable timeline**:
  - Expandable cards with type icon (color-coded by type)
  - Body text preview (collapsed by default, click to expand)
  - Type filter chips: Alles, E-mail, Notitie, Meeting, Call
  - Linked contact name and deal title shown per entry
- **Fix server-first data flow**: accept `initialData` from server component instead of client-side `useEntity` fetch
- Query must be updated to **join contacts and deals** for linked names
- Keep the existing "Nieuwe Communicatie" button and `CommunicationModal`

### Detail Route Completeness
- Add missing `error.tsx` for the `[id]` route

### Claude's Discretion
- Exact combobox/tag component implementation for relation editing
- Activity tab layout (list vs cards vs timeline)
- Communication timeline expand/collapse animation
- Loading states within tabs
- Whether to use the existing `useEntity` hook for client-side re-fetching after mutations or use `revalidatePath`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Demo Reference
- `demo_crm/src/App.tsx` lines 2247-2250 — Account detail tab structure (6 tabs in demo)
- `demo_crm/src/App.tsx` lines 2090-2130 — Communication tab timeline with type filters, expandable body, linked contacts/deals
- `demo_crm/src/App.tsx` lines 2904-2911 — Activity types (Meeting, Call, Mail, Demo, Voorstel, Andere)
- `demo_crm/src/App.tsx` — Account edit modal showing all relation editors (hosting inline, tech stack tags, services tags, CC input, samenwerkingsvormen toggles)

### Existing Implementation
- `src/features/accounts/components/account-detail.tsx` — Current 7-tab component with all data passed as props
- `src/features/accounts/components/account-overview-tab.tsx` — Read-only overview with hosting cards, tech stack badges, CC list
- `src/features/accounts/components/account-communications-tab.tsx` — Current simple list (needs upgrade)
- `src/features/accounts/actions/manage-account-relations.ts` — Server action supporting all junction table CRUD
- `src/features/activities/` — Full activities feature module (types, queries, actions, components)
- `src/features/communications/types.ts` — Communication schema with contact_id, deal_id, content fields
- `src/app/admin/accounts/[id]/page.tsx` — Server component with Promise.all() parallel fetch

### Architecture Rules
- `CLAUDE.md` §Server-First Data Flow — initialData pattern, no client-side waterfalls
- `CLAUDE.md` §Feature Module Structure — actions, queries, components, types layout
- `CLAUDE.md` §Route Structure — error.tsx required for detail routes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `manage-account-relations.ts`: Generic add/remove for all junction tables — reuse for tag/chip editors
- `CommunicationModal`: Existing create modal for communications — keep as-is
- `activities` feature module: Full CRUD with account_id filtering — reuse queries and form
- `useEntity` hook: Client-side CRUD with pagination — used by communications tab (needs initialData fix)
- `OmzetTab`: Example of inline CRUD within a tab using initialData pattern

### Established Patterns
- Server-first data flow: page.tsx fetches via React.cache queries, passes as initialData props
- Junction table pattern: `account_tech_stacks`, `account_hosting`, `account_competence_centers`, etc.
- Tab component pattern: each tab is a separate client component receiving data via props
- Modal pattern: CommunicationModal, ActivityForm — form in dialog, refresh data on close

### Integration Points
- `src/app/admin/accounts/[id]/page.tsx` — needs additional query for activities, needs error.tsx sibling
- Account edit page — needs relation management sections added to the existing form
- Communication query — needs joins to contacts and deals tables
- Activities query `getActivities()` — already supports `account_id` filter

</code_context>

<specifics>
## Specific Ideas

- Hosting CRUD UI should match the demo screenshot: provider input + environment dropdown + "Toevoegen" button, with expandable cards below showing URL + notes + delete icon
- Communication timeline should match demo: color-coded type icons, expandable body preview, linked contact/deal badges
- Tech stack and services editors should use tag-style chips with × to remove and combobox to add — similar to the demo screenshot

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-account-detail-completion*
*Context gathered: 2026-03-20*
