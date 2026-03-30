'use client';

import { Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { closeDeal } from '../actions/close-deal';
import { type CloseDealValues, closeDealSchema } from '../types';

type ClosedType = 'won' | 'lost' | 'longterm';

type Props = {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialType?: 'won' | 'lost' | 'longterm';
};

export function CloseDealModal({ dealId, open, onOpenChange, onSuccess, initialType }: Props) {
  const [loading, setLoading] = useState(false);
  const [closedType, setClosedType] = useState<ClosedType>(initialType ?? 'won');
  const [reason, setReason] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: CloseDealValues = {
      closed_type: closedType,
      closed_reason: (formData.get('closed_reason') as string) || undefined,
      closed_notes: (formData.get('closed_notes') as string) || undefined,
      longterm_date: (formData.get('longterm_date') as string) || undefined,
    };

    const parsed = closeDealSchema.safeParse(values);
    if (!parsed.success) {
      const messages = Object.values(z.flattenError(parsed.error).fieldErrors).flat();
      toast.error(messages[0] ?? 'Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    const result = await closeDeal(dealId, parsed.data);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    const labels: Record<ClosedType, string> = {
      won: 'Deal gewonnen',
      lost: 'Deal verloren',
      longterm: 'Deal op lange termijn gezet',
    };
    toast.success(labels[closedType]);
    onOpenChange(false);
    onSuccess?.();
  }

  const typeLabels: Record<ClosedType, string> = {
    won: 'Gewonnen',
    lost: 'Verloren',
    longterm: 'Lange termijn',
  };

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title="Deal sluiten">
      <div className="flex gap-2 mb-4">
        {(['won', 'lost', 'longterm'] as ClosedType[]).map((type) => (
          <Button
            key={type}
            type="button"
            variant={closedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setClosedType(type)}
          >
            {typeLabels[type]}
          </Button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(closedType === 'won' || closedType === 'lost') && (
          <div className="space-y-2">
            <Label htmlFor="closed_reason">
              Reden
              {closedType === 'lost' && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <Input
              id="closed_reason"
              name="closed_reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}
        {(closedType === 'lost' || closedType === 'longterm') && (
          <div className="space-y-2">
            <Label htmlFor="closed_notes">Notities</Label>
            <Textarea id="closed_notes" name="closed_notes" rows={3} />
          </div>
        )}
        {closedType === 'longterm' && (
          <div className="space-y-2">
            <Label htmlFor="longterm_date">Follow-up datum *</Label>
            <DatePicker name="longterm_date" required />
          </div>
        )}
        <ModalFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button type="submit" disabled={loading || (closedType === 'lost' && !reason.trim())}>
            <Save />
            {loading ? 'Opslaan...' : 'Bevestigen'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
