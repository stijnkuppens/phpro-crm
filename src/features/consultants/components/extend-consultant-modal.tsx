'use client';

import { useActionState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { extendConsultant } from '../actions/extend-consultant';

type Props = {
  consultantId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ExtendConsultantModal({ consultantId, open, onClose, onSuccess }: Props) {
  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const result = await extendConsultant(consultantId, {
      new_end_date: formData.get('new_end_date') as string,
      notes: (formData.get('notes') as string) || undefined,
    });

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return null;
    }

    toast.success('Consultant verlengd');
    onSuccess?.();
    onClose();
    return null;
  }, null);

  return (
    <Modal open={open} onClose={onClose} title="Consultant verlengen">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new_end_date">Nieuwe einddatum *</Label>
          <DatePicker name="new_end_date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notities</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>Annuleren</Button>
          <SubmitButton>Verlengen</SubmitButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
