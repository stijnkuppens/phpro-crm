# Contact View & Edit Modals — Design Spec

**Date:** 2026-03-20
**Status:** Approved

## Problem

Contacts have no view or edit modals. The edit button in the DataTable navigates to the account page (useless). The contact form component (`contact-form.tsx`) has a Modal baked into it, making it non-reusable outside that specific context. There's no consistent pattern across entities for modal vs page-based CRUD.

## Design

### Part 1: Reusable Form/Modal Convention

Every entity that uses DataTable modals follows this file structure:

```
src/features/<entity>/components/
├── <entity>-form-fields.tsx    # Pure form fields — no container, no Dialog
├── <entity>-form-modal.tsx     # Wraps form-fields in Dialog for create/edit
├── <entity>-view-modal.tsx     # Read-only detail view in Dialog
└── <entity>-list.tsx           # DataTable with rowActions wiring modal state
```

**Form fields component** — receives a react-hook-form `control` prop and renders fields. No submit button, no Dialog, no layout opinions. Can be rendered inside a Dialog, a page, a drawer, or a test harness.

**Form modal** — owns the Dialog, form state (react-hook-form + zod), submit handler, and loading state. Renders the form fields component inside. Handles both create and edit (detected via presence of `defaultValues.id`).

**View modal** — read-only. Fetches or receives the entity data and renders it in a Dialog. Has a "Bewerken" button that transitions to the edit modal.

**List component** — manages `viewId` and `editId` state. DataTable `rowActions` set these. Modals render conditionally based on state.

**Entities that prefer page-based editing** (e.g. accounts) simply use `router.push()` in their rowActions. No modals needed — the pattern is opt-in.

### Part 2: Contact Modals — Specifics

#### Contact View Modal (`contact-view-modal.tsx`)

Props:
```tsx
type Props = {
  contactId: string | null;   // null = closed
  onClose: () => void;
  onEdit: (id: string) => void;  // "Bewerken" button callback
};
```

Fetches contact data client-side via Supabase when `contactId` changes (using the browser client). Displays:

**Header section:**
- Avatar initials (from name)
- Full name, title
- Account name (as a link/badge)

**Info section:**
- Email, phone
- Role badge, steerco badge, overview badge
- Relationship badges: dinner, event, gift

**Personal info section:**
- Hobbies (tag list)
- Marital status, birthday
- Children: yes/no, count, names
- Partner: name, profession
- General notes

**Footer:**
- "Bewerken" button → calls `onEdit(contactId)`
- "Sluiten" button → calls `onClose()`

#### Contact Form Fields (`contact-form-fields.tsx`)

Extracted from existing `contact-form.tsx`. Two tab groups:

**Zakelijk tab:**
- first_name, last_name (side by side)
- email, phone (side by side)
- title
- role (Select)
- is_steerco, is_pinned (toggles)
- invite_dinner, invite_event, invite_gift (toggles)

**Persoonlijk tab:**
- hobbies (tag input)
- marital_status (Select), birthday (side by side)
- has_children (toggle), children_count (number), children_names
- partner_name, partner_profession (side by side)
- notes (textarea)

The form fields component receives `control` from react-hook-form and a `tab` state to switch between the two tab groups.

#### Contact Form Modal (`contact-form-modal.tsx`)

Props:
```tsx
type Props = {
  contactId: string | null;    // null = create mode
  accountId: string;           // required for create
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;        // callback after successful save
};
```

- When `contactId` is set: loads existing data, populates form, calls `updateContact` + `updatePersonalInfo` on save
- When `contactId` is null: create mode, calls `createContact` on save
- Uses a combined Zod schema merging `contactFormSchema` + `personalInfoFormSchema`
- Shows toast on success/error

#### List Wiring (`contact-list.tsx`)

```tsx
const [viewId, setViewId] = useState<string | null>(null);
const [editId, setEditId] = useState<string | null>(null);

// In DataTable rowActions:
{ icon: Eye, label: 'Bekijken', onClick: () => setViewId(row.id) }
{ icon: Pencil, label: 'Bewerken', onClick: () => setEditId(row.id) }

// Render modals:
<ContactViewModal
  contactId={viewId}
  onClose={() => setViewId(null)}
  onEdit={(id) => { setViewId(null); setEditId(id); }}
/>
<ContactFormModal
  contactId={editId}
  accountId={...}  // from the selected row
  open={editId !== null}
  onClose={() => setEditId(null)}
  onSaved={() => { setEditId(null); load(); }}
/>
```

The same modals can be used from the account detail contacts tab.

### Part 3: Refactor Existing Contact Form

The existing `contact-form.tsx` has the Modal baked in. Refactor it:

1. Extract form fields into `contact-form-fields.tsx`
2. Create `contact-form-modal.tsx` as the new Dialog wrapper
3. Delete or replace the old `contact-form.tsx`
4. Update `account-contacts-tab.tsx` to use the new `ContactFormModal`

## Files to Create

- `src/features/contacts/components/contact-form-fields.tsx` — pure form fields
- `src/features/contacts/components/contact-form-modal.tsx` — Dialog wrapper for create/edit
- `src/features/contacts/components/contact-view-modal.tsx` — read-only detail Dialog

## Files to Modify

- `src/features/contacts/components/contact-list.tsx` — add modal state + wiring
- `src/features/contacts/components/contact-form.tsx` — refactor or delete (replaced by form-fields + form-modal)
- `src/features/accounts/components/account-contacts-tab.tsx` — use new ContactFormModal

## Out of Scope

- Inline editing of personal info in view modal (can add later)
- Applying this pattern to other entities (accounts, deals, etc.) — contacts is the first implementation, others follow the same convention
- Master-detail two-panel layout on the contacts list page
