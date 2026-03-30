'use client';

import { Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertContractAttribution } from '../actions/upsert-contract-attribution';
import type { ConsultantContractAttribution } from '../types';

type Props = {
  consultantId: string;
  existing: ConsultantContractAttribution | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function ContractAttributionModal({
  consultantId,
  existing,
  open,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'rechtstreeks' | 'cronos'>(
    (existing?.type as 'rechtstreeks' | 'cronos') ?? 'rechtstreeks',
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await upsertContractAttribution({
      consultant_id: consultantId,
      type,
      cc_name: type === 'cronos' ? (formData.get('cc_name') as string) || null : null,
      cc_contact_person:
        type === 'cronos' ? (formData.get('cc_contact_person') as string) || null : null,
      cc_email: type === 'cronos' ? (formData.get('cc_email') as string) || null : null,
      cc_phone: type === 'cronos' ? (formData.get('cc_phone') as string) || null : null,
      cc_distribution: null,
    });

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success('Contract attributie opgeslagen');
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title="Contract attributie">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Type *</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('rechtstreeks')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                type === 'rechtstreeks'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Rechtstreeks
            </button>
            <button
              type="button"
              onClick={() => setType('cronos')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                type === 'cronos'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Cronos
            </button>
          </div>
        </div>

        {type === 'cronos' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="cc_name">CC Naam</Label>
              <Input id="cc_name" name="cc_name" defaultValue={existing?.cc_name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc_contact_person">CC Contactpersoon</Label>
              <Input
                id="cc_contact_person"
                name="cc_contact_person"
                defaultValue={existing?.cc_contact_person ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc_email">CC E-mail</Label>
              <Input
                id="cc_email"
                name="cc_email"
                type="email"
                defaultValue={existing?.cc_email ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc_phone">CC Telefoon</Label>
              <Input id="cc_phone" name="cc_phone" defaultValue={existing?.cc_phone ?? ''} />
            </div>
          </>
        )}

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button type="submit" disabled={loading}>
            <Save />
            {loading ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
