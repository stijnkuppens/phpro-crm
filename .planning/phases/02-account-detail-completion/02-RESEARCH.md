# Phase 2: Account Detail Completion - Research

**Researched:** 2026-03-20
**Domain:** Account detail page — tabs, hosting CRUD, relation editors, communication timeline, activities tab, revenue tab
**Confidence:** HIGH

## Summary

Phase 2 completes the account detail page by wiring all 8 tabs to DB-persisted data with full CRUD. The existing codebase already has substantial infrastructure: the detail page has server-first `Promise.all()` fetch for 7 data sources, the `AccountDetail` component renders 7 tabs, the `AccountForm` already contains relation editors (hosting, tech stack, services, CC, samenwerkingsvormen) with `RefChipInput`/`StringChipInput` components, and the `manage-account-relations.ts` server action handles all junction table CRUD.

The main gaps are: (1) no Activities tab on the detail page (but the `activities` feature module is complete with queries/actions/components), (2) the communications tab uses client-side `useEntity` fetch instead of `initialData` (server-first violation), (3) no `error.tsx` for the `[id]` route, and (4) the communication query lacks deal joins. The edit page route does not exist yet (`/admin/accounts/[id]/edit`), but CONTEXT.md says to "keep the existing `/admin/accounts/[id]/edit` page route" -- this needs to be created.

**Primary recommendation:** Wire existing components and infrastructure together. Minimal new code is needed -- this is primarily an integration phase. The activities tab reuses the existing feature module, hosting CRUD is already in the form, and communications just needs the server-first fix + timeline UI upgrade.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hosting CRUD lives in the **account edit page** (not overview tab) -- overview stays read-only
- Hosting uses a **modal form** with 4 fields: provider, environment type, URL, notes
- **All relation CRUD happens in the account edit page**, not inline on overview tab
- Overview tab stays **read-only** -- badges and cards for display only
- Keep the `/admin/accounts/[id]/edit` **page route** (not modal)
- Relation types on edit: Tech Stack (tag chips + combobox), PHPro Services (same), Competence Centers (text input + button), Samenwerkingsvormen (toggle buttons), Hosting (inline add with expandable cards)
- Reuse `manage-account-relations.ts` server action for all junction tables
- **8 tabs**: Overview, Communicatie, Contracten & Tarieven, Consultants, Contacts, Deals, Activiteiten (NEW), Omzet
- Activities tab: new component with `initialData`, "Nieuwe activiteit" button, full CRUD, pre-filled `account_id`
- Communication tab: upgrade to expandable timeline with type filter chips, color-coded icons, linked contact/deal badges
- Communication must accept `initialData` from server (fix server-first violation)
- Communication query must join contacts AND deals
- Add missing `error.tsx` for `[id]` route

### Claude's Discretion
- Exact combobox/tag component implementation for relation editing
- Activity tab layout (list vs cards vs timeline)
- Communication timeline expand/collapse animation
- Loading states within tabs
- Whether to use `useEntity` hook for client-side re-fetching after mutations or use `revalidatePath`

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACCT-01 | Account detail page has all 7 tabs fully functional | Add Activities tab (8th tab), wire all with initialData, add error.tsx |
| ACCT-02 | Account overview tab shows contract status, health score, tech stack, services, CC, samenwerkingsvormen | Already implemented in `account-overview-tab.tsx` -- read-only display complete |
| ACCT-03 | Account hosting environment CRUD | Already in `AccountForm` via hosting section; needs edit page route creation |
| ACCT-04 | Account revenue tab with per-account revenue CRUD | Already implemented in `OmzetTab` with initialData pattern |
| ACCT-05 | Account communication tab with full interaction history and create modal | Needs server-first fix, timeline UI upgrade, deal join in query |
| ACCT-06 | All account relation management working with CRUD | Already in `AccountForm`; needs edit page route to expose it |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| shadcn/ui (Tabs, Badge, Card, Button, Dialog) | All tab and CRUD UI | Project standard |
| @tanstack/react-table | Not needed this phase | Table views not involved |
| lucide-react | Icons for type badges and actions | Project standard |
| sonner | Toast notifications for CRUD feedback | Project standard |
| zod | Form validation | Project standard |

### No New Dependencies
This phase requires zero new package installations. All needed UI components and libraries are already available.

## Architecture Patterns

### Recommended File Changes/Additions

```
src/app/admin/accounts/[id]/
  error.tsx                          # NEW - missing error boundary
  edit/
    page.tsx                         # NEW - edit page route (server component)
    loading.tsx                      # NEW - skeleton

src/features/accounts/components/
  account-detail.tsx                 # MODIFY - add Activities tab (8th tab)
  account-activities-tab.tsx         # NEW - activities tab component
  account-communications-tab.tsx     # MODIFY - server-first + timeline upgrade

src/features/communications/queries/
  get-communications.ts              # MODIFY - add deal join

src/app/admin/accounts/[id]/
  page.tsx                           # MODIFY - add activities query to Promise.all, pass communications initialData
```

### Pattern 1: Server-First Tab Data (established pattern)
**What:** Server component fetches, passes as `initialData` prop to client tab component
**When to use:** Every tab component must follow this pattern
**Example (from existing OmzetTab):**
```tsx
// page.tsx (server)
const [activities, communications] = await Promise.all([
  getActivities({ filters: { account_id: id } }),
  getCommunications({ filters: { account_id: id } }),
]);

// In AccountDetail component:
<AccountActivitiesTab accountId={account.id} initialData={activities.data} initialCount={activities.count} />
<AccountCommunicationsTab accountId={account.id} initialData={communications.data} initialCount={communications.count} />
```

### Pattern 2: Inline CRUD with Local State (established pattern)
**What:** Tab receives `initialData`, maintains local state, calls server actions, optimistically updates state
**When to use:** OmzetTab already implements this pattern -- Activities tab should follow the same approach
**Example (from OmzetTab):**
```tsx
const [data, setData] = useState(initialData);

async function handleCreate() {
  const result = await createActivity(values);
  if (result.success && result.data) {
    setData((prev) => [newEntry, ...prev]);
  }
}
```

### Pattern 3: Edit Page with Relation Sync (established pattern)
**What:** Edit page fetches account + reference data, passes to AccountForm which handles relation sync on submit
**When to use:** The edit page route
**Key insight:** `AccountForm` already has all relation editors built in. The edit page just needs to:
1. Fetch the account with relations (`getAccount(id)`)
2. Fetch reference data (technologies, collaboration types, etc.)
3. Transform `AccountWithRelations` into `defaultValues` format the form expects
4. Render `<AccountForm referenceData={ref} defaultValues={transformed} />`

### Pattern 4: Communication Timeline (new, following demo)
**What:** Expandable cards with type-colored icons, collapsed body preview, filter chips
**When to use:** Communication tab only
**Key elements:**
- Type filter chips: Alles, E-mail, Notitie, Meeting, Call
- Each entry: color-coded icon, subject, body preview (collapsed), linked deal/contact badges, date
- Click to expand full body
- Local state for `expanded` map and `typeFilter`

### Anti-Patterns to Avoid
- **Client-side fetch in tabs:** Current communications tab does `useEntity` + `useEffect` fetch. This creates a waterfall. Fix: accept `initialData` and only re-fetch on filter change.
- **Creating a new hosting feature module:** Hosting CRUD is already part of the AccountForm. Don't create separate `features/hosting/` directory.
- **Duplicating activity form:** The `ActivityForm` component exists. Reuse it in the activities tab via a modal/dialog.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hosting CRUD | New hosting actions | `manage-account-relations.ts` `addAccountRelation`/`deleteAccountRelation` | Already supports `account_hosting` table |
| Relation sync | Custom sync logic | `syncAccountFKRelation` for FK tables, `addAccountRelation`/`deleteAccountRelation` for entity tables | Handles delete-all + re-insert pattern |
| Activity CRUD | New activity actions | Existing `createActivity`/`updateActivity`/`deleteActivity` in `features/activities/actions/` | Full CRUD already built |
| Activity query with account filter | New query | Existing `getActivities({ filters: { account_id } })` | Already supports account_id filter |
| Tag/chip input | Custom component | Existing `RefChipInput` in `account-form.tsx` | Already built with suggestion dropdown |
| Communication modal | New modal | Existing `CommunicationModal` in `features/communications/components/` | Supports create and edit |

## Common Pitfalls

### Pitfall 1: Missing edit page route
**What goes wrong:** CONTEXT.md references "keep the existing `/admin/accounts/[id]/edit` page route" but it does not exist yet.
**Why it happens:** Misunderstanding of current state -- the form exists but the route doesn't.
**How to avoid:** Create the edit page route as a server component that fetches account + reference data and renders AccountForm.
**Warning signs:** 404 when clicking "Bewerken" link on detail page.

### Pitfall 2: Communications tab server-first violation
**What goes wrong:** The current `AccountCommunicationsTab` uses `useEntity` + `useEffect` to fetch on mount, causing a loading flash and waterfall.
**Why it happens:** Original implementation didn't follow the server-first pattern.
**How to avoid:** Add `initialData`/`initialCount` props, initialize state from them, only use `useEntity` for subsequent filter-driven re-fetches.
**Warning signs:** Loading spinner appears when switching to Communications tab even though data was already fetched server-side.

### Pitfall 3: Communications query missing deal join
**What goes wrong:** Timeline entries need to show linked deal title, but `getCommunications` only joins contacts, not deals.
**Why it happens:** Original query was written before the timeline upgrade requirement.
**How to avoid:** Add `deal:deals!deal_id(id, title)` to the select string and update `CommunicationWithDetails` type.
**Warning signs:** Linked deal badges show nothing or cause TypeScript errors.

### Pitfall 4: Activity form needs pre-filled account_id
**What goes wrong:** The existing `ActivityForm` has a raw text input for `account_id` which is user-unfriendly.
**Why it happens:** Form was designed for the standalone activities page, not embedded in an account detail.
**How to avoid:** When reusing in the activities tab, pass `account_id` as a hidden field (not visible to user) via `defaultValues`. The form already accepts `defaultValues.account_id`.
**Warning signs:** User needs to manually type a UUID.

### Pitfall 5: AccountForm defaultValues transformation
**What goes wrong:** The edit page needs to transform `AccountWithRelations` (from `getAccount`) into the `defaultValues` format expected by `AccountForm` (which has `techStackIds`, `samenwerkingsvormIds`, `manualServices`, `competenceCenters`, `hosting` as separate array props).
**Why it happens:** The query returns nested objects (e.g., `tech_stacks: [{ id, technology: { id, name } }]`) but the form expects flat ID arrays (e.g., `techStackIds: [uuid1, uuid2]`).
**How to avoid:** Map relations in the edit page server component:
```tsx
const defaultValues = {
  ...account, // base fields
  id: account.id,
  techStackIds: account.tech_stacks.map(t => t.technology.id),
  samenwerkingsvormIds: account.samenwerkingsvormen.map(s => s.collaboration_type.id),
  manualServices: account.manual_services.map(s => s.service_name),
  competenceCenters: account.competence_centers.map(cc => ({
    id: cc.id,
    competence_center_id: cc.cc.id,
    competence_center_name: cc.cc.name,
    service_ids: [], // would need services query
  })),
  hosting: account.hosting.map(h => ({
    id: h.id,
    provider_id: h.provider.id,
    provider_name: h.provider.name,
    environment_id: h.environment?.id ?? '',
    environment_name: h.environment?.name ?? '',
    url: h.url,
    notes: h.notes,
  })),
};
```

### Pitfall 6: Reference data fetch for edit page
**What goes wrong:** `AccountForm` needs `referenceData` prop with technologies, collaboration types, hosting providers, etc.
**Why it happens:** The "new" page likely already fetches this, but the edit page route doesn't exist yet.
**How to avoid:** Create a `getAccountReferenceData()` query that fetches all ref tables in parallel, reuse in both new and edit pages.
**Warning signs:** Empty dropdowns in the edit form.

## Code Examples

### Activities Tab Component (following OmzetTab pattern)
```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/admin/modal';
import { ActivityForm } from '@/features/activities/components/activity-form';
import type { ActivityWithRelations } from '@/features/activities/types';

type Props = {
  accountId: string;
  initialData: ActivityWithRelations[];
  initialCount: number;
};

export function AccountActivitiesTab({ accountId, initialData, initialCount }: Props) {
  const [data, setData] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  // ... CRUD handlers following OmzetTab pattern
}
```

### Communications Timeline Entry (following demo pattern)
```tsx
const TYPE_CONFIG: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  email: { icon: Mail, bg: 'bg-blue-50', color: 'text-blue-600' },
  note: { icon: FileText, bg: 'bg-amber-50', color: 'text-amber-600' },
  meeting: { icon: Users, bg: 'bg-green-50', color: 'text-green-600' },
  call: { icon: Phone, bg: 'bg-purple-50', color: 'text-purple-600' },
};

// Expandable card with type icon, subject, body preview, linked badges
<div className="border rounded-xl overflow-hidden hover:border-border/80 transition-all">
  <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => toggle(item.id)}>
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
      <Icon size={15} className={cfg.color} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-sm truncate">{item.subject}</span>
        {linkedDeal && <Badge variant="outline" className="text-xs">{linkedDeal.title}</Badge>}
        {linkedContact && <Badge variant="secondary" className="text-xs">{contactName}</Badge>}
      </div>
      {!isExpanded && bodyText && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{bodyText}</p>}
    </div>
    <span className="text-xs text-muted-foreground shrink-0">{formatDate(item.date)}</span>
  </div>
  {isExpanded && <div className="px-4 pb-4 border-t pt-3">{bodyText}</div>}
</div>
```

### Updated Communications Query (adding deal join)
```tsx
// In get-communications.ts, update the select to include deal:
.select(`
  *,
  contact:contacts!contact_id(id, first_name, last_name),
  deal:deals!deal_id(id, title),
  owner:user_profiles!owner_id(id, full_name)
`, { count: 'exact' })
```

### Edit Page Server Component
```tsx
// src/app/admin/accounts/[id]/edit/page.tsx
export default async function AccountEditPage({ params }: Props) {
  const { id } = await params;
  const [account, referenceData] = await Promise.all([
    getAccount(id),
    getAccountReferenceData(),
  ]);
  if (!account) notFound();

  const defaultValues = transformAccountToFormValues(account);
  return <AccountForm referenceData={referenceData} defaultValues={defaultValues} />;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side useEntity fetch in tabs | Server-first initialData pattern | Project convention | Eliminates loading flash and waterfalls |
| Separate hosting feature module | Relation CRUD via generic manage-account-relations action | Already built | No new actions needed |

## Open Questions

1. **Reference data query location**
   - What we know: `AccountForm` needs a `referenceData` prop. The "new" account page likely constructs this.
   - What's unclear: Whether a shared `getAccountReferenceData()` query exists or if each page fetches ref tables individually.
   - Recommendation: Check if the new page has this query; if not, create a shared one in `features/accounts/queries/`.

2. **CC services join on edit page**
   - What we know: `competenceCenters` in the form need `service_ids` per CC. The `getAccount` query fetches CC data but the `account_cc_services` table links to `account_competence_centers`, not directly to `accounts`.
   - What's unclear: Whether a separate query is needed for CC services, or if the existing `getAccount` select can be extended.
   - Recommendation: Extend the `getAccount` query to include `account_cc_services` nested under `competence_centers`, or fetch separately in the edit page.

3. **Mutation strategy for activities tab**
   - What we know: OmzetTab uses local state optimistic updates after server action calls. Activities tab could follow the same pattern or use `revalidatePath`.
   - What's unclear: User preference (discretion area).
   - Recommendation: Follow OmzetTab pattern (local state + server actions) for consistency. Avoid `revalidatePath` as it would reload all tab data.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No automated test framework detected |
| Config file | none |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements - Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACCT-01 | All 8 tabs render with data | manual-only | Manual browser check | N/A |
| ACCT-02 | Overview tab shows all fields | manual-only | Manual browser check | N/A |
| ACCT-03 | Hosting CRUD on edit page | manual-only | Create/edit/delete hosting, refresh | N/A |
| ACCT-04 | Revenue tab CRUD | manual-only | Already working (OmzetTab exists) | N/A |
| ACCT-05 | Communication timeline + create | manual-only | Filter, expand, create via modal | N/A |
| ACCT-06 | Relation management on edit page | manual-only | Add/remove tech stack, services, etc. | N/A |

### Sampling Rate
- **Per task commit:** Manual verification -- navigate to account detail, check all tabs render, test CRUD operations
- **Per wave merge:** Full manual walkthrough of all 8 tabs with CRUD operations
- **Phase gate:** All 6 ACCT requirements verified manually

### Wave 0 Gaps
None -- no test framework to set up. All verification is manual browser testing.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all referenced files
- `account-detail.tsx` -- current 7-tab structure, props interface
- `account-form.tsx` -- complete relation editors (RefChipInput, StringChipInput, hosting, CC sections)
- `manage-account-relations.ts` -- all junction table CRUD actions
- `account-communications-tab.tsx` -- current server-first violation (useEntity fetch)
- `get-communications.ts` -- current query (missing deal join)
- `get-activities.ts` -- supports `account_id` filter
- `omzet-tab.tsx` -- reference pattern for inline CRUD with initialData
- `demo_crm/src/App.tsx:2090-2150` -- communication timeline UI pattern

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions -- all locked choices verified against existing code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, zero new dependencies
- Architecture: HIGH -- all patterns established in codebase, verified against existing components
- Pitfalls: HIGH -- identified by direct code inspection of existing components and their gaps

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable -- internal codebase patterns)
