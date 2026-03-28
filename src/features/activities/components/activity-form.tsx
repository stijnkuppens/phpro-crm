'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Save, Calendar, Monitor, Phone, Mail, UtensilsCrossed, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { activityFormSchema, type ActivityFormValues } from '../types';
import { createActivity } from '../actions/create-activity';
import { updateActivity } from '../actions/update-activity';

type OptionItem = { id: string; name: string };

type Props = {
  defaultValues?: Partial<ActivityFormValues> & { id?: string };
  accounts?: OptionItem[];
  deals?: { id: string; title: string }[];
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
};

export function ActivityForm({ defaultValues, accounts = [], deals = [], onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<string>(defaultValues?.type ?? 'Meeting');
  const [accountId, setAccountId] = useState(defaultValues?.account_id ?? '');
  const [dealId, setDealId] = useState(defaultValues?.deal_id ?? '');
  const isEdit = !!defaultValues?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: ActivityFormValues = {
      type: type as ActivityFormValues['type'],
      subject: formData.get('subject') as string,
      date: formData.get('date') as string,
      duration_minutes: formData.get('duration_minutes') ? Number(formData.get('duration_minutes')) : undefined,
      account_id: accountId,
      deal_id: dealId || undefined,
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
        <div className="col-span-2 space-y-2">
          <Label>Type *</Label>
          <input type="hidden" name="type" value={type} />
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'Meeting', label: 'Meeting', icon: Calendar },
              { value: 'Demo', label: 'Demo', icon: Monitor },
              { value: 'Call', label: 'Call', icon: Phone },
              { value: 'E-mail', label: 'E-mail', icon: Mail },
              { value: 'Lunch', label: 'Lunch', icon: UtensilsCrossed },
              { value: 'Event', label: 'Event', icon: PartyPopper },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border-2 transition-all',
                  type === value
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Onderwerp *</Label>
          <Input id="subject" name="subject" defaultValue={defaultValues?.subject ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Datum *</Label>
          <DateTimePicker name="date" value={defaultValues?.date ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duur (minuten)</Label>
          <Input id="duration_minutes" name="duration_minutes" type="number" min="0" defaultValue={defaultValues?.duration_minutes ?? ''} />
        </div>
        {/* Only show account selector when no account is pre-selected */}
        {!defaultValues?.account_id && (
          <div className="space-y-2">
            <Label>Account *</Label>
            {accounts.length > 0 ? (
              <Select value={accountId} onValueChange={(v) => setAccountId(v ?? '')}>
                <SelectTrigger>
                  {accounts.find((a) => a.id === accountId)?.name ?? 'Selecteer account...'}
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} required placeholder="Account ID" />
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label>Deal</Label>
          <Select value={dealId} onValueChange={(v) => setDealId(v ?? '')}>
            <SelectTrigger>
              {deals.find((d) => d.id === dealId)?.title ?? '— geen —'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— geen —</SelectItem>
              {deals.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
