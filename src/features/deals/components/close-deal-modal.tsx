'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { closeDealSchema, type CloseDealValues } from '../types';
import { closeDeal } from '../actions/close-deal';

type ClosedType = 'won' | 'lost' | 'longterm';

type Props = {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CloseDealModal({ dealId, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [closedType, setClosedType] = useState<ClosedType>('won');

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
      const messages = Object.values(parsed.error.flatten().fieldErrors).flat();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deal sluiten</DialogTitle>
        </DialogHeader>
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
              <Label htmlFor="closed_reason">Reden</Label>
              <Input id="closed_reason" name="closed_reason" />
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
              <Input id="longterm_date" name="longterm_date" type="date" required />
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Opslaan...' : 'Bevestigen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
