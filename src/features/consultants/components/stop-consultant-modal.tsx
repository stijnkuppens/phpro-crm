'use client';

import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { moveToBench as moveToBenchAction } from '../actions/move-to-bench';
import { stopConsultant } from '../actions/stop-consultant';

type Props = {
  consultantId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function StopConsultantModal({ consultantId, open, onClose, onSuccess }: Props) {
  const [moveToBench, setMoveToBench] = useState(false);

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
    const result = await stopConsultant(consultantId, {
      stop_date: formData.get('stop_date') as string,
      stop_reason: (formData.get('stop_reason') as string) || undefined,
    });

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return null;
    }

    if (moveToBench) {
      const benchResult = await moveToBenchAction(consultantId);
      if ('error' in benchResult && benchResult.error) {
        toast.error(
          typeof benchResult.error === 'string'
            ? benchResult.error
            : 'Kon niet naar bench verplaatsen',
        );
      } else {
        toast.success('Consultant stopgezet en naar bench verplaatst');
        onSuccess?.();
        onClose();
        return null;
      }
    }

    toast.success('Consultant stopgezet');
    onSuccess?.();
    onClose();
    return null;
  }, null);

  return (
    <Modal open={open} onClose={onClose} title="Consultant stopzetten">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stop_date">Stopdatum *</Label>
          <DatePicker name="stop_date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stop_reason">Reden</Label>
          <Textarea id="stop_reason" name="stop_reason" rows={3} />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="move_to_bench"
            checked={moveToBench}
            onCheckedChange={(checked) => setMoveToBench(checked === true)}
          />
          <Label htmlFor="move_to_bench">Naar bench verplaatsen</Label>
        </div>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <SubmitButton variant="destructive">Stopzetten</SubmitButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
