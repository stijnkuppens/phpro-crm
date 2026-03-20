# Contact View & Edit Modals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build reusable view and edit modals for contacts, establishing a convention for modal-based CRUD that any entity can follow.

**Architecture:** Extract form fields from the existing contact-form.tsx into a standalone component. Create a view modal (read-only) and an edit modal (form in Dialog). Wire both into the contacts list and account contacts tab via local state. The Modal component (`src/components/admin/modal.tsx`) already wraps shadcn Dialog — reuse it.

**Tech Stack:** React 19, shadcn/ui Dialog, Zod validation, Supabase browser client, Sonner toast

---

### Task 1: Create Contact View Modal

**Files:**
- Create: `src/features/contacts/components/contact-view-modal.tsx`

- [ ] **Step 1: Create the view modal component**

This component fetches a contact by ID using the browser Supabase client and displays all fields read-only in a Dialog. It has a "Bewerken" button that calls `onEdit`.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/admin/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ContactWithDetails } from '../types';

type Props = {
  contactId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
};

export function ContactViewModal({ contactId, onClose, onEdit }: Props) {
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contactId) { setContact(null); return; }
    let cancelled = false;
    setLoading(true);
    const supabase = createBrowserClient();
    supabase
      .from('contacts')
      .select('*, personal_info:contact_personal_info(*), account:accounts!account_id(id, name)')
      .eq('id', contactId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setContact(data as ContactWithDetails | null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [contactId]);

  const pi = contact?.personal_info;
  const initials = contact
    ? `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <Modal open={!!contactId} onClose={onClose} title="" size="wide">
      {loading || !contact ? (
        <div className="py-12 text-center text-muted-foreground">Laden...</div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-medium">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{contact.first_name} {contact.last_name}</h2>
                {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
                <div className="mt-1 flex items-center gap-2">
                  {contact.role && <Badge variant="outline">{contact.role}</Badge>}
                  {contact.is_steerco && <Badge variant="secondary">Steerco</Badge>}
                  {contact.is_pinned && <Badge>Overview</Badge>}
                </div>
              </div>
            </div>
            {contact.account && (
              <Link
                href={`/admin/accounts/${contact.account.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {contact.account.name}
              </Link>
            )}
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-6 text-sm">
            {contact.email && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-4 w-4" /> {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-4 w-4" /> {contact.phone}
              </span>
            )}
          </div>

          {/* Relationship badges */}
          {(pi?.invite_dinner || pi?.invite_event || pi?.invite_gift) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Relatiebeheer:</span>
              {pi?.invite_dinner && <Badge variant="outline">🍽 Diner</Badge>}
              {pi?.invite_event && <Badge variant="outline">🎪 Event</Badge>}
              {pi?.invite_gift && <Badge variant="outline">🎁 Gift</Badge>}
            </div>
          )}

          <Separator />

          {/* Personal info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Persoonlijke info</h3>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <InfoRow label="Hobby's">
                {pi?.hobbies && pi.hobbies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {pi.hobbies.map((h) => <Badge key={h} variant="outline">{h}</Badge>)}
                  </div>
                ) : '—'}
              </InfoRow>
              <InfoRow label="Burgerlijke staat">{pi?.marital_status || '—'}</InfoRow>
              <InfoRow label="Verjaardag">{pi?.birthday || '—'}</InfoRow>
              <InfoRow label="Kinderen">
                {pi?.has_children
                  ? `Ja${pi.children_count ? ` (${pi.children_count})` : ''}`
                  : 'Nee'}
              </InfoRow>
              {pi?.children_names && <InfoRow label="Namen kinderen">{pi.children_names}</InfoRow>}
              <InfoRow label="Partner">{pi?.partner_name || '—'}</InfoRow>
              <InfoRow label="Beroep partner">{pi?.partner_profession || '—'}</InfoRow>
            </div>
            {pi?.notes && (
              <div className="mt-3">
                <p className="text-sm font-medium text-muted-foreground">Notities</p>
                <p className="mt-0.5 text-sm">{pi.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Sluiten</Button>
            <Button onClick={() => onEdit(contact.id)}>Bewerken</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/features/contacts/components/contact-view-modal.tsx
git commit -m "feat: create contact view modal component"
```

---

### Task 2: Refactor Contact Form — Extract Fields + Create Form Modal

**Files:**
- Create: `src/features/contacts/components/contact-form-fields.tsx`
- Create: `src/features/contacts/components/contact-form-modal.tsx`
- Delete: `src/features/contacts/components/contact-form.tsx` (replaced)

- [ ] **Step 1: Create contact-form-fields.tsx**

This is a pure form fields component. It renders the business fields and personal info fields in two tab groups. It uses uncontrolled inputs with `name` attributes (matching the existing pattern in contact-form.tsx). It receives `defaultValues` for edit mode.

```tsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ContactFormValues, PersonalInfoFormValues } from '../types';

const ROLES = [
  'Decision Maker', 'Influencer', 'Champion', 'Sponsor', 'Steerco Lid',
  'Technisch', 'Financieel', 'Operationeel', 'Contact',
] as const;

type Props = {
  defaultValues?: Partial<ContactFormValues>;
  defaultPersonalInfo?: Partial<PersonalInfoFormValues>;
};

export function ContactFormFields({ defaultValues, defaultPersonalInfo }: Props) {
  return (
    <Tabs defaultValue="zakelijk" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="zakelijk">Zakelijk</TabsTrigger>
        <TabsTrigger value="persoonlijk">Persoonlijk</TabsTrigger>
      </TabsList>

      <TabsContent value="zakelijk" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Voornaam *</Label>
            <Input id="first_name" name="first_name" defaultValue={defaultValues?.first_name ?? ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Achternaam *</Label>
            <Input id="last_name" name="last_name" defaultValue={defaultValues?.last_name ?? ''} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Functietitel</Label>
          <Input id="title" name="title" defaultValue={defaultValues?.title ?? ''} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefoon</Label>
            <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ''} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select name="role" defaultValue={defaultValues?.role ?? ''}>
            <SelectTrigger><SelectValue placeholder="Selecteer rol" /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="is_steerco" name="is_steerco" defaultChecked={defaultValues?.is_steerco ?? false} />
            <Label htmlFor="is_steerco">Steerco</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="is_pinned" name="is_pinned" defaultChecked={defaultValues?.is_pinned ?? false} />
            <Label htmlFor="is_pinned">Toon in overview</Label>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="invite_dinner" name="invite_dinner" defaultChecked={defaultPersonalInfo?.invite_dinner ?? false} />
            <Label htmlFor="invite_dinner">Diner</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="invite_event" name="invite_event" defaultChecked={defaultPersonalInfo?.invite_event ?? false} />
            <Label htmlFor="invite_event">Event</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="invite_gift" name="invite_gift" defaultChecked={defaultPersonalInfo?.invite_gift ?? false} />
            <Label htmlFor="invite_gift">Gift</Label>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="persoonlijk" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="hobbies">Hobby&apos;s (kommagescheiden)</Label>
          <Input id="hobbies" name="hobbies" defaultValue={defaultPersonalInfo?.hobbies?.join(', ') ?? ''} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="marital_status">Burgerlijke staat</Label>
            <Input id="marital_status" name="marital_status" defaultValue={defaultPersonalInfo?.marital_status ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthday">Verjaardag</Label>
            <Input id="birthday" name="birthday" defaultValue={defaultPersonalInfo?.birthday ?? ''} placeholder="DD/MM" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox id="has_children" name="has_children" defaultChecked={defaultPersonalInfo?.has_children ?? false} />
            <Label htmlFor="has_children">Kinderen</Label>
          </div>
          <div className="space-y-2">
            <Input id="children_count" name="children_count" type="number" min={0} className="w-20" defaultValue={defaultPersonalInfo?.children_count ?? ''} placeholder="#" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="children_names">Namen kinderen</Label>
          <Input id="children_names" name="children_names" defaultValue={defaultPersonalInfo?.children_names ?? ''} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="partner_name">Naam partner</Label>
            <Input id="partner_name" name="partner_name" defaultValue={defaultPersonalInfo?.partner_name ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner_profession">Beroep partner</Label>
            <Input id="partner_profession" name="partner_profession" defaultValue={defaultPersonalInfo?.partner_profession ?? ''} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Algemene info</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={defaultPersonalInfo?.notes ?? ''} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 2: Create contact-form-modal.tsx**

This wraps ContactFormFields in a Modal + form element. Handles both create and edit. On submit, parses FormData, calls server actions, shows toast.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { ContactFormFields } from './contact-form-fields';
import { createContact } from '../actions/create-contact';
import { updateContact } from '../actions/update-contact';
import { updatePersonalInfo } from '../actions/update-personal-info';
import { createBrowserClient } from '@/lib/supabase/client';
import { contactFormSchema, personalInfoFormSchema } from '../types';
import type { ContactFormValues, PersonalInfoFormValues, ContactWithDetails } from '../types';

type Props = {
  contactId: string | null;    // null = create mode
  accountId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function ContactFormModal({ contactId, accountId, open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const isEdit = !!contactId;

  // Fetch contact data for edit mode
  useEffect(() => {
    if (!contactId || !open) { setContact(null); return; }
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('contacts')
      .select('*, personal_info:contact_personal_info(*), account:accounts!account_id(id, name)')
      .eq('id', contactId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setContact(data as ContactWithDetails | null);
      });
    return () => { cancelled = true; };
  }, [contactId, open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    // Parse contact fields
    const contactValues: ContactFormValues = {
      account_id: accountId,
      first_name: fd.get('first_name') as string,
      last_name: fd.get('last_name') as string,
      email: (fd.get('email') as string) || undefined,
      phone: (fd.get('phone') as string) || undefined,
      title: (fd.get('title') as string) || undefined,
      role: (fd.get('role') as ContactFormValues['role']) || undefined,
      is_steerco: fd.get('is_steerco') === 'on',
      is_pinned: fd.get('is_pinned') === 'on',
    };

    const parsedContact = contactFormSchema.safeParse(contactValues);
    if (!parsedContact.success) {
      toast.error('Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    // Parse personal info fields
    const hobbiesRaw = fd.get('hobbies') as string;
    const personalValues: PersonalInfoFormValues = {
      hobbies: hobbiesRaw ? hobbiesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      marital_status: (fd.get('marital_status') as string) || undefined,
      has_children: fd.get('has_children') === 'on',
      children_count: fd.get('children_count') ? Number(fd.get('children_count')) : undefined,
      children_names: (fd.get('children_names') as string) || undefined,
      birthday: (fd.get('birthday') as string) || undefined,
      partner_name: (fd.get('partner_name') as string) || undefined,
      partner_profession: (fd.get('partner_profession') as string) || undefined,
      notes: (fd.get('notes') as string) || undefined,
      invite_dinner: fd.get('invite_dinner') === 'on',
      invite_event: fd.get('invite_event') === 'on',
      invite_gift: fd.get('invite_gift') === 'on',
    };

    if (isEdit && contactId) {
      const result = await updateContact(contactId, parsedContact.data);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
        setLoading(false);
        return;
      }
      await updatePersonalInfo(contactId, personalValues);
      toast.success('Contact bijgewerkt');
    } else {
      const result = await createContact(parsedContact.data);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
        setLoading(false);
        return;
      }
      // Create personal info for the new contact
      if (result.data?.id) {
        await updatePersonalInfo(result.data.id, personalValues);
      }
      toast.success('Contact aangemaakt');
    }

    setLoading(false);
    onSaved?.();
    onClose();
  }

  // Don't render form until data is loaded in edit mode
  if (isEdit && !contact && open) {
    return (
      <Modal open={open} onClose={onClose} title="Contact bewerken" size="wide">
        <div className="py-12 text-center text-muted-foreground">Laden...</div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Contact bewerken' : 'Nieuw contact'}
      size="wide"
    >
      {isEdit && contact && (
        <p className="text-sm text-muted-foreground mb-4">
          Account: {contact.account?.name ?? accountId}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <ContactFormFields
          key={contactId ?? 'new'}
          defaultValues={contact ?? undefined}
          defaultPersonalInfo={contact?.personal_info ?? undefined}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Annuleren
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 3: Delete old contact-form.tsx**

Remove `src/features/contacts/components/contact-form.tsx` — it is fully replaced by `contact-form-fields.tsx` + `contact-form-modal.tsx`.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: Errors in `account-contacts-tab.tsx` (imports old `ContactForm`). That's fine — Task 4 fixes it.

- [ ] **Step 5: Commit**

```bash
git add src/features/contacts/components/contact-form-fields.tsx src/features/contacts/components/contact-form-modal.tsx
git rm src/features/contacts/components/contact-form.tsx
git commit -m "feat: split contact form into form-fields + form-modal components"
```

---

### Task 3: Wire Modals into Contact List

**Files:**
- Modify: `src/features/contacts/components/contact-list.tsx`

- [ ] **Step 1: Add modal state and imports**

Replace the current contact-list.tsx to use view/edit modals instead of navigating to account pages.

Key changes:
- Add `viewId` and `editId` state
- Import `ContactViewModal` and `ContactFormModal`
- Update `rowActions` — Eye opens view modal, Pencil opens edit modal
- Render both modals at the bottom
- Remove `useRouter` import (no longer needed for row actions, but keep if used elsewhere — check first)

Update the rowActions in the DataTable:

```tsx
const [viewId, setViewId] = useState<string | null>(null);
const [editId, setEditId] = useState<string | null>(null);

// Find the selected row's account_id for the form modal
const selectedRow = data.find((r) => r.id === editId);

// In DataTable:
rowActions={(row) => [
  { icon: Eye, label: 'Bekijken', onClick: () => setViewId(row.id) },
  { icon: Pencil, label: 'Bewerken', onClick: () => setEditId(row.id) },
  { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Contact verwijderen?', description: 'Dit verwijdert het contact permanent.' }, onClick: () => handleDelete(row.id) },
]}
```

After the DataTable, render:

```tsx
<ContactViewModal
  contactId={viewId}
  onClose={() => setViewId(null)}
  onEdit={(id) => { setViewId(null); setEditId(id); }}
/>
<ContactFormModal
  contactId={editId}
  accountId={selectedRow?.account_id ?? ''}
  open={editId !== null}
  onClose={() => setEditId(null)}
  onSaved={() => { setEditId(null); load(); }}
/>
```

Remove `useRouter` if it's no longer used after removing the navigation-based row actions.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/features/contacts/components/contact-list.tsx
git commit -m "feat: wire view and edit modals into contacts list"
```

---

### Task 4: Update Account Contacts Tab

**Files:**
- Modify: `src/features/accounts/components/account-contacts-tab.tsx`

- [ ] **Step 1: Replace old ContactForm import with new ContactFormModal**

Update the import from `ContactForm` to `ContactFormModal`. Update the usage — the new modal uses `contactId` (null for create) + `open` + `accountId` props.

Also add view/edit support for individual contacts in the card list (Eye + Pencil icon buttons on each contact card), plus import and render `ContactViewModal`.

```tsx
'use client';

import { useEffect, useCallback, useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import { useEntity } from '@/lib/hooks/use-entity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactFormModal } from '@/features/contacts/components/contact-form-modal';
import { ContactViewModal } from '@/features/contacts/components/contact-view-modal';
import type { Contact } from '@/features/contacts/types';

type Props = {
  accountId: string;
};

export function AccountContactsTab({ accountId }: Props) {
  const { data, loading, fetchList } = useEntity<Contact>({
    table: 'contacts',
    pageSize: 100,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchList({ page: 1, eqFilters: { account_id: accountId } });
  }, [fetchList, accountId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>Nieuw Contact</Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Laden...</div>
      ) : data.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Geen contacten gevonden.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {data.map((contact) => (
            <div key={contact.id} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {contact.first_name} {contact.last_name}
                  {contact.is_pinned && <span className="ml-1 text-yellow-500">★</span>}
                </div>
                <div className="text-xs text-muted-foreground">{contact.title}</div>
              </div>
              <div className="flex items-center gap-2">
                {contact.role && <Badge variant="outline">{contact.role}</Badge>}
                {contact.is_steerco && <Badge variant="secondary">Steerco</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">{contact.email}</div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setViewId(contact.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditId(contact.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <ContactFormModal
        contactId={null}
        accountId={accountId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => { setCreateOpen(false); load(); }}
      />

      {/* View modal */}
      <ContactViewModal
        contactId={viewId}
        onClose={() => setViewId(null)}
        onEdit={(id) => { setViewId(null); setEditId(id); }}
      />

      {/* Edit modal */}
      <ContactFormModal
        contactId={editId}
        accountId={accountId}
        open={editId !== null}
        onClose={() => setEditId(null)}
        onSaved={() => { setEditId(null); load(); }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 3: Commit**

```bash
git add src/features/accounts/components/account-contacts-tab.tsx
git commit -m "feat: use new contact modals in account contacts tab"
```

---

### Task 5: Clean Up Contact Detail Page

**Files:**
- Modify: `src/features/contacts/components/contact-detail.tsx`
- Modify: `src/app/admin/contacts/[id]/page.tsx`

- [ ] **Step 1: Decide on contact detail page**

The standalone contact detail page at `/admin/contacts/[id]` uses `ContactDetail` which has inline personal info editing. Now that we have the view/edit modals, this page is redundant — users access contact details via the view modal from the list or account tab.

Options:
- **A**: Keep the page but simplify it to just render the view modal's content (no inline editing)
- **B**: Remove the page entirely and redirect `/admin/contacts/[id]` to `/admin/contacts`

Recommended: **B** — remove the detail page. The view modal is the canonical way to see a contact. Less code to maintain.

Delete:
- `src/features/contacts/components/contact-detail.tsx`
- `src/app/admin/contacts/[id]/page.tsx`
- `src/app/admin/contacts/[id]/loading.tsx` (if exists)
- `src/app/admin/contacts/[id]/error.tsx` (if exists)

- [ ] **Step 2: Verify build and commit**

```bash
npx tsc --noEmit
git rm src/features/contacts/components/contact-detail.tsx
git rm -r src/app/admin/contacts/\[id\]/
git commit -m "chore: remove standalone contact detail page (replaced by view modal)"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 2: Spot-check in browser**

1. Go to `/admin/contacts` — click Eye icon → view modal opens with all contact data
2. In view modal — click "Bewerken" → edit modal opens with Zakelijk/Persoonlijk tabs
3. Edit a field, save → toast shows, modal closes, list refreshes
4. Click Pencil icon directly → edit modal opens
5. Go to an account detail → Contacts tab → click Eye/Pencil on a contact → same modals work
6. In account contacts tab → "Nieuw Contact" → create modal with empty form
7. Verify delete still works from both list and account tab
