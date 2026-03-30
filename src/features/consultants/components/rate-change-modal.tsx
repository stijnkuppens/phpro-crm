'use client';

import { Save } from 'lucide-react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { addRateChange } from '../actions/add-rate-change';

type Props = {
  consultantId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function RateChangeModal({ consultantId, open, onClose, onSuccess }: Props) {
  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const result = await addRateChange(consultantId, {
      date: formData.get('date') as string,
      rate: Number(formData.get('rate')),
      reason: (formData.get('reason') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    });

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return null;
    }

    toast.success('Tarief gewijzigd');
    onSuccess?.();
    onClose();
    return null;
  }, null);

  return (
    <Modal open={open} onClose={onClose} title="Tarief wijzigen">
      <form action={formAction} className="space-y-4">
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
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <SubmitButton icon={<Save />}>Opslaan</SubmitButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
