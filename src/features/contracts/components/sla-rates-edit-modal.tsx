'use client';

import { Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertSlaRates } from '../actions/upsert-sla-rates';
import type { SlaRateWithTools } from '../types';

type ToolEntry = { tool_name: string; monthly_price: string };

type Props = {
  accountId: string;
  year: number;
  existingRate: SlaRateWithTools | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function SlaRatesEditModal({ accountId, year, existingRate, open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [fixedRate, setFixedRate] = useState(existingRate ? String(Number(existingRate.fixed_monthly_rate)) : '');
  const [supportRate, setSupportRate] = useState(existingRate ? String(Number(existingRate.support_hourly_rate)) : '');
  const [tools, setTools] = useState<ToolEntry[]>(() => {
    if (existingRate?.tools && existingRate.tools.length > 0) {
      return existingRate.tools.map((t) => ({
        tool_name: t.tool_name,
        monthly_price: String(Number(t.monthly_price)),
      }));
    }
    return [];
  });

  function addTool() {
    setTools((prev) => [...prev, { tool_name: '', monthly_price: '' }]);
  }

  function removeTool(index: number) {
    setTools((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTool(index: number, field: keyof ToolEntry, value: string) {
    setTools((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  async function handleSubmit() {
    if (!fixedRate && !supportRate) {
      toast.error('Vul minimaal 1 tarief in');
      return;
    }

    const validTools = tools
      .filter((t) => t.tool_name.trim() && t.monthly_price.trim())
      .map((t) => ({ tool_name: t.tool_name.trim(), monthly_price: Number(t.monthly_price) }));

    setLoading(true);
    const result = await upsertSlaRates(accountId, year, {
      fixed_monthly_rate: Number(fixedRate) || 0,
      support_hourly_rate: Number(supportRate) || 0,
      tools: validTools,
    });
    setLoading(false);

    if (!result.success) {
      toast.error(typeof result.error === 'string' ? result.error : 'Opslaan mislukt');
      return;
    }

    toast.success(`SLA tarieven ${year} opgeslagen`);
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={`SLA Tarieven ${year} bewerken`} size="wide">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Vast maandtarief (€)</Label>
            <Input type="number" value={fixedRate} onChange={(e) => setFixedRate(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Support uurtarief (€)</Label>
            <Input type="number" value={supportRate} onChange={(e) => setSupportRate(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tools</h4>
          {tools.map((tool, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: dynamically added rows with no stable identity
            <div key={i} className="grid grid-cols-[1fr_120px_40px] gap-2 items-center">
              <Input
                value={tool.tool_name}
                onChange={(e) => updateTool(i, 'tool_name', e.target.value)}
                placeholder="bv. New Relic"
              />
              <Input
                type="number"
                value={tool.monthly_price}
                onChange={(e) => updateTool(i, 'monthly_price', e.target.value)}
                placeholder="€/m"
                className="text-right"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeTool(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addTool}>
            <Plus className="h-4 w-4 mr-1" /> Tool toevoegen
          </Button>
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Annuleer
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Save />
          {loading ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
