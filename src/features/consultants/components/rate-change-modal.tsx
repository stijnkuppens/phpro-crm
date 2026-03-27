'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { addRateChange } from '../actions/add-rate-change';

type Props = {
  consultantId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function RateChangeModal({ consultantId, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addRateChange(consultantId, {
      date: formData.get('date') as string,
      rate: Number(formData.get('rate')),
      reason: (formData.get('reason') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    });

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success('Tarief gewijzigd');
    onSuccess?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Tarief wijzigen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Datum *</Label>
            <DatePicker name="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Nieuw tarief (€) *</Label>
            <Input id="rate" name="rate" type="number" step="0.01" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Reden</Label>
          <Input id="reason" name="reason" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notities</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Annuleren</Button>
          <Button type="submit" disabled={loading}>
            <Save />
            {loading ? 'Verwerken...' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
