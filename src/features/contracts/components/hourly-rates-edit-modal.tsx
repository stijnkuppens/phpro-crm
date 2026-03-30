'use client';

import { Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { upsertHourlyRates } from '../actions/upsert-hourly-rates';
import type { HourlyRate } from '../types';

type RateEntry = { role: string; rate: string };

type Props = {
  accountId: string;
  year: number;
  existingRates: HourlyRate[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function HourlyRatesEditModal({ accountId, year, existingRates, open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RateEntry[]>(() => {
    const yearRates = existingRates.filter((r) => r.year === year);
    return yearRates.length > 0
      ? yearRates
          .sort((a, b) => a.role.localeCompare(b.role))
          .map((r) => ({ role: r.role, rate: String(Number(r.rate)) }))
      : [{ role: '', rate: '' }];
  });

  function addRow() {
    setRows((prev) => [...prev, { role: '', rate: '' }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof RateEntry, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit() {
    const validRates = rows
      .filter((r) => r.role.trim() && r.rate.trim())
      .map((r) => ({ role: r.role.trim(), rate: Number(r.rate) }));

    if (validRates.length === 0) {
      toast.error('Voeg minimaal 1 tarief toe');
      return;
    }

    setLoading(true);
    const result = await upsertHourlyRates(accountId, year, validRates);
    setLoading(false);

    if (!result.success) {
      toast.error(typeof result.error === 'string' ? result.error : 'Opslaan mislukt');
      return;
    }

    toast.success(`Uurtarieven ${year} opgeslagen`);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Uurtarieven ${year} bewerken`} size="wide">
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_120px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
          <span>Rol</span>
          <span className="text-right">Tarief (€/u)</span>
          <span />
        </div>
        {rows.map((row, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: dynamically added rows with no stable identity
          <div key={i} className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
            <Input
              value={row.role}
              onChange={(e) => updateRow(i, 'role', e.target.value)}
              placeholder="bv. Dev Senior"
            />
            <Input
              type="number"
              value={row.rate}
              onChange={(e) => updateRow(i, 'rate', e.target.value)}
              placeholder="0"
              className="text-right"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(i)}
              disabled={rows.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Rol toevoegen
        </Button>
      </div>
      <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Annuleer
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save />
          {loading ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </div>
    </Modal>
  );
}
