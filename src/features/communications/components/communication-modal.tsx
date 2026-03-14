'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { communicationFormSchema, type CommunicationFormValues } from '../types';
import { createCommunication } from '../actions/create-communication';
import { updateCommunication } from '../actions/update-communication';

type Props = {
  open: boolean;
  onClose: () => void;
  accountId: string;
  defaultValues?: Partial<CommunicationFormValues> & { id?: string };
};

export function CommunicationModal({ open, onClose, accountId, defaultValues }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!defaultValues?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: CommunicationFormValues = {
      account_id: accountId,
      type: (formData.get('type') as CommunicationFormValues['type']) ?? 'note',
      subject: formData.get('subject') as string,
      to: (formData.get('to') as string) || undefined,
      date: (formData.get('date') as string) || new Date().toISOString(),
      duration_minutes: formData.get('duration_minutes') ? Number(formData.get('duration_minutes')) : undefined,
    };

    const parsed = communicationFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    const result = isEdit
      ? await updateCommunication(defaultValues!.id!, parsed.data)
      : await createCommunication(parsed.data);

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success(isEdit ? 'Communicatie bijgewerkt' : 'Communicatie aangemaakt');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Communicatie bewerken' : 'Nieuwe communicatie'} size="wide">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select name="type" defaultValue={defaultValues?.type ?? 'note'}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="note">Notitie</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="call">Telefoongesprek</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Datum *</Label>
            <Input id="date" name="date" type="datetime-local" defaultValue={defaultValues?.date ?? new Date().toISOString().slice(0, 16)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Onderwerp *</Label>
          <Input id="subject" name="subject" defaultValue={defaultValues?.subject ?? ''} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="to">Aan</Label>
            <Input id="to" name="to" defaultValue={defaultValues?.to ?? ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duur (min)</Label>
            <Input id="duration_minutes" name="duration_minutes" type="number" defaultValue={defaultValues?.duration_minutes ?? ''} />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Aanmaken'}
        </Button>
      </form>
    </Modal>
  );
}
