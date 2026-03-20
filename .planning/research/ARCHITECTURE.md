# Architecture Research

**Domain:** CRM + Consultancy Staffing Platform (Next.js 16 + Supabase)
**Researched:** 2026-03-20
**Confidence:** HIGH — based on direct codebase analysis of 21 existing feature modules

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page Layer                              │
│   src/app/admin/<name>/page.tsx  (async server components)      │
│   Fetch data in parallel → pass as props → export metadata      │
├─────────────────────────────────────────────────────────────────┤
│                      Feature Module Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ accounts │  │contracts │  │consultants│  │ revenue  │        │
│  │ queries/ │  │ actions/ │  │components/│  │  types   │        │
│  └────┬─────┘  └────┬─────┘  └────┬──────┘  └────┬─────┘       │
│       │             │             │               │             │
├───────┴─────────────┴─────────────┴───────────────┴─────────────┤
│                     Shared Library Layer                         │
│   src/lib/  →  useEntity, useRealtime, ActionResult,            │
│                Supabase clients (server/browser/admin)           │
├─────────────────────────────────────────────────────────────────┤
│                      Database Layer                              │
│   Supabase (self-hosted) — RLS on all tables                     │
│   Migrations / Production data / Fixtures                        │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Page (server) | Parallel data fetch, metadata, props passthrough | `Promise.all([q1(), q2()])` → pass to feature component |
| Detail component (client) | Tab shell + banner, accepts all tab data as props | `AccountDetail({ account, deals, contract, ... })` |
| Tab component (client) | Scoped CRUD for one entity within the detail context | `OmzetTab({ accountId, initialData })` |
| List component (client) | Paginated + filtered table, accepts `initialData` | `AccountList({ initialData, initialCount })` |
| Wizard component (client) | Multi-step modal with local step state | `IndexationWizard({ accountId, open, onClose })` |
| Analytics component (client) | Read-only data display, aggregated from initialData | `PipelinePageClient({ entries, divisions, year })` |
| Query (server) | React.cache-wrapped Supabase fetch | `export const getX = cache(async (id) => { ... })` |
| Action (server) | Zod-validated mutation → ActionResult<T> | `'use server'; export async function createX(...)` |

---

## Recommended Project Structure

The structure is established. This documents what exists and what new features must follow:

```
src/features/<name>/
├── actions/
│   ├── create-<name>.ts      # 'use server', Zod validate, ActionResult<T>
│   ├── update-<name>.ts
│   └── delete-<name>.ts
├── queries/
│   ├── get-<name>.ts         # React.cache(), single record
│   └── get-<names>.ts        # React.cache(), list with pagination
├── components/
│   ├── <name>-detail.tsx     # Tab shell for detail views
│   ├── <name>-<tab>-tab.tsx  # One file per tab
│   ├── <name>-list.tsx       # List view (initialData/initialCount)
│   └── <name>-form.tsx       # Create/edit form
├── types.ts                  # Zod schemas + DB row types
└── columns.tsx               # TanStack Table column defs (if table-based)
```

### Structure Rationale

- **One file per tab:** Each tab (`account-contacts-tab.tsx`, `account-deals-tab.tsx`) is its own component file. Tabs that show cross-feature data live in the source feature, not in the parent feature (e.g., `AccountDealsTab` is in `src/features/deals/components/`).
- **Tab components from foreign features:** When AccountDetail renders data that belongs to another feature (deals, contracts, consultants, revenue), those tab components live in THEIR feature folder and are imported into `account-detail.tsx`. This maintains ownership and avoids circular deps.
- **No sub-routes for tabs:** Tabs within a detail page are rendered client-side with shadcn `<Tabs>`, not as sub-routes (`/accounts/[id]/deals`). This avoids URL complexity and keeps all tab data loaded in one server fetch.

---

## Architectural Patterns

### Pattern 1: Parallel Fetch at Page Level (established, must be followed)

**What:** The page server component fetches ALL data needed by all tabs in one `Promise.all`, then passes everything as props to the detail component. The detail component never fetches.

**When to use:** Every detail page — account, contract, employee, consultant.

**Trade-offs:** Single round-trip to the database. Fetches data for tabs the user may never visit. For very heavy tabs (analytics), this is still better than a waterfall client fetch.

**Example (accounts/[id]/page.tsx pattern):**
```typescript
const [deals, contract, hourlyRates, slaRates, consultants, accountRevenue, contacts] =
  await Promise.all([
    getDealsByAccount(id),
    getContract(id),
    getHourlyRates(id),
    getSlaRates(id),
    getConsultantsByAccount(id),
    getAccountRevenue(id),
    getContactsByAccount(id),
  ]);
```

**Build order implication:** Queries must be written before the page. If a tab feature doesn't have its query yet, block that tab's data from the Promise.all — don't skip the pattern.

---

### Pattern 2: Tab Component with Embedded Sub-CRUD (established, extend for new tabs)

**What:** Tabs that manage a list of sub-entities (e.g., hourly rates per year, contacts per account) use local `useState` for optimistic updates after server action calls. They do NOT use `useEntity` or re-fetch from the server on every change.

**When to use:** Any tab showing an editable list of sub-records scoped to the parent entity.

**Trade-offs:** Optimistic updates feel fast. If the action fails silently, local state diverges. Keep mutations simple (CRUD on one table) to make this safe.

**Pattern (OmzetTab):**
```typescript
// Receive initial data from server
const [data, setData] = useState(initialData);

// After successful server action, update local state
const result = await createAccountRevenue(accountId, newValues);
if (result.success && result.data) {
  setData(prev => [newRecord, ...prev]);
}
```

**Applies to:** Hourly rates tab, SLA rates tab, indexation history tab, contact list tab, activities tab, pipeline entries, prognose lines.

**Build order implication:** The server action (`createX`, `updateX`, `deleteX`) must be written and working before the tab component. Types must be defined first.

---

### Pattern 3: Multi-Step Wizard as Modal (established for indexation)

**What:** Multi-step processes live entirely in a single client component rendered as a modal (`<Modal>` from `src/components/admin/modal`). Step state is local `useState(1)`. Each step calls a different server action. Data produced in step N is stored in component state and passed to step N+1.

**When to use:** Flows that are sequential (simulate → draft → approve), require confirmation before committing, and should not produce a URL-addressable state for each step.

**Trade-offs:** No URL-based step linking (can't bookmark step 2). Works fine for all current wizards. If a wizard exceeds 4-5 steps or needs async recovery, consider a dedicated route.

**Pattern (IndexationWizard):**
```typescript
const [step, setStep] = useState(1);
const [simulation, setSimulation] = useState<SimulationResult | null>(null);
const [draftId, setDraftId] = useState<string | null>(null);

// Step 1 → calls simulateIndexation → stores result → advances step
// Step 2 → calls saveIndexationDraft → stores draftId → advances step
// Step 3 → calls approveIndexation(accountId, draftId) → closes modal
```

**Applies to:** Indexation simulator (existing), quick deal creation from bench (new), consultant deploy/extend/stop flows, contract attribution wizard.

**Build order implication:** All server actions for all steps must exist before the wizard component. The wizard is assembled last.

---

### Pattern 4: Cross-Entity Analytics as Read-Only Client Component (established)

**What:** Analytics pages (`revenue`, `pipeline`, `prognose`) receive all data as server-provided props and perform all aggregation client-side using `useMemo`. They never re-fetch. Editing (prognose) uses the same tab-local-state pattern as sub-CRUD tabs.

**When to use:** Pages that aggregate across many entities (revenue by client/division/service/month) where the server query fetches a flat list and the UI groups/pivots it.

**Trade-offs:** Pivoting a large flat dataset client-side is fast at the scale of this CRM (hundreds of rows, not millions). No need to push aggregation to the database for now.

**Pattern (PrognoseEditor, PipelinePageClient):**
```typescript
// Server passes flat entries, client pivots
const byDivision = useMemo(() => {
  const groups = {};
  for (const e of entries) {
    groups[e.division.name] ??= { entries: [], total: 0 };
    groups[e.division.name].entries.push(e);
    groups[e.division.name].total += Number(e.total);
  }
  return Object.values(groups);
}, [entries]);
```

**Applies to:** Revenue analytics, pipeline analytics, prognose, dashboard stats.

**Build order implication:** Database queries returning the flat datasets must be complete. Analytics components are built last in each domain — they depend on the underlying data being populated.

---

### Pattern 5: Cross-Feature Tab Ownership (established, critical for new work)

**What:** When a parent detail page (AccountDetail) shows data from a sibling feature (deals, contracts, consultants), the tab component lives in the SIBLING feature folder, not in the accounts feature.

**When to use:** Every time a detail page needs a tab that performs CRUD on a different feature's entities.

**Why:** Keeps mutation logic (actions) co-located with query logic. AccountDetail does not import from `../actions/` to manage deals — it renders `<AccountDealsTab>` which internally knows how to call `deal` actions.

**Component ownership table:**
| Tab on AccountDetail | Owned By |
|----------------------|----------|
| Overview | `features/accounts/components/account-overview-tab.tsx` |
| Communicatie | `features/accounts/components/account-communications-tab.tsx` |
| Contacts | `features/accounts/components/account-contacts-tab.tsx` |
| Deals | `features/deals/components/account-deals-tab.tsx` |
| Contracten & Tarieven | `features/contracts/components/contracts-tab.tsx` |
| Consultants | `features/consultants/components/account-consultants-tab.tsx` |
| Omzet | `features/revenue/components/omzet-tab.tsx` |

**Build order implication:** The sibling feature's tab component can only be built after that feature's actions and queries exist.

---

## Data Flow

### Detail View Request Flow

```
User navigates to /admin/accounts/:id
        |
        v
accounts/[id]/page.tsx  (server component)
        |
        |-- getAccount(id)
        |-- getDealsByAccount(id)    ─┐
        |-- getContract(id)          │ Promise.all (parallel)
        |-- getHourlyRates(id)       │
        |-- getConsultantsByAccount  ─┘
        |
        v
<AccountDetail account={...} deals={...} contract={...} ...>
        |
        |-- renders tab shell (client, shadcn Tabs)
        |-- Tab content receives its slice of props
        |
        |-- User edits in tab (e.g., adds hourly rate)
        |       |
        |       v
        |   createHourlyRate(accountId, values)  (server action)
        |       |
        |       |-- Zod validate
        |       |-- Supabase insert
        |       |-- logAction(...)
        |       |-- revalidatePath('/admin/accounts/:id')
        |       |-- return ok({ id })
        |       |
        |       v
        |   Tab local state update (optimistic, from ActionResult)
```

### Wizard Flow

```
User clicks "Indexatie starten"
        |
        v
<IndexationWizard open={true} accountId={id}>
        |
Step 1: User fills form → simulateIndexation(accountId, year, %)
        |                         (server action, no DB write)
        |
Step 2: User reviews → saveIndexationDraft(accountId, values)
        |                   (server action, writes draft to DB)
        |
Step 3: User approves → approveIndexation(accountId, draftId)
                            (server action, applies rates, writes history)
                            → revalidatePath triggers page refresh
```

### Analytics Data Flow

```
Page (server) fetches flat dataset
        |
        v
Analytics client component (initialData props)
        |
        |-- useMemo to group/pivot/aggregate
        |-- No network calls on initial render
        |
        |-- User changes year/filter (if applicable)
        |       |
        |       v
        |   Re-derive from same data OR
        |   call search action to fetch new year's data
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single tenant, ~50 users) | Monolith is correct. All aggregation client-side is fine. |
| Multi-tenant (per-company isolation) | Add `company_id` to all tables + RLS policies. Queries receive company from auth context. Feature modules are unchanged. |
| Large data sets (>10K records) | Push pivots to DB views or Postgres functions. Analytics components receive pre-aggregated data instead of flat rows. |

### Scaling Priorities

1. **First bottleneck:** Detail pages fetching too many parallel queries. Fix: Lazy-load tabs that are not visible on initial render (activate query when tab is clicked, using a flag in state).
2. **Second bottleneck:** Analytics aggregating large flat datasets client-side. Fix: Migrate to DB-side aggregation with a Postgres view or RPC, keep component interface unchanged (still receives pre-aggregated data as props).

---

## Anti-Patterns

### Anti-Pattern 1: Fetching in Tab Components

**What people do:** Mount a tab, run `useEffect → fetch data from Supabase`, show loading spinner.

**Why it's wrong:** Creates a sequential waterfall: page renders → tab mounts → fetch starts → data arrives. Users see a blank tab with spinner on every navigation.

**Do this instead:** Fetch all tab data at page level in `Promise.all`. Pass as `initialData` prop. Tab renders immediately with server data. Only re-fetches on user interaction (add/edit/delete).

---

### Anti-Pattern 2: Putting Tab Components in the Wrong Feature

**What people do:** Add `<DealList>` or `<ContactList>` directly inside `src/features/accounts/components/account-detail.tsx` as inline components or local files.

**Why it's wrong:** Mutations for deals live in `features/deals/actions/`. Putting deal CRUD UI in the accounts feature creates a hard coupling and duplicates logic when deals need to be rendered elsewhere (e.g., dashboard, standalone deals page).

**Do this instead:** Create `src/features/deals/components/account-deals-tab.tsx`. Import it into `account-detail.tsx`. The tab knows its own mutations.

---

### Anti-Pattern 3: Wizard Steps as Separate Routes

**What people do:** Create `/admin/accounts/:id/indexation/step-1`, `/step-2`, `/step-3` as distinct pages.

**Why it's wrong:** Unnecessary route complexity. Each step transition requires a navigation event. Back-button behavior becomes unpredictable. State must be persisted in URL or session storage across steps.

**Do this instead:** Single modal component with local `useState(step)`. All step data lives in component state until the final confirm action commits everything to the database.

---

### Anti-Pattern 4: Direct `useEntity` in Detail Tab Components

**What people do:** Use `useEntity({ table: 'hourly_rates' })` inside a tab component to manage list state.

**Why it's wrong:** `useEntity` is designed for list pages with pagination and filters. It triggers an initial client-side fetch on mount (waterfall). It doesn't know about the parent entity scope.

**Do this instead:** Receive `initialData` as a prop (fetched by the page server component). Use local `useState(initialData)`. Call specific server actions for mutations. Update local state from the action result.

---

### Anti-Pattern 5: Aggregating in Server Queries That Should Stay Flat

**What people do:** Write a complex SQL query with `GROUP BY`, `SUM`, pivoting in the DB, and return a pre-aggregated shape tailored to one specific chart.

**Why it's wrong (at current scale):** Tight coupling between DB query and UI rendering. Hard to change the chart without modifying the query. The dataset is small enough that client-side aggregation with `useMemo` is faster to develop and maintain.

**Do this instead:** Return flat rows from the query. Group/pivot in the component with `useMemo`. If performance becomes a problem, add a DB view — the component interface stays the same.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| AccountDetail ↔ deals/contracts/consultants | Tab components imported from sibling features | Each tab owns its own CRUD actions |
| Page layer ↔ Feature queries | Direct import and call (no abstraction layer needed) | React.cache deduplicates same query called twice |
| Analytics ↔ Revenue/Pipeline data | Server passes flat entries; client pivots with useMemo | No API boundary needed at current scale |
| Wizard steps ↔ Server actions | Each step calls one specific server action | Actions are independent and idempotent per step |
| Contracts tab ↔ Indexation wizard | ContractsTab renders `<IndexationWizard>` trigger button | Wizard is in `features/indexation`, ContractsTab imports it |

---

## Build Order Implications for New Features

Features must be built in this dependency order within each domain:

```
1. Database migration (schema, RLS, grants)
2. Types (Zod schemas, TypeScript types)
3. Queries (React.cache, server-side reads)
4. Actions (server mutations, ActionResult<T>)
5. Tab components (receive initialData, call actions, local state)
6. Parent detail component (assemble tabs, import from sibling features)
7. Page server component (parallel fetch, pass props)
8. Analytics components (built last, depend on data being populated)
```

**Key constraint:** Tab components that belong to sibling features (deals tab on account detail) cannot be wired up until BOTH the deals feature queries/actions AND the accounts page integration are ready. Plan these as pairs.

---

## Sources

- Direct codebase analysis: `src/features/accounts/components/account-detail.tsx` (7-tab pattern)
- Direct codebase analysis: `src/features/indexation/components/indexation-wizard.tsx` (wizard pattern)
- Direct codebase analysis: `src/features/revenue/components/omzet-tab.tsx` (sub-CRUD tab pattern)
- Direct codebase analysis: `src/features/prognose/components/prognose-editor.tsx` (analytics + editable grid)
- Direct codebase analysis: `src/features/pipeline/components/pipeline-page-client.tsx` (analytics pattern)
- Direct codebase analysis: `src/app/admin/accounts/[id]/page.tsx` (parallel fetch page pattern)
- Project CLAUDE.md architectural rules (authoritative)

---

*Architecture research for: PHPro CRM — feature gap completion*
*Researched: 2026-03-20*
