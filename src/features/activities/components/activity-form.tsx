'use client';

import { Activity, Calendar, CalendarCheck, Check, ClipboardList, FileText, Mail, Phone, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createActivity } from '../actions/create-activity';
import { updateActivity } from '../actions/update-activity';
import { type ActivityFormValues, activityFormSchema } from '../types';

type OptionItem = { id: string; name: string };

type Props = {
  defaultValues?: Partial<ActivityFormValues> & { id?: string };
  accounts?: OptionItem[];
  deals?: { id: string; title: string }[];
  users?: OptionItem[];
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
};

const ACTIVITY_TYPES = [
  { value: 'Meeting', label: 'Meeting', icon: Calendar },
  { value: 'Call', label: 'Opbellen', icon: Phone },
  { value: 'E-mail', label: 'Mailen', icon: Mail },
  { value: 'Demo', label: 'Demo', icon: Activity },
  { value: 'Lunch', label: 'Voorstel', icon: FileText },
  { value: 'Event', label: 'Andere', icon: Zap },
  { value: 'Taak', label: 'Taak', icon: ClipboardList },
] as const;

export function ActivityForm({ defaultValues, accounts = [], deals = [], users = [], onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [type, setType] = useState<string>(defaultValues?.type ?? 'Meeting');
  const [accountId, setAccountId] = useState(defaultValues?.account_id ?? '');
  const [dealId, setDealId] = useState(defaultValues?.deal_id ?? '');
  const [isDone, setIsDone] = useState(defaultValues?.is_done ?? false);
  const [priority, setPriority] = useState(defaultValues?.priority ?? 'Medium');
  const [assignedTo, setAssignedTo] = useState(defaultValues?.assigned_to ?? '');
  const isEdit = !!defaultValues?.id;
  const isTask = type === 'Taak';

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const values: ActivityFormValues = {
      type: type as ActivityFormValues['type'],
      subject: formData.get('subject') as string,
      date: formData.get('date') as string,
      duration_minutes: isTask
        ? undefined
        : formData.get('duration_minutes')
          ? Number(formData.get('duration_minutes'))
          : undefined,
      account_id: accountId,
      deal_id: dealId || undefined,
      notes: (formData.get('notes') as string) || undefined,
      is_done: isDone,
      priority: isTask ? (priority as 'High' | 'Medium' | 'Low') : undefined,
      assigned_to: isTask && assignedTo ? assignedTo : undefined,
    };

    const parsed = activityFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      return null;
    }

    const result = isEdit ? await updateActivity(defaultValues!.id!, parsed.data) : await createActivity(parsed.data);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return null;
    }

    toast.success(isEdit ? 'Activiteit bijgewerkt' : 'Activiteit aangemaakt');
    const id = 'data' in result && result.data ? result.data.id : (defaultValues?.id ?? '');
    if (onSuccess) {
      onSuccess(id);
    } else {
      router.push('/admin/activities');
    }
    return null;
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      {/* Type toggle buttons */}
      <div className="space-y-2">
        <Label>Type</Label>
        <input type="hidden" name="type" value={type} />
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                type === value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground/40 bg-card',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Onderwerp */}
      <div className="space-y-2">
        <Label htmlFor="subject">
          Onderwerp <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          name="subject"
          defaultValue={defaultValues?.subject ?? ''}
          required
          placeholder="bv. Discovery call, Demo platform..."
        />
      </div>

      {/* Datum & tijd + Duur (or Priority for Taak) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">{isTask ? 'Deadline' : 'Datum & tijd'}</Label>
          <DateTimePicker name="date" value={defaultValues?.date ?? ''} required />
        </div>
        {isTask ? (
          <div className="space-y-2">
            <Label>Prioriteit</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v ?? 'Medium')}>
              <SelectTrigger>{priority}</SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duur (min)</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min="0"
              defaultValue={defaultValues?.duration_minutes ?? '60'}
            />
          </div>
        )}
      </div>

      {/* Assigned to (Taak only) */}
      {isTask && users.length > 0 && (
        <div className="space-y-2">
          <Label>Toegewezen aan</Label>
          <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? '')}>
            <SelectTrigger>{users.find((u) => u.id === assignedTo)?.name ?? '— niemand —'}</SelectTrigger>
            <SelectContent>
              <SelectItem value="">— niemand —</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Gepland / Gedaan toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIsDone(false)}
          className={cn(
            'flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg border-2 transition-all',
            !isDone
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/40',
          )}
        >
          <CalendarCheck className="h-4 w-4" />
          Gepland
        </button>
        <button
          type="button"
          onClick={() => setIsDone(true)}
          className={cn(
            'flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg border-2 transition-all',
            isDone
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/40',
          )}
        >
          <Check className="h-4 w-4" />
          Gedaan
        </button>
      </div>

      {/* Account selector — only when no account pre-selected */}
      {!defaultValues?.account_id && (
        <div className="space-y-2">
          <Label>Account *</Label>
          {accounts.length > 0 ? (
            <Select value={accountId} onValueChange={(v) => setAccountId(v ?? '')}>
              <SelectTrigger>{accounts.find((a) => a.id === accountId)?.name ?? 'Selecteer account...'}</SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} required placeholder="Account ID" />
          )}
        </div>
      )}

      {/* Deal selector — only when no deal pre-selected */}
      {!defaultValues?.deal_id && deals.length > 0 && (
        <div className="space-y-2">
          <Label>Deal</Label>
          <Select value={dealId} onValueChange={(v) => setDealId(v ?? '')}>
            <SelectTrigger>{deals.find((d) => d.id === dealId)?.title ?? '— geen —'}</SelectTrigger>
            <SelectContent>
              <SelectItem value="">— geen —</SelectItem>
              {deals.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notitie */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notitie</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={typeof defaultValues?.notes === 'string' ? defaultValues.notes : ''}
        />
      </div>

      {/* Footer: Annuleren left, Submit right */}
      <div className="flex justify-between pt-2">
        <div>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuleren
            </Button>
          )}
        </div>
        <SubmitButton>{isEdit ? 'Bijwerken' : 'Activiteit toevoegen'}</SubmitButton>
      </div>
    </form>
  );
}
