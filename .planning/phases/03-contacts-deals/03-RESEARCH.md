# Phase 3: Contacts & Deals - Research

**Researched:** 2026-03-20
**Domain:** Contact personal info editing, deal origin/pipeline management, cross-feature modal integration
**Confidence:** HIGH

## Summary

Phase 3 builds on a substantial existing codebase. The contact feature already has schemas (`contactFormSchema`, `personalInfoFormSchema`), the `updatePersonalInfo` action, a detail component showing steerco/role badges, and a form with role select + steerco checkbox. The deals feature has origin/cronos fields in the schema and form, a working kanban with dnd-kit, close deal modal, and pipeline-specific queries. The primary work is: (1) enhancing list views with badges and filters, (2) building the inline personal info editor, (3) creating the QuickDealModal, (4) adding archief view and pipeline tabs to the deals page, and (5) adding deal-linked activities/tasks/communications to the deal detail page.

Critical gaps identified: the activities, tasks, and communications queries all lack `deal_id` filter support (needed for DEAL-04). The contact role list is missing "Steerco Lid" (9th role per requirements). The deals page currently filters closed deals client-side (`.filter((d) => !d.closed_at)`), which must move to server-side for the archief view.

**Primary recommendation:** Leverage all existing schemas, actions, and components. No new migrations needed (DB columns already exist). Focus on UI enhancements and query filter extensions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Steerco contacts shown as **badge in name column** in contact list -- small "Steerco" badge next to name, no dedicated column
- Contact list gets **both role dropdown filter and steerco toggle** -- server-side via eqFilters
- Contact detail page gets **inline editable personal info section** -- a card with "Bewerken" button that toggles to edit mode, using existing `update-personal-info.ts` action
- Personal info displayed as **all fields visible** in a single card with 2-column grid layout -- no collapsible sections
- Origin shown as **colored badge in deal title column** in list view -- "Direct" (green) or "Cronos" (blue), no extra column
- Kanban deal cards **also show origin badge** -- subtle badge below the amount
- Deal list gets **origin filter** dropdown alongside existing pipeline/owner/forecast filters -- server-side via eqFilters
- QuickDealModal accessible from **both bench detail modal AND deals page**
- Quick deal opens as **modal** (consistent with CommunicationModal pattern)
- QuickDealModal supports **both RFP and Consultancy Profielen** pipelines with toggle
- Deals page has **3 sub-views**: "Deals" (list table), "Pipeline" (kanban), "Archief" (closed deals)
- Pipeline kanban view has **pipeline tabs** to switch between pipeline-specific stage sets
- All 3 pipeline stage sets are **confirmed correct** as currently seeded
- Deal detail page shows **activities, tasks, and communications** linked to that deal

### Claude's Discretion
- Exact filter component layout and responsive behavior
- Archief view layout (table vs cards)
- Personal info edit mode toggle animation
- QuickDealModal responsive layout
- How to handle empty states for linked deal activities/tasks/communications

### Deferred Ideas (OUT OF SCOPE)
- Pipeline stage CRUD stays in Phase 10 (ADMN-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | Contact steerco flag visible in list and detail | Contact list columns need steerco badge in name column; detail already shows badge; list needs steerco toggle filter |
| CONT-02 | Contact role tracking with all 9 demo roles | Schema has 8 roles, missing "Steerco Lid" -- must add to Zod enum and ROLES constant in contact-form.tsx |
| CONT-03 | Contact personal info fully editable | `personalInfoFormSchema` and `updatePersonalInfo` action exist; need inline edit component on contact-detail.tsx |
| DEAL-01 | Deal origin tracking with CC metadata | Schema, form fields, and detail display already exist; need badge in columns.ts and kanban card |
| DEAL-02 | Quick deal from bench consultant | Need new QuickDealModal component; bench-detail-modal.tsx needs "Maak deal aan" button; deals page needs secondary button |
| DEAL-03 | Close deal modal with reason selection | Already fully implemented (close-deal-modal.tsx + close-deal.ts action) -- verify it works from kanban and list |
| DEAL-04 | Deal detail shows linked activities, tasks, communications | Queries need `deal_id` filter support; deal detail page needs tabs with linked data |
| DEAL-05 | All three pipeline types functional with correct stages | Seed data confirmed correct; kanban already works per-pipeline; need archief view + improved sub-view switching |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| @dnd-kit/core | Kanban drag-and-drop | Already used in deal-kanban.tsx |
| @tanstack/react-table | Table column definitions | Already used for all list views |
| shadcn/ui Dialog | Modal dialogs | Used by CloseDealModal, CommunicationModal |
| shadcn/ui Badge | Status badges | Used everywhere for type/role indicators |
| shadcn/ui Tabs | Sub-view switching | Used in DealsPageClient for pipeline tabs |
| sonner | Toast notifications | Used in all forms and actions |
| zod | Schema validation | Used in all form schemas |

### No New Dependencies
This phase requires zero new npm packages. Everything needed is already installed.

## Architecture Patterns

### Pattern 1: Badge in Name Column (Contact List)
**What:** Add steerco badge inline with the name in the column definition.
**When to use:** CONT-01 -- steerco visibility in list.
**Example:**
```typescript
// contacts/columns.ts -- add cell renderer to name column
{
  accessorFn: (row) => `${row.first_name} ${row.last_name}`,
  id: 'name',
  header: 'Naam',
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <span>{row.original.first_name} {row.original.last_name}</span>
      {row.original.is_steerco && <Badge variant="secondary" className="text-[10px]">Steerco</Badge>}
    </div>
  ),
}
```
**Source:** Same pattern used for forecast_category badge in deal-kanban.tsx line 76.

### Pattern 2: Inline Edit Card (Personal Info)
**What:** A card with display mode and edit mode toggled by a "Bewerken" button. Edit mode renders form fields; save calls `updatePersonalInfo`.
**When to use:** CONT-03 -- personal info editing on contact detail.
**Key considerations:**
- Use local `useState` for edit mode toggle
- Pre-fill form from `contact.personal_info` (may be null for new contacts)
- Hobbies field is `string[]` -- use comma-separated input or tag input
- Birthday is `string` (date format) -- use `<Input type="date" />`
- Booleans (invite_dinner, invite_event, invite_gift, has_children) -- use Checkbox
- After save, either `router.refresh()` or update local state optimistically

### Pattern 3: Filter Bar Component (Contact & Deal Lists)
**What:** Dedicated filter bar component with dropdowns and toggles, following AccountFiltersBar pattern.
**When to use:** CONT-01 (steerco toggle + role filter), DEAL-01 (origin filter).
**Key points:**
- Filter values stored in parent component state
- onChange triggers `fetchList()` with `eqFilters` parameter
- "All" option uses value `"all"` which maps to `undefined` in filter state
- Steerco toggle: use a simple Button or Switch, not a Select

### Pattern 4: QuickDealModal
**What:** A modal with pipeline toggle (RFP/Consultancy), pre-filled fields from bench consultant, origin/cronos fields.
**When to use:** DEAL-02 -- quick deal creation.
**Key design:**
- Pipeline toggle: two buttons at top, switching field visibility
- Consultancy shows: hourly rate fields (gewenst/aangeboden), bench consultant selector
- RFP shows: amount field
- Both show: title, account, contact, origin fields
- Pre-fill when opened from bench: `bench_consultant_id`, `consultant_role`, pipeline auto-set to Consultancy Profielen
- Use `Dialog` (shadcn) like CloseDealModal, not `Modal` (admin component)
- Needs pipeline IDs -- pass from server via props or fetch client-side

### Pattern 5: Deals Page Sub-Views
**What:** Three sub-views (Deals list, Pipeline kanban, Archief) with button group navigation.
**When to use:** DEAL-05 -- pipeline functionality.
**Current state:** DealsPageClient has kanban/list toggle. Need to add:
1. Third "Archief" view showing closed deals
2. Move closed deal filtering from client-side `.filter()` to server-side query
3. Add `is_closed` or `closed_at` filter to `getDeals` and `DealFilters`

### Pattern 6: Deal Detail Linked Data Tabs
**What:** Deal detail page with tabs showing activities, tasks, communications filtered by `deal_id`.
**When to use:** DEAL-04.
**Key work:**
- Add `deal_id` filter to `getActivities`, `getTasks`, `getCommunications` queries
- Add `deal_id` to `ActivityFilters`, `TaskFilters`, `CommunicationFilters` types
- Reuse `AccountActivitiesTab` pattern but with `dealId` prop instead of `accountId`
- Server component fetches all three in parallel, passes as initialData

### Anti-Patterns to Avoid
- **Client-side filtering of closed deals:** Current `deals-page-client.tsx` line 84 uses `.filter((d) => !d.closed_at)` -- this only filters the current page and breaks pagination. Must filter server-side.
- **Adding columns for badges:** Decision says badges go IN existing columns (name column for steerco, title column for origin), not as separate columns.
- **Separate route for archief:** Archief is a sub-view within the deals page, not a separate route.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop kanban | Custom drag logic | @dnd-kit/core (already used) | Complex edge cases with touch, accessibility |
| Form validation | Manual checks | Zod schemas (already defined) | Consistent error handling, type inference |
| Toast notifications | Custom alerts | sonner (already used) | Consistent UX, auto-dismiss |
| Modal dialogs | Custom overlay | shadcn Dialog (already used) | Focus trap, escape handling, animation |

## Common Pitfalls

### Pitfall 1: Missing "Steerco Lid" Role
**What goes wrong:** The contact form schema has 8 roles but requirements specify 9 (missing "Steerco Lid").
**Why it happens:** Initial schema was created before the full role list was finalized.
**How to avoid:** Add "Steerco Lid" to the Zod enum in `contactFormSchema` AND the `ROLES` constant in `contact-form.tsx`.
**Warning signs:** Role dropdown missing an option, fixtures data with "Steerco Lid" role failing validation.

### Pitfall 2: Client-Side Closed Deal Filtering
**What goes wrong:** The deals page kanban filters closed deals with `.filter((d) => !d.closed_at)` in the client. This means: (a) closed deals still count in pagination, (b) pages may appear mostly empty, (c) archief view can't get proper count.
**Why it happens:** Quick initial implementation before archief view was planned.
**How to avoid:** Add `closed_at` IS NULL / IS NOT NULL filter to server queries. Kanban query should exclude closed; archief query should include only closed.
**Warning signs:** Deal count showing more than visible cards, empty-ish pages.

### Pitfall 3: Query Filter Extensions Need Type Updates
**What goes wrong:** Adding `deal_id` filter to queries without updating the filter type causes TypeScript errors.
**Why it happens:** Filter types (`ActivityFilters`, `TaskFilters`, `CommunicationFilters`) are separate from the query params.
**How to avoid:** Update filter type, query function, AND any component that constructs the filter object -- all three.

### Pitfall 4: QuickDealModal Pipeline ID Hardcoding
**What goes wrong:** Hardcoding pipeline UUIDs from seed data creates fragility.
**Why it happens:** Seed data uses fixed UUIDs (`00000000-0000-4000-8000-000000000003` for Consultancy).
**How to avoid:** Pass pipelines as props from server, or look up by `type` field (`'consultancy'`, `'rfp'`). The `type` field is the stable identifier.
**Warning signs:** "Pipeline niet gevonden" errors in production with different UUIDs.

### Pitfall 5: Personal Info Null Handling
**What goes wrong:** `contact.personal_info` is null for contacts that have never had personal info saved. The inline edit form must handle both creating (upsert) and updating.
**Why it happens:** `contact_personal_info` is a separate table with optional 1:1 relationship.
**How to avoid:** `updatePersonalInfo` already uses upsert with `onConflict: 'contact_id'` -- this handles both cases. The form should default all fields to empty/false when `personal_info` is null.

### Pitfall 6: Columns File Extension
**What goes wrong:** `contacts/columns.ts` needs JSX for the badge cell renderer but is a `.ts` file.
**Why it happens:** Original columns didn't need JSX (just string accessors).
**How to avoid:** Rename to `columns.tsx` when adding cell renderers with JSX. Note: `deals/columns.ts` will also need rename for origin badge. Check that `deal-list.tsx` and `contact-list.tsx` imports are updated.

## Code Examples

### Contact Steerco Badge in Name Column
```tsx
// src/features/contacts/columns.tsx (renamed from .ts)
import { Badge } from '@/components/ui/badge';

{
  accessorFn: (row) => `${row.first_name} ${row.last_name}`,
  id: 'name',
  header: 'Naam',
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <span>{row.original.first_name} {row.original.last_name}</span>
      {row.original.is_steerco && (
        <Badge variant="secondary" className="text-[10px]">Steerco</Badge>
      )}
    </div>
  ),
}
```

### Deal Origin Badge in Title Column
```tsx
// src/features/deals/columns.tsx (renamed from .ts)
import { Badge } from '@/components/ui/badge';

const ORIGIN_BADGE: Record<string, { label: string; className: string }> = {
  rechtstreeks: { label: 'Direct', className: 'bg-green-100 text-green-800 border-green-200' },
  cronos: { label: 'Cronos', className: 'bg-blue-100 text-blue-800 border-blue-200' },
};

{
  accessorKey: 'title',
  header: 'Titel',
  cell: ({ row }) => {
    const origin = row.original.origin;
    const badge = origin ? ORIGIN_BADGE[origin] : null;
    return (
      <div className="flex items-center gap-2">
        <span>{row.original.title}</span>
        {badge && (
          <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
            {badge.label}
          </Badge>
        )}
      </div>
    );
  },
}
```

### Adding deal_id Filter to Existing Query
```typescript
// In get-activities.ts, add after existing filters:
if (filters?.deal_id) {
  query = query.eq('deal_id', filters.deal_id);
}

// In types.ts, update ActivityFilters:
export type ActivityFilters = {
  search?: string;
  type?: string;
  account_id?: string;
  deal_id?: string;
  is_done?: boolean;
};
```

### Inline Personal Info Edit Card Pattern
```tsx
// Simplified pattern for contact-detail.tsx enhancement
const [editing, setEditing] = useState(false);
const [saving, setSaving] = useState(false);

async function handleSave(values: PersonalInfoFormValues) {
  setSaving(true);
  const result = await updatePersonalInfo(contact.id, values);
  setSaving(false);
  if (result.success) {
    toast.success('Persoonlijke info bijgewerkt');
    setEditing(false);
    router.refresh();
  } else {
    toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
  }
}
```

### Sub-View Button Group Pattern
```tsx
// For deals page 3-way view switching
type ViewMode = 'list' | 'kanban' | 'archief';

<div className="flex gap-1 rounded-lg border p-1">
  {[
    { value: 'list', label: 'Deals', icon: List },
    { value: 'kanban', label: 'Pipeline', icon: LayoutGrid },
    { value: 'archief', label: 'Archief', icon: Archive },
  ].map(({ value, label, icon: Icon }) => (
    <Button
      key={value}
      variant={viewMode === value ? 'default' : 'ghost'}
      size="sm"
      onClick={() => setViewMode(value as ViewMode)}
    >
      <Icon className="h-4 w-4 mr-1" /> {label}
    </Button>
  ))}
</div>
```

## State of the Art

| Current State | What Needs Changing | Impact |
|---------------|---------------------|--------|
| Contact columns.ts is plain .ts | Rename to .tsx for JSX cell renderers | Enables badge rendering in columns |
| Deal columns.ts is plain .ts | Rename to .tsx for JSX cell renderers | Enables origin badge rendering |
| Kanban filters closed deals client-side | Move to server-side `.is('closed_at', null)` | Correct pagination, archief support |
| Activities/tasks/communications queries lack deal_id filter | Add deal_id filter to all three | Enables DEAL-04 linked data |
| Contact role schema has 8 roles | Add "Steerco Lid" as 9th role | Full role coverage per requirements |
| Deal detail page is static cards | Add tabs for activities/tasks/communications | Enables DEAL-04 |
| Deals page has 2 views (kanban/list) | Add archief as 3rd view | Complete DEAL-05 |
| DealFilters lacks origin/closed filters | Add origin + is_closed to DealFilters | Server-side filtering for both features |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Steerco badge visible in contact list, toggle filter works | manual-only | Visual check in browser | N/A |
| CONT-02 | All 9 roles available in dropdown, persists on save | manual-only | Visual check + save test | N/A |
| CONT-03 | Personal info fields editable, persist after refresh | manual-only | Edit fields, refresh, verify | N/A |
| DEAL-01 | Origin badge in list + kanban, origin filter works | manual-only | Visual check in browser | N/A |
| DEAL-02 | Quick deal from bench opens pre-filled modal | manual-only | Click button, verify pre-fill | N/A |
| DEAL-03 | Close deal modal with reason selection | manual-only | Already implemented, verify | N/A |
| DEAL-04 | Deal detail shows linked activities/tasks/comms | manual-only | Open deal detail, check tabs | N/A |
| DEAL-05 | All 3 pipelines display with correct stages | manual-only | Switch pipelines in kanban/list | N/A |

### Sampling Rate
- **Per task commit:** Manual browser verification of changed feature
- **Per wave merge:** Full manual walkthrough of all 8 requirements
- **Phase gate:** All 7 success criteria verified via browser

### Wave 0 Gaps
- No test framework configured -- all validation is manual browser testing
- This is acceptable for a UI-focused phase with no complex logic

## Open Questions

1. **Hourly rate fields in QuickDealModal**
   - What we know: Demo shows "gewenst tarief" and "aangeboden tarief" for Consultancy pipeline
   - What's unclear: These fields are NOT in the current `dealFormSchema` or `deals` table columns
   - Recommendation: Check if `deals` table has `hourly_rate_desired` / `hourly_rate_offered` columns. If not, either add them via migration or use `description` field as workaround. The demo may use these in a different context (active_consultants table).

2. **Bench consultant selector in QuickDealModal**
   - What we know: When opening from deals page (not bench), user manually selects consultant
   - What's unclear: How to render consultant search/select -- Combobox with search or simple Select
   - Recommendation: Use a simple Select with bench consultants loaded from server. The list is small enough (bench = available consultants).

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all files listed in canonical refs
- `contacts/types.ts` -- schema analysis, role list verification
- `deals/types.ts` -- schema analysis, origin field verification
- `activities/queries/get-activities.ts` -- filter gap identification
- `tasks/queries/get-tasks.ts` -- filter gap identification
- `communications/queries/get-communications.ts` -- filter gap identification
- `deals/components/deals-page-client.tsx` -- client-side filter identification
- `supabase/data/002_pipelines.sql` -- pipeline stage verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, zero new dependencies
- Architecture: HIGH -- all patterns derived from existing codebase conventions
- Pitfalls: HIGH -- identified from direct code inspection of current state
- Requirements coverage: HIGH -- all 8 requirements mapped to specific code changes

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable -- no external dependency changes expected)
