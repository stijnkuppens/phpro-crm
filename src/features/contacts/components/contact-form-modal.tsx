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
import { Save } from 'lucide-react';
import { zodFieldErrors } from '@/lib/form-errors';
import { contactFormSchema } from '../types';
import type { ContactFormValues, PersonalInfoFormValues, ContactWithDetails } from '../types';

type Props = {
  contactId: string | null;
  accountId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function ContactFormModal({ contactId, accountId, open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const isEdit = !!contactId;

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
      setLoading(false);
      return;
    }
    setFieldErrors({});

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
      if (result.data?.id) {
        await updatePersonalInfo(result.data.id, personalValues);
      }
      toast.success('Contact aangemaakt');
    }

    setLoading(false);
    onSaved?.();
    onClose();
  }

  if (isEdit && !contact && open) {
    return (
      <Modal open={open} onClose={onClose} title="Contact bewerken" size="wide">
        <div className="py-12 text-center text-muted-foreground">Laden...</div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Contact bewerken' : 'Nieuw contact'} size="wide">
      {isEdit && contact && (
        <p className="text-sm text-muted-foreground mb-4">
          Account: {contact.account?.name ?? accountId}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <ContactFormFields
          key={contactId ?? 'new'}
          defaultValues={contact as Partial<ContactFormValues> | undefined ?? undefined}
          defaultPersonalInfo={contact?.personal_info as Partial<PersonalInfoFormValues> | undefined ?? undefined}
          errors={fieldErrors}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuleren</Button>
          <Button type="submit" disabled={loading}><Save />{loading ? 'Opslaan...' : 'Opslaan'}</Button>
        </div>
      </form>
    </Modal>
  );
}
