'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { contactFormSchema, type ContactFormValues } from '../types';
import { createContact } from '../actions/create-contact';
import { updateContact } from '../actions/update-contact';

const ROLES = [
  'Decision Maker', 'Influencer', 'Champion', 'Sponsor',
  'Technisch', 'Financieel', 'Operationeel', 'Contact',
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  accountId: string;
  defaultValues?: Partial<ContactFormValues> & { id?: string };
};

export function ContactForm({ open, onClose, accountId, defaultValues }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!defaultValues?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: ContactFormValues = {
      account_id: accountId,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: (formData.get('email') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      title: (formData.get('title') as string) || undefined,
      role: (formData.get('role') as ContactFormValues['role']) || undefined,
      is_steerco: formData.get('is_steerco') === 'on',
    };

    const parsed = contactFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    const result = isEdit
      ? await updateContact(defaultValues!.id!, parsed.data)
      : await createContact(parsed.data);

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success(isEdit ? 'Contact bijgewerkt' : 'Contact aangemaakt');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Contact bewerken' : 'Nieuw contact'}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Functie</Label>
            <Input id="title" name="title" defaultValue={defaultValues?.title ?? ''} />
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
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="is_steerco" name="is_steerco" defaultChecked={defaultValues?.is_steerco ?? false} />
          <Label htmlFor="is_steerco">Steerco lid</Label>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Aanmaken'}
        </Button>
      </form>
    </Modal>
  );
}
