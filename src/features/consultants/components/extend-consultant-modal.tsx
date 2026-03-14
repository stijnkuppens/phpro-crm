'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { extendConsultant } from '../actions/extend-consultant';

type Props = {
  consultantId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ExtendConsultantModal({ consultantId, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await extendConsultant(consultantId, {
      new_end_date: formData.get('new_end_date') as string,
      notes: (formData.get('notes') as string) || undefined,
    });

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success('Consultant verlengd');
    onClose();
    onSuccess?.();
  }

  return (
    <Modal open={open} onClose={onClose} title="Consultant verlengen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new_end_date">Nieuwe einddatum *</Label>
          <Input id="new_end_date" name="new_end_date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notities</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Annuleren</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Verwerken...' : 'Verlengen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
