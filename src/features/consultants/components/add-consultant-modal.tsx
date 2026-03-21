'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { createActiveConsultant } from '../actions/create-active-consultant';

type Props = {
  accountId: string;
  roles: { value: string; label: string }[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function AddConsultantModal({ accountId, roles, open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  const [isIndefinite, setIsIndefinite] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const result = await createActiveConsultant({
      account_id: accountId,
      first_name: fd.get('first_name') as string,
      last_name: fd.get('last_name') as string,
      role: role || undefined,
      city: (fd.get('city') as string) || undefined,
      hourly_rate: Number(fd.get('hourly_rate')),
      start_date: fd.get('start_date') as string,
      end_date: isIndefinite ? null : (fd.get('end_date') as string) || null,
      is_indefinite: isIndefinite,
      notice_period_days: Number(fd.get('notice_period_days')) || undefined,
      notes: (fd.get('notes') as string) || undefined,
    });

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success('Consultant toegevoegd');
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title="Consultant koppelen" size="wide">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Voornaam *</Label>
            <Input id="first_name" name="first_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Achternaam *</Label>
            <Input id="last_name" name="last_name" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                {roles.find((r) => r.value === role)?.label ?? 'Selecteer...'}
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Stad</Label>
            <Input id="city" name="city" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourly_rate">Uurtarief &euro;/u *</Label>
          <Input id="hourly_rate" name="hourly_rate" type="number" min={0} step={0.01} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Startdatum *</Label>
            <Input id="start_date" name="start_date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Einddatum</Label>
            <Input id="end_date" name="end_date" type="date" disabled={isIndefinite} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_indefinite"
            type="checkbox"
            checked={isIndefinite}
            onChange={(e) => setIsIndefinite(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="is_indefinite" className="font-normal">Onbepaalde duur</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notice_period_days">Opzegtermijn in dagen</Label>
          <Input id="notice_period_days" name="notice_period_days" type="number" min={0} defaultValue={30} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notities</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Annuleren</Button>
          <Button type="submit" disabled={loading}>
            <Save />
            {loading ? 'Verwerken...' : 'Toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
