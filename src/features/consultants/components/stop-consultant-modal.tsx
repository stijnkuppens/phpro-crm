'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { stopConsultant } from '../actions/stop-consultant';
import { moveStoppedToBench } from '../actions/move-stopped-to-bench';

type Props = {
  consultantId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function StopConsultantModal({ consultantId, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [moveToBench, setMoveToBench] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await stopConsultant(consultantId, {
      stop_date: formData.get('stop_date') as string,
      stop_reason: (formData.get('stop_reason') as string) || undefined,
    });

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    if (moveToBench) {
      const benchResult = await moveStoppedToBench(consultantId);
      if ('error' in benchResult && benchResult.error) {
        toast.error(typeof benchResult.error === 'string' ? benchResult.error : 'Kon niet naar bench verplaatsen');
      } else {
        toast.success('Consultant stopgezet en naar bench verplaatst');
        onClose();
        onSuccess?.();
        return;
      }
    }

    toast.success('Consultant stopgezet');
    onClose();
    onSuccess?.();
  }

  return (
    <Modal open={open} onClose={onClose} title="Consultant stopzetten">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stop_date">Stopdatum *</Label>
          <Input id="stop_date" name="stop_date" type="date" required />
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
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Annuleren</Button>
          <Button type="submit" variant="destructive" disabled={loading}>
            {loading ? 'Verwerken...' : 'Stopzetten'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
