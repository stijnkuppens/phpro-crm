'use client';

import { Save } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ComboboxFilter } from '@/components/admin/combobox-filter';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { zodFieldErrors } from '@/lib/form-errors';
import { createBrowserClient } from '@/lib/supabase/client';
import { createContact } from '../actions/create-contact';
import { updateContact } from '../actions/update-contact';
import { updatePersonalInfo } from '../actions/update-personal-info';
import type { ContactFormValues, ContactWithDetails, PersonalInfoFormValues } from '../types';
import { contactFormSchema } from '../types';
import { ContactFormFields } from './contact-form-fields';

type AccountOption = { id: string; name: string };

type Props = {
  contactId: string | null;
  accountId?: string;
  accounts?: AccountOption[];
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function ContactFormModal({
  contactId,
  accountId: accountIdProp,
  accounts = [],
  open,
  onClose,
  onSaved,
}: Props) {
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [selectedAccountId, setSelectedAccountId] = useState(accountIdProp ?? '');
  const isEdit = !!contactId;
  const accountId = accountIdProp ?? selectedAccountId;

  // Reset contact when contactId changes (render-phase setState to avoid lint error)
  const [prevContactId, setPrevContactId] = useState(contactId);
  if (prevContactId !== contactId) {
    setPrevContactId(contactId);
    setContact(null);
  }

  // Client-side fetch is intentional: the parent list only has basic Contact data,
  // but editing requires ContactWithDetails (including personal_info and account).
  // Pre-fetching personal_info for all contacts in the list would be wasteful.
  useEffect(() => {
    if (!contactId || !open) return;
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
    return () => {
      cancelled = true;
    };
  }, [contactId, open]);

  const [, formAction] = useActionState(async (_prev: null, fd: FormData) => {
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
      setFieldErrors(zodFieldErrors(parsedContact.error));
      toast.error('Controleer de verplichte velden');
      return null;
    }
    setFieldErrors({});

    const hobbiesRaw = fd.get('hobbies') as string;
    const personalValues: PersonalInfoFormValues = {
      hobbies: hobbiesRaw
        ? hobbiesRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
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
        return null;
      }
      const piResult = await updatePersonalInfo(contactId, personalValues);
      if (!piResult.success) {
        toast.error('Contact bijgewerkt, maar persoonlijke info kon niet worden opgeslagen');
        return null;
      }
      toast.success('Contact bijgewerkt');
    } else {
      const result = await createContact(parsedContact.data);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
        return null;
      }
      if (result.data?.id) {
        const piResult = await updatePersonalInfo(result.data.id, personalValues);
        if (!piResult.success) {
          toast.error('Contact aangemaakt, maar persoonlijke info kon niet worden opgeslagen');
          return null;
        }
      }
      toast.success('Contact aangemaakt');
    }

    onSaved?.();
    onClose();
    return null;
  }, null);

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
      <form action={formAction} className="space-y-4">
        {!accountIdProp && (
          <div className="space-y-2">
            <Label>Account *</Label>
            <ComboboxFilter
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              value={selectedAccountId || 'all'}
              onValueChange={(v) => setSelectedAccountId(v === 'all' ? '' : v)}
              placeholder="Selecteer account..."
              searchPlaceholder="Zoek account..."
              className="w-full"
            />
          </div>
        )}
        <ContactFormFields
          key={contactId ?? 'new'}
          defaultValues={(contact as Partial<ContactFormValues> | undefined) ?? undefined}
          defaultPersonalInfo={
            (contact?.personal_info as Partial<PersonalInfoFormValues> | undefined) ?? undefined
          }
          errors={fieldErrors}
        />
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <SubmitButton icon={<Save />}>Opslaan</SubmitButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
