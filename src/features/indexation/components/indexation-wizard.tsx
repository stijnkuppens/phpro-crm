'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { simulateIndexation } from '../actions/simulate-indexation';
import { saveIndexationDraft } from '../actions/save-indexation-draft';
import { approveIndexation } from '../actions/approve-indexation';
import type { SimulationResult, IndexationDraftValues } from '../types';

type Props = {
  accountId: string;
  open: boolean;
  onClose: () => void;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);

export function IndexationWizard({ accountId, open, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [baseYear, setBaseYear] = useState(new Date().getFullYear() - 1);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [percentage, setPercentage] = useState(0);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  async function handleSimulate() {
    setLoading(true);
    const result = await simulateIndexation(accountId, baseYear, percentage);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Simulatie mislukt');
      return;
    }

    if ('data' in result && result.data) {
      setSimulation(result.data);
      setStep(2);
    }
  }

  async function handleSaveDraft() {
    if (!simulation) return;
    setLoading(true);

    const values: IndexationDraftValues = {
      target_year: targetYear,
      base_year: baseYear,
      percentage,
      rates: simulation.rates,
      sla: simulation.sla ? {
        fixed_monthly_rate: simulation.sla.proposed_fixed,
        support_hourly_rate: simulation.sla.proposed_support,
      } : null,
    };

    const result = await saveIndexationDraft(accountId, values);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Opslaan mislukt');
      return;
    }

    if ('data' in result && result.data) {
      setDraftId(result.data.id);
      toast.success('Draft opgeslagen');
      setStep(3);
    }
  }

  async function handleApprove() {
    if (!draftId) return;
    setLoading(true);
    const result = await approveIndexation(accountId, draftId);
    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Goedkeuring mislukt');
      return;
    }

    toast.success('Indexatie goedgekeurd en toegepast');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Indexatie — Stap ${step} van 3`} size="wide">
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configureer het basisjaar, doeljaar en het indexatiepercentage.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_year">Basisjaar</Label>
              <Input id="base_year" type="number" value={baseYear} onChange={(e) => setBaseYear(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_year">Doeljaar</Label>
              <Input id="target_year" type="number" value={targetYear} onChange={(e) => setTargetYear(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentage (%)</Label>
              <Input id="percentage" type="number" step="0.01" value={percentage} onChange={(e) => setPercentage(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSimulate} disabled={loading || percentage <= 0}>
              {loading ? 'Berekenen...' : 'Simuleren'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && simulation && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Resultaat: +{percentage}% op basis van {baseYear} → {targetYear}
          </p>
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">Rol</th>
                  <th className="text-right p-2">Huidig</th>
                  <th className="text-right p-2">Voorstel</th>
                </tr>
              </thead>
              <tbody>
                {simulation.rates.map((r) => (
                  <tr key={r.role} className="border-b last:border-0">
                    <td className="p-2">{r.role}</td>
                    <td className="p-2 text-right">{fmt(r.current_rate)}</td>
                    <td className="p-2 text-right font-medium">{fmt(r.proposed_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {simulation.sla && (
            <div className="border rounded-md p-3 text-sm space-y-1">
              <div className="font-medium">SLA Tarieven</div>
              <div className="flex justify-between">
                <span>Vast maandbedrag</span>
                <span>{fmt(simulation.sla.fixed_monthly_rate)} → <strong>{fmt(simulation.sla.proposed_fixed)}</strong></span>
              </div>
              <div className="flex justify-between">
                <span>Support uurtarief</span>
                <span>{fmt(simulation.sla.support_hourly_rate)} → <strong>{fmt(simulation.sla.proposed_support)}</strong></span>
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(1)}>Terug</Button>
            <Button onClick={handleSaveDraft} disabled={loading}>
              {loading ? 'Opslaan...' : 'Draft opslaan'}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            De draft is opgeslagen. Keur de indexatie goed om de nieuwe tarieven toe te passen voor {targetYear}.
          </p>
          <div className="p-4 border rounded-md bg-muted/30 text-sm">
            <div>Basisjaar: {baseYear}</div>
            <div>Doeljaar: {targetYear}</div>
            <div>Percentage: +{percentage}%</div>
            <div>Rollen: {simulation?.rates.length ?? 0}</div>
            <div>SLA: {simulation?.sla ? 'Ja' : 'Nee'}</div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(2)}>Terug</Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? 'Goedkeuren...' : 'Goedkeuren & toepassen'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
