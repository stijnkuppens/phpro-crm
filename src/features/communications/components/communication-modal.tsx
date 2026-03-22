'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, FileText, Users, Phone, Save, Send } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useBrandTheme } from '@/lib/hooks/use-brand-theme';
import { communicationFormSchema, type CommunicationFormValues } from '../types';
import { createCommunication } from '../actions/create-communication';
import { updateCommunication } from '../actions/update-communication';
import { sendCommunicationEmail } from '../actions/send-communication-email';

const TYPES = [
  { value: 'email', label: 'E-mail', icon: Mail },
  { value: 'note', label: 'Notitie', icon: FileText },
  { value: 'meeting', label: 'Vergadering', icon: Users },
  { value: 'call', label: 'Telefoongesprek', icon: Phone },
] as const;

type ContactOption = { id: string; first_name: string; last_name: string };
type DealOption = { id: string; title: string };

type Props = {
  open: boolean;
  onClose: () => void;
  accountId: string;
  contacts?: ContactOption[];
  deals?: DealOption[];
  defaultValues?: Partial<CommunicationFormValues> & { id?: string };
};

export function CommunicationModal({ open, onClose, accountId, contacts = [], deals = [], defaultValues }: Props) {
  const { brand } = useBrandTheme();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [type, setType] = useState<CommunicationFormValues['type']>(defaultValues?.type ?? 'email');
  const [toValue, setToValue] = useState(defaultValues?.to ?? '');
  const [subjectValue, setSubjectValue] = useState(defaultValues?.subject ?? '');
  const defaultContentText = typeof defaultValues?.content === 'object' && defaultValues.content
    ? (defaultValues.content as { text?: string }).text ?? ''
    : '';
  const [contentValue, setContentValue] = useState(defaultContentText);
  const [contactId, setContactId] = useState(defaultValues?.contact_id ?? '');
  const [dealId, setDealId] = useState(defaultValues?.deal_id ?? '');
  const [dateValue, setDateValue] = useState(defaultValues?.date ?? new Date().toISOString().slice(0, 16));
  const [durationValue, setDurationValue] = useState(defaultValues?.duration_minutes?.toString() ?? '');
  const isEdit = !!defaultValues?.id;
  const canSendEmail = type === 'email' && toValue.includes('@') && subjectValue.length > 0 && contentValue.length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const contentText = (fd.get('content_text') as string) || '';
    const values: CommunicationFormValues = {
      account_id: accountId,
      type,
      subject: fd.get('subject') as string,
      to: (fd.get('to') as string) || undefined,
      date: (fd.get('date') as string) || new Date().toISOString(),
      duration_minutes: fd.get('duration_minutes') ? Number(fd.get('duration_minutes')) : undefined,
      contact_id: (fd.get('contact_id') as string) || null,
      deal_id: (fd.get('deal_id') as string) || null,
      content: contentText ? { type: 'text', text: contentText } : null,
      is_done: fd.get('is_done') === 'on',
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

  async function handleSendEmail() {
    setSending(true);
    const result = await sendCommunicationEmail({
      to: toValue,
      subject: subjectValue,
      body: contentValue,
      brand,
    });
    setSending(false);
    if (result.success) {
      toast.success('E-mail verstuurd');
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Versturen mislukt');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Communicatie bewerken' : 'Nieuwe communicatie'} size="wide">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type pills */}
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                type === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* To (email address) — only for email type */}
        {type === 'email' && (
          <div className="space-y-1.5">
            <Label htmlFor="to">Aan (e-mailadres)</Label>
            <Input id="to" name="to" type="email" value={toValue} onChange={(e) => setToValue(e.target.value)} placeholder="naam@bedrijf.be" />
          </div>
        )}

        {/* Subject */}
        <div className="space-y-1.5">
          <Label htmlFor="subject">Onderwerp *</Label>
          <Input id="subject" name="subject" value={subjectValue} onChange={(e) => setSubjectValue(e.target.value)} placeholder="Onderwerp..." required />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <Label htmlFor="content_text">Inhoud</Label>
          <Textarea
            id="content_text"
            name="content_text"
            value={contentValue}
            onChange={(e) => setContentValue(e.target.value)}
            placeholder="Schrijf hier je bericht..."
            rows={5}
          />
        </div>

        {/* Date + Contact row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Datum & tijd</Label>
            <DateTimePicker value={dateValue} onChange={setDateValue} className="w-full" />
            <input type="hidden" name="date" value={dateValue} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_id">Contact</Label>
            <Select name="contact_id" value={contactId} onValueChange={(v) => setContactId(v ?? '')}>
              <SelectTrigger>
                {(() => { const c = contacts.find((c) => c.id === contactId); return c ? `${c.first_name} ${c.last_name}` : '— geen —'; })()}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— geen —</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Deal + Duration row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="deal_id">Gekoppeld aan deal</Label>
            <Select name="deal_id" value={dealId} onValueChange={(v) => setDealId(v ?? '')}>
              <SelectTrigger>
                {dealId ? deals.find((d) => d.id === dealId)?.title ?? '— geen —' : '— geen —'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— geen —</SelectItem>
                {deals.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(type === 'meeting' || type === 'call') && (
            <div className="space-y-1.5">
              <Label htmlFor="duration_minutes">Duur (min)</Label>
              <Input id="duration_minutes" name="duration_minutes" type="number" value={durationValue} onChange={(e) => setDurationValue(e.target.value)} placeholder="30" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading || sending}>Annuleer</Button>
          {type === 'email' && (
            <Button
              type="button"
              variant="outline"
              disabled={loading || sending || !canSendEmail}
              onClick={handleSendEmail}
            >
              <Send className="h-4 w-4 mr-1.5" />
              {sending ? 'Versturen...' : 'Verstuur via mail'}
            </Button>
          )}
          <Button type="submit" disabled={loading || sending}>
            <Save />
            {loading ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
