# Consultants Full Demo Parity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the consultants tab to full demo parity — add consultant from account, contract attribution, dashboard stats, DataTable on main page, move-to-bench on stop.

**Architecture:** Extends existing `src/features/consultants/` with new modals and 2 new server actions. Reuses existing `Modal`, `DataTable`, `FilterBar`, `ActionResult` patterns. Consultant roles come from `ref_consultant_roles` reference data table.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase, Zod, shadcn/ui, TanStack Table, Lucide icons

---

## File Inventory

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/features/consultants/components/add-consultant-modal.tsx` | Form modal to create a new consultant placement |
| Create | `src/features/consultants/components/contract-attribution-modal.tsx` | Form modal for rechtstreeks/cronos attribution |
| Create | `src/features/consultants/actions/upsert-contract-attribution.ts` | Server action for contract attribution |
| Create | `src/features/consultants/actions/move-stopped-to-bench.ts` | Server action to copy stopped consultant to bench |
| Create | `src/features/consultants/columns.tsx` | TanStack Table column defs for main consultants page |
| Modify | `src/features/consultants/components/account-consultants-tab.tsx` | Add "Consultant koppelen" button + monthly revenue + better cards |
| Modify | `src/features/consultants/components/consultant-detail-modal.tsx` | Add contract attribution section + SOW link |
| Modify | `src/features/consultants/components/stop-consultant-modal.tsx` | Add "Naar bench" checkbox |
| Modify | `src/features/consultants/components/consultant-list.tsx` | Replace cards with DataTable + stat cards + filters |
| Modify | `src/app/admin/consultants/page.tsx` | Pass initialData/initialCount, add loading.tsx |

---

### Task 1: Add Consultant Modal

**Files:**
- Create: `src/features/consultants/components/add-consultant-modal.tsx`
- Modify: `src/features/consultants/components/account-consultants-tab.tsx`

- [ ] **Step 1: Create add-consultant-modal.tsx**

Form fields: voornaam, achternaam, rol (Select from ref_consultant_roles), stad, uurtarief, startdatum, einddatum (+ onbepaald checkbox), opzegtermijn (dagen), notities. Uses `createActiveConsultant` action. Pattern: match `stop-consultant-modal.tsx` structure.

```tsx
// Key structure — full form with:
// - Input fields for name, city, rate, notice period
// - Select for role (fetched from ref_consultant_roles via props)
// - Date inputs for start/end with "Onbepaalde duur" checkbox
// - Textarea for notes
// - Submit calls createActiveConsultant({ account_id, ...formData })
// - On success: toast + onSaved callback (triggers router.refresh)
```

- [ ] **Step 2: Update account-consultants-tab.tsx**

Add props: `accountId: string`, `roles: ReferenceOption[]` (for role select).
Add "Consultant koppelen" button in header area.
Add empty state with CTA button.
Update card layout: show monthly revenue (rate × 8 × 21), show period dates.

```tsx
// Header: flex between title + "Consultant koppelen" button (Plus icon)
// Cards: keep existing layout, add fmt(rate * 8 * 21) + "/maand" below rate
// Empty state: "Geen consultants" + "Consultant koppelen" button
// Modal: <AddConsultantModal accountId={accountId} roles={roles} ... />
```

- [ ] **Step 3: Update account-detail.tsx to pass new props**

Pass `accountId` and `roles` (from ref_consultant_roles) to AccountConsultantsTab. Fetch roles in the page.tsx Promise.all.

- [ ] **Step 4: Verify in browser**

Navigate to account detail → Consultants tab → click "Consultant koppelen" → fill form → submit → consultant appears in list.

- [ ] **Step 5: Commit**

```
feat: add consultant creation modal on account consultants tab
```

---

### Task 2: Contract Attribution Modal + Detail Enhancement

**Files:**
- Create: `src/features/consultants/components/contract-attribution-modal.tsx`
- Create: `src/features/consultants/actions/upsert-contract-attribution.ts`
- Modify: `src/features/consultants/components/consultant-detail-modal.tsx`

- [ ] **Step 1: Create upsert-contract-attribution.ts server action**

Schema: `{ active_consultant_id, type: 'rechtstreeks' | 'cronos', cc_name?, cc_contact_person?, cc_email?, cc_phone?, cc_distribution? }`. Upsert on `active_consultant_id` (unique constraint exists). Uses `requirePermission('consultants.write')`.

- [ ] **Step 2: Create contract-attribution-modal.tsx**

Toggle between "Rechtstreeks" and "Cronos". When Cronos: show cc_name, cc_contact_person, cc_email, cc_phone fields. On save calls upsertContractAttribution.

- [ ] **Step 3: Enhance consultant-detail-modal.tsx**

Add contract attribution section between info grid and rate history:
- If attribution exists: show type badge + details
- "Contract wijzigen" button → opens ContractAttributionModal
- If no attribution: "Contract instellen" button
- Show SOW URL as clickable link if present
- Show notes if present

- [ ] **Step 4: Verify in browser**

Open consultant detail → set contract attribution → verify it persists on reload.

- [ ] **Step 5: Commit**

```
feat: add contract attribution modal and detail enhancements
```

---

### Task 3: Move Stopped Consultant to Bench

**Files:**
- Create: `src/features/consultants/actions/move-stopped-to-bench.ts`
- Modify: `src/features/consultants/components/stop-consultant-modal.tsx`

- [ ] **Step 1: Create move-stopped-to-bench.ts action**

Reads the active_consultant record, inserts into bench_consultants with matching fields (first_name, last_name, role, city, min/max hourly rate from rate_history, technologies from account tech_stack). Uses `requirePermission('bench.write')`.

- [ ] **Step 2: Update stop-consultant-modal.tsx**

Add checkbox: "Naar bench verplaatsen" (default unchecked). When checked + form submitted: after stopConsultant succeeds, call moveStoppedToBench. Show toast "Consultant stopgezet en naar bench verplaatst".

- [ ] **Step 3: Verify in browser**

Stop a consultant with "Naar bench" checked → verify consultant appears in bench list.

- [ ] **Step 4: Commit**

```
feat: add move-to-bench option when stopping consultant
```

---

### Task 4: Main Consultants Page — DataTable + Stats

**Files:**
- Create: `src/features/consultants/columns.tsx`
- Modify: `src/features/consultants/components/consultant-list.tsx`
- Modify: `src/app/admin/consultants/page.tsx`

- [ ] **Step 1: Create columns.tsx**

TanStack Table column defs matching existing pattern (see `src/features/accounts/columns.tsx`):
- Consultant: avatar initials + first_name + last_name + city subtitle
- Rol: plain text
- Klant: account.name (link to account detail)
- Uurtarief: fmt(getCurrentRate()) + "/u"
- Periode: start → end/onbepaald
- Status: Badge with statusColors
- Actions: detail button (eye icon), handled via row click or action buttons

- [ ] **Step 2: Rewrite consultant-list.tsx with DataTable + FilterBar + stats**

Replace card layout with:
1. **Stat cards** (4-grid): Actief count, Max maandomzet (sum of rate×8×21 for active), Kritieke contracten count, Stopgezet count
2. **FilterBar**: search input (name/role), status select filter, account select filter
3. **DataTable** using columns.tsx, with initialData/initialCount pattern

Props: `initialData: ActiveConsultantWithDetails[]`, `initialCount: number`

- [ ] **Step 3: Update page.tsx**

Fetch consultants count, pass initialData + initialCount. Add loading.tsx skeleton.

- [ ] **Step 4: Verify in browser**

Navigate to /admin/consultants → see stat cards + DataTable with filters + click row opens detail modal.

- [ ] **Step 5: Commit**

```
feat: consultants page with DataTable, stats, and filters
```

---

### Task 5: Final Polish + Cleanup

- [ ] **Step 1: Remove duplicate statusColors**

Extract `statusColors` map to `types.ts` since it's used in 3+ files.

- [ ] **Step 2: Ensure revalidation paths cover both pages**

All consultant actions should `revalidatePath('/admin/consultants')` AND `revalidatePath('/admin/accounts/[accountId]')` where applicable.

- [ ] **Step 3: Verify full flow end-to-end**

1. Account detail → Consultants tab → "Consultant koppelen" → create → appears in list
2. Click consultant → detail modal → set contract attribution → verify
3. Detail modal → "Tarief wijzigen" → change rate → verify in history
4. Detail modal → "Verlengen" → extend → verify
5. Detail modal → "Stopzetten" + "Naar bench" → verify stopped + appears in bench
6. /admin/consultants → stat cards show correct counts → DataTable filters work

- [ ] **Step 4: Commit**

```
chore: consultant polish — extract shared constants, fix revalidation
```
