'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { upsertContract } from '../actions/upsert-contract';
import { upsertIndexationConfig } from '@/features/indexation/actions/upsert-indexation-config';
import type { Contract, ContractFormValues } from '../types';
import type { IndexationConfig } from '@/features/indexation/types';

const MONTHS = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maart' },
  { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Augustus' }, { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const INDEX_TYPES = ['Agoria', 'Agoria Digital'];

type Props = {
  accountId: string;
  contract: Contract | null;
  indexationConfig: IndexationConfig | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function ContractEditModal({ accountId, contract, indexationConfig, open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [hasFramework, setHasFramework] = useState(contract?.has_framework_contract ?? false);
  const [hasService, setHasService] = useState(contract?.has_service_contract ?? false);
  const [indexType, setIndexType] = useState(indexationConfig?.indexation_type ?? '');
  const [indexMonth, setIndexMonth] = useState(String(indexationConfig?.start_month ?? ''));
  const [indexYear, setIndexYear] = useState(indexationConfig?.start_year?.toString() ?? '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const values: ContractFormValues = {
      has_framework_contract: hasFramework,
      framework_pdf_url: (fd.get('framework_pdf_url') as string) || null,
      framework_start: (fd.get('framework_start') as string) || null,
      framework_end: (fd.get('framework_end') as string) || null,
      framework_indefinite: fd.get('framework_indefinite') === 'on',
      has_service_contract: hasService,
      service_pdf_url: (fd.get('service_pdf_url') as string) || null,
      service_start: (fd.get('service_start') as string) || null,
      service_end: (fd.get('service_end') as string) || null,
      service_indefinite: fd.get('service_indefinite') === 'on',
      purchase_orders_url: (fd.get('purchase_orders_url') as string) || null,
    };

    const contractResult = await upsertContract(accountId, values);
    if (!contractResult.success) {
      toast.error(typeof contractResult.error === 'string' ? contractResult.error : 'Opslaan mislukt');
      setLoading(false);
      return;
    }

    // Save indexation config
    if (indexType || indexMonth || indexYear) {
      await upsertIndexationConfig({
        account_id: accountId,
        indexation_type: indexType || null,
        start_month: indexMonth ? Number(indexMonth) : null,
        start_year: indexYear ? Number(indexYear) : null,
      });
    }

    setLoading(false);
    toast.success('Contract bijgewerkt');
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title="Contract & Indexering bewerken" size="wide">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Indexation config */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Indexering</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={indexType} onValueChange={(v) => setIndexType(v ?? '')}>
                <SelectTrigger>
                  {indexType || 'Niet ingesteld'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Niet ingesteld</SelectItem>
                  {INDEX_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vanaf maand</Label>
              <Select value={indexMonth} onValueChange={(v) => setIndexMonth(v ?? '')}>
                <SelectTrigger>
                  {indexMonth ? MONTHS.find((m) => m.value === indexMonth)?.label : 'Selecteer...'}
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vanaf jaar</Label>
              <Input
                type="number"
                value={indexYear}
                onChange={(e) => setIndexYear(e.target.value)}
                placeholder={String(new Date().getFullYear())}
              />
            </div>
          </div>
        </div>

        {/* Raamcontract */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raamcontract</h3>
            <Switch checked={hasFramework} onCheckedChange={setHasFramework} />
          </div>
          {hasFramework && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input name="framework_start" type="date" defaultValue={contract?.framework_start ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label>Einde</Label>
                <Input name="framework_end" type="date" defaultValue={contract?.framework_end ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label>PDF URL</Label>
                <Input name="framework_pdf_url" defaultValue={contract?.framework_pdf_url ?? ''} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" name="framework_indefinite" id="framework_indefinite" defaultChecked={contract?.framework_indefinite ?? false} />
                <Label htmlFor="framework_indefinite">Onbepaalde duur</Label>
              </div>
            </div>
          )}
        </div>

        {/* Service contract */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dienstencontract (SLA)</h3>
            <Switch checked={hasService} onCheckedChange={setHasService} />
          </div>
          {hasService && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input name="service_start" type="date" defaultValue={contract?.service_start ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label>Einde</Label>
                <Input name="service_end" type="date" defaultValue={contract?.service_end ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label>PDF URL</Label>
                <Input name="service_pdf_url" defaultValue={contract?.service_pdf_url ?? ''} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" name="service_indefinite" id="service_indefinite" defaultChecked={contract?.service_indefinite ?? false} />
                <Label htmlFor="service_indefinite">Onbepaalde duur</Label>
              </div>
            </div>
          )}
        </div>

        {/* Purchase orders */}
        <div className="space-y-1.5">
          <Label>Bestelbonnen URL (Confluence)</Label>
          <Input name="purchase_orders_url" defaultValue={contract?.purchase_orders_url ?? ''} placeholder="https://confluence.phpro.be/..." />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuleer</Button>
          <Button type="submit" disabled={loading}>
            <Save />
            {loading ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
