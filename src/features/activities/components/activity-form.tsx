'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { activityFormSchema, type ActivityFormValues } from '../types';
import { createActivity } from '../actions/create-activity';
import { updateActivity } from '../actions/update-activity';

type Props = {
  defaultValues?: Partial<ActivityFormValues> & { id?: string };
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
};

export function ActivityForm({ defaultValues, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!defaultValues?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: ActivityFormValues = {
      type: formData.get('type') as ActivityFormValues['type'],
      subject: formData.get('subject') as string,
      date: formData.get('date') as string,
      duration_minutes: formData.get('duration_minutes') ? Number(formData.get('duration_minutes')) : undefined,
      account_id: formData.get('account_id') as string,
      deal_id: (formData.get('deal_id') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
      is_done: formData.get('is_done') === 'on',
    };

    const parsed = activityFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    const result = isEdit
      ? await updateActivity(defaultValues!.id!, parsed.data)
      : await createActivity(parsed.data);

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success(isEdit ? 'Activiteit bijgewerkt' : 'Activiteit aangemaakt');
    const id = 'data' in result && result.data ? result.data.id : defaultValues?.id ?? '';
    if (onSuccess) {
      onSuccess(id);
    } else {
      router.push('/admin/activities');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select name="type" defaultValue={defaultValues?.type ?? 'Meeting'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Meeting">Meeting</SelectItem>
              <SelectItem value="Demo">Demo</SelectItem>
              <SelectItem value="Call">Call</SelectItem>
              <SelectItem value="E-mail">E-mail</SelectItem>
              <SelectItem value="Lunch">Lunch</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Onderwerp *</Label>
          <Input id="subject" name="subject" defaultValue={defaultValues?.subject ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Datum *</Label>
          <Input id="date" name="date" type="datetime-local" defaultValue={defaultValues?.date ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duur (minuten)</Label>
          <Input id="duration_minutes" name="duration_minutes" type="number" min="0" defaultValue={defaultValues?.duration_minutes ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_id">Account ID *</Label>
          <Input id="account_id" name="account_id" defaultValue={defaultValues?.account_id ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deal_id">Deal ID</Label>
          <Input id="deal_id" name="deal_id" defaultValue={defaultValues?.deal_id ?? ''} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notities</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={typeof defaultValues?.notes === 'string' ? defaultValues.notes : ''} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="is_done" name="is_done" defaultChecked={defaultValues?.is_done ?? false} />
        <Label htmlFor="is_done">Afgerond</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          <Save />
          {loading ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Aanmaken'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
        )}
      </div>
    </form>
  );
}
