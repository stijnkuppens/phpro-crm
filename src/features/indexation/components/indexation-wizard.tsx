'use client';

import { Check, RotateCcw, Save } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import { approveIndexation } from '../actions/approve-indexation';
import { saveIndexationDraft } from '../actions/save-indexation-draft';
import { simulateIndexation } from '../queries/simulate-indexation';
import type { IndexationDraftFull, IndexationDraftValues, SimulationResult } from '../types';

type Props = {
  accountId: string;
  open: boolean;
  onClose: () => void;
  draft?: IndexationDraftFull | null;
};

const STEP_TITLES = ['% Instellen', 'Simulatie', 'Onderhandeling', 'Goedkeuring'];
const QUICK_PCTS = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0];

function applyIndex(val: number, pct: number): number {
  if (!val || !pct) return val;
  return Math.round(val * (1 + pct / 100));
}

export function IndexationWizard({ accountId, open, onClose, draft }: Props) {
  const hasDraftData = draft && draft.rates?.length > 0;

  const [step, setStep] = useState(hasDraftData ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const [baseYear, setBaseYear] = useState(draft?.base_year ?? new Date().getFullYear() - 1);
  const [targetYear, setTargetYear] = useState(draft?.target_year ?? new Date().getFullYear());
  const [percentageStr, setPercentageStr] = useState(draft ? String(Number(draft.percentage)) : '');
  const percentage = Number(percentageStr) || 0;

  // Simulation result
  const [simulation, setSimulation] = useState<SimulationResult | null>(() => {
    if (!hasDraftData) return null;
    return {
      rates: draft.rates.map((r) => ({
        role: r.role,
        current_rate: Number(r.current_rate),
        proposed_rate: applyIndex(Number(r.current_rate), Number(draft.percentage)),
      })),
      sla: draft.sla
        ? {
            fixed_monthly_rate: 0,
            support_hourly_rate: 0,
            proposed_fixed: Number(draft.sla.fixed_monthly_rate),
            proposed_support: Number(draft.sla.support_hourly_rate),
          }
        : null,
    };
  });

  // Step 3: Negotiation state
  type NegotiationState = {
    rates: Record<string, string>;
    sla: Record<string, string>;
    pctHourly: string;
    pctSla: string;
    info: string;
  };

  const [negotiation, setNegotiation] = useState<NegotiationState>(() => {
    const rates: Record<string, string> = {};
    if (hasDraftData) {
      for (const r of draft.rates) rates[r.role] = String(Number(r.proposed_rate));
    }
    const sla: Record<string, string> = draft?.sla
      ? {
          fixed_monthly_rate: String(Number(draft.sla.fixed_monthly_rate)),
          support_hourly_rate: String(Number(draft.sla.support_hourly_rate)),
        }
      : {};
    return {
      rates,
      sla,
      pctHourly:
        draft?.adjustment_pct_hourly != null ? String(Number(draft.adjustment_pct_hourly)) : '',
      pctSla: draft?.adjustment_pct_sla != null ? String(Number(draft.adjustment_pct_sla)) : '',
      info: draft?.info ?? '',
    };
  });

  const updateNegotiation = useCallback((updates: Partial<NegotiationState>) => {
    setNegotiation((prev) => ({ ...prev, ...updates }));
  }, []);

  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);

  // Initialize negotiation state from simulation
  const initNegotiationFromSim = useCallback(
    (sim: SimulationResult) => {
      const rates: Record<string, string> = {};
      for (const r of sim.rates) rates[r.role] = String(r.proposed_rate);
      updateNegotiation({
        rates,
        sla: sim.sla
          ? {
              fixed_monthly_rate: String(sim.sla.proposed_fixed),
              support_hourly_rate: String(sim.sla.proposed_support),
            }
          : {},
        pctHourly: String(percentage),
        pctSla: String(percentage),
      });
    },
    [percentage, updateNegotiation],
  );

  // Bulk recalculate hourly rates from a new %
  const recalcHourly = useCallback(
    (pct: number) => {
      if (!simulation) return;
      const rates: Record<string, string> = {};
      for (const r of simulation.rates) {
        rates[r.role] = String(applyIndex(r.current_rate, pct));
      }
      updateNegotiation({ rates });
    },
    [simulation, updateNegotiation],
  );

  // Bulk recalculate SLA from a new %
  const recalcSla = useCallback(
    (pct: number) => {
      if (!simulation?.sla) return;
      updateNegotiation({
        sla: {
          fixed_monthly_rate: String(applyIndex(simulation.sla.fixed_monthly_rate, pct)),
          support_hourly_rate: String(applyIndex(simulation.sla.support_hourly_rate, pct)),
        },
      });
    },
    [simulation, updateNegotiation],
  );

  // Get final negotiated value (draft or simulated fallback)
  const getFinalRate = useCallback(
    (role: string) => {
      return Number(negotiation.rates[role]) || 0;
    },
    [negotiation.rates],
  );

  const getFinalSla = useCallback(
    (key: string) => {
      return Number(negotiation.sla[key]) || 0;
    },
    [negotiation.sla],
  );

  // Step 1: Simulate
  async function handleSimulate() {
    setLoading(true);
    const result = await simulateIndexation(accountId, baseYear, percentage);
    setLoading(false);

    if (!result.success) {
      toast.error(typeof result.error === 'string' ? result.error : 'Simulatie mislukt');
      return;
    }

    if (result.data) {
      setSimulation(result.data);
      setStep(2);
    }
  }

  // Step 2 → 3: Initialize negotiation
  function goToNegotiation() {
    if (simulation) initNegotiationFromSim(simulation);
    setStep(3);
  }

  // Step 3: Save draft
  async function handleSaveDraft() {
    if (!simulation) return;
    setLoading(true);

    const values: IndexationDraftValues = {
      target_year: targetYear,
      base_year: baseYear,
      percentage,
      info: negotiation.info || undefined,
      adjustment_pct_hourly: Number(negotiation.pctHourly) || null,
      adjustment_pct_sla: Number(negotiation.pctSla) || null,
      rates: simulation.rates.map((r) => ({
        role: r.role,
        current_rate: r.current_rate,
        proposed_rate: getFinalRate(r.role),
      })),
      sla: simulation.sla
        ? {
            fixed_monthly_rate: getFinalSla('fixed_monthly_rate'),
            support_hourly_rate: getFinalSla('support_hourly_rate'),
          }
        : null,
    };

    const result = await saveIndexationDraft(accountId, values);
    setLoading(false);

    if (!result.success) {
      toast.error(typeof result.error === 'string' ? result.error : 'Opslaan mislukt');
      return;
    }

    if (result.data) {
      setDraftId(result.data.id);
      toast.success('Draft opgeslagen');
    }
  }

  // Step 4: Approve
  async function handleApprove() {
    if (!draftId) {
      // Save draft first if not yet saved
      await handleSaveDraft();
    }
    if (!draftId) return;

    setLoading(true);
    const result = await approveIndexation(accountId, draftId);
    setLoading(false);

    if (!result.success) {
      toast.error(typeof result.error === 'string' ? result.error : 'Goedkeuring mislukt');
      return;
    }

    toast.success('Indexatie goedgekeurd en toegepast');
    onClose();
  }

  // Clickable step navigation (can go back to completed steps)
  function goToStep(s: number) {
    if (s < step) setStep(s);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Indexatie — ${STEP_TITLES[step - 1]}`}
      size="extra-wide"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEP_TITLES.map((title, i) => {
          const s = i + 1;
          const completed = s < step;
          const current = s === step;
          return (
            <div key={s} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToStep(s)}
                disabled={s >= step}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  completed || current
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                } ${completed ? 'cursor-pointer hover:opacity-80' : s > step ? 'cursor-default' : ''}`}
              >
                {completed ? <Check className="h-4 w-4" /> : s}
              </button>
              <span className={`text-sm ${current ? 'font-medium' : 'text-muted-foreground'}`}>
                {title}
              </span>
              {i < STEP_TITLES.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: % Instellen ──────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Kies het indexatiepercentage. Gebruik een snelkeuze of voer een eigen waarde in.
          </p>

          {/* Quick-select buttons */}
          <div className="flex flex-wrap gap-2">
            {QUICK_PCTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPercentageStr(String(p))}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  percentage === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                +{p}%
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Basisjaar</Label>
              <Input
                type="number"
                value={baseYear}
                onChange={(e) => setBaseYear(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Doeljaar</Label>
              <Input
                type="number"
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Percentage (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={percentageStr}
                onChange={(e) => setPercentageStr(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSimulate} disabled={loading || percentage <= 0}>
              {loading ? 'Berekenen...' : 'Simuleren →'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Simulatie (read-only) ────────────────────────── */}
      {step === 2 && simulation && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Overzicht: +{percentage}% op basis van {baseYear} → {targetYear}
          </p>

          {/* Hourly rates table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2.5 font-medium">Rol</th>
                  <th className="text-right p-2.5 font-medium">Huidig ({baseYear})</th>
                  <th className="text-right p-2.5 font-medium">Gesimuleerd ({targetYear})</th>
                  <th className="text-right p-2.5 font-medium">Verschil</th>
                </tr>
              </thead>
              <tbody>
                {simulation.rates.map((r) => {
                  const diff = r.proposed_rate - r.current_rate;
                  return (
                    <tr key={r.role} className="border-b last:border-0">
                      <td className="p-2.5">{r.role}</td>
                      <td className="p-2.5 text-right">{formatCurrency(r.current_rate)}</td>
                      <td className="p-2.5 text-right font-medium">
                        {formatCurrency(r.proposed_rate)}
                      </td>
                      <td
                        className={`p-2.5 text-right text-xs font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}`}
                      >
                        {diff > 0 ? '+' : ''}
                        {diff !== 0 ? formatCurrency(diff) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SLA table */}
          {simulation.sla && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2.5 font-medium">Kostenpost</th>
                    <th className="text-right p-2.5 font-medium">Huidig</th>
                    <th className="text-right p-2.5 font-medium">Gesimuleerd</th>
                    <th className="text-right p-2.5 font-medium">Verschil</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: 'Vast maandtarief',
                      current: simulation.sla.fixed_monthly_rate,
                      proposed: simulation.sla.proposed_fixed,
                    },
                    {
                      label: 'Support uurtarief',
                      current: simulation.sla.support_hourly_rate,
                      proposed: simulation.sla.proposed_support,
                    },
                  ].map((row) => {
                    const diff = row.proposed - row.current;
                    return (
                      <tr key={row.label} className="border-b last:border-0">
                        <td className="p-2.5">{row.label}</td>
                        <td className="p-2.5 text-right">{formatCurrency(row.current)}</td>
                        <td className="p-2.5 text-right font-medium">
                          {formatCurrency(row.proposed)}
                        </td>
                        <td
                          className={`p-2.5 text-right text-xs font-medium ${diff > 0 ? 'text-green-600' : ''}`}
                        >
                          {diff > 0 ? '+' : ''}
                          {diff !== 0 ? formatCurrency(diff) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(1)}>
              Terug
            </Button>
            <Button onClick={goToNegotiation}>Onderhandeling →</Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Onderhandeling ───────────────────────────────── */}
      {step === 3 && simulation && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Pas individuele tarieven aan of herbereken alles met een ander percentage.
          </p>

          {/* Bulk recalculation */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Herbereken uurtarieven op %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={negotiation.pctHourly}
                  onChange={(e) => {
                    updateNegotiation({ pctHourly: e.target.value });
                    const p = Number(e.target.value);
                    if (p > 0) recalcHourly(p);
                  }}
                  placeholder={String(percentage)}
                  className="bg-white dark:bg-background"
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  updateNegotiation({ pctHourly: String(percentage) });
                  recalcHourly(percentage);
                }}
                title="Reset naar simulatie %"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Herbereken SLA op %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={negotiation.pctSla}
                  onChange={(e) => {
                    updateNegotiation({ pctSla: e.target.value });
                    const p = Number(e.target.value);
                    if (p > 0) recalcSla(p);
                  }}
                  placeholder={String(percentage)}
                  className="bg-white dark:bg-background"
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  updateNegotiation({ pctSla: String(percentage) });
                  recalcSla(percentage);
                }}
                title="Reset naar simulatie %"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Hourly rates — editable */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2.5 font-medium">Rol</th>
                  <th className="text-right p-2.5 font-medium">Huidig</th>
                  <th className="text-right p-2.5 font-medium">Sim +{percentage}%</th>
                  <th className="text-right p-2.5 font-medium">Onderhandeld</th>
                </tr>
              </thead>
              <tbody>
                {simulation.rates.map((r) => {
                  const negotiated = Number(negotiation.rates[r.role]) || 0;
                  const diff = negotiated - r.proposed_rate;
                  return (
                    <tr key={r.role} className="border-b last:border-0">
                      <td className="p-2.5">{r.role}</td>
                      <td className="p-2.5 text-right text-muted-foreground">
                        {formatCurrency(r.current_rate)}
                      </td>
                      <td className="p-2.5 text-right text-muted-foreground">
                        {formatCurrency(r.proposed_rate)}
                      </td>
                      <td className="p-1.5 w-36">
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={negotiation.rates[r.role] ?? ''}
                            onChange={(e) =>
                              setNegotiation((prev) => ({
                                ...prev,
                                rates: {
                                  ...prev.rates,
                                  [r.role]: e.target.value,
                                },
                              }))
                            }
                            placeholder={String(r.proposed_rate)}
                            className="h-8 text-right text-sm"
                          />
                          {diff !== 0 && (
                            <span
                              className={`text-[10px] font-medium shrink-0 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {diff > 0 ? '+' : ''}
                              {Math.round(diff)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SLA — editable */}
          {simulation.sla && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2.5 font-medium">Kostenpost</th>
                    <th className="text-right p-2.5 font-medium">Huidig</th>
                    <th className="text-right p-2.5 font-medium">Gesimuleerd</th>
                    <th className="text-right p-2.5 font-medium">Onderhandeld</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      key: 'fixed_monthly_rate',
                      label: 'Vast maandtarief',
                      current: simulation.sla.fixed_monthly_rate,
                      sim: simulation.sla.proposed_fixed,
                    },
                    {
                      key: 'support_hourly_rate',
                      label: 'Support uurtarief',
                      current: simulation.sla.support_hourly_rate,
                      sim: simulation.sla.proposed_support,
                    },
                  ].map((row) => (
                    <tr key={row.key} className="border-b last:border-0">
                      <td className="p-2.5">{row.label}</td>
                      <td className="p-2.5 text-right text-muted-foreground">
                        {formatCurrency(row.current)}
                      </td>
                      <td className="p-2.5 text-right text-muted-foreground">
                        {formatCurrency(row.sim)}
                      </td>
                      <td className="p-1.5 w-36">
                        <Input
                          type="number"
                          value={negotiation.sla[row.key] ?? ''}
                          onChange={(e) =>
                            setNegotiation((prev) => ({
                              ...prev,
                              sla: { ...prev.sla, [row.key]: e.target.value },
                            }))
                          }
                          placeholder={String(row.sim)}
                          className="h-8 text-right text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notities (context, afspraken, open punten)</Label>
            <Textarea
              value={negotiation.info}
              onChange={(e) => updateNegotiation({ info: e.target.value })}
              placeholder="Bijv. klant akkoord met 2.5% op uurtarieven, SLA blijft gelijk..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(2)}>
              Terug
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
              <Save />
              {loading ? 'Opslaan...' : 'Opslaan als draft'}
            </Button>
            <Button onClick={() => setStep(4)}>Naar goedkeuring →</Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Goedkeuring ──────────────────────────────────── */}
      {step === 4 && simulation && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Controleer de definitieve tarieven voor {targetYear}. Na goedkeuring worden deze direct
            toegepast.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Hourly rates summary */}
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/50 p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Uurtarieven {targetYear}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {simulation.rates.map((r) => {
                    const final = getFinalRate(r.role);
                    return (
                      <tr key={r.role} className="border-b last:border-0">
                        <td className="p-2.5">{r.role}</td>
                        <td className="p-2.5 text-right text-muted-foreground line-through">
                          {formatCurrency(r.current_rate)}
                        </td>
                        <td className="p-2.5 text-right font-medium text-green-600">
                          {formatCurrency(final)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SLA summary */}
            <div className="space-y-4">
              {simulation.sla && (
                <div className="rounded-lg border overflow-hidden">
                  <div className="bg-muted/50 p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    SLA Tarieven {targetYear}
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        {
                          label: 'Vast maandtarief',
                          current: simulation.sla.fixed_monthly_rate,
                          final: getFinalSla('fixed_monthly_rate'),
                        },
                        {
                          label: 'Support uurtarief',
                          current: simulation.sla.support_hourly_rate,
                          final: getFinalSla('support_hourly_rate'),
                        },
                      ].map((row) => (
                        <tr key={row.label} className="border-b last:border-0">
                          <td className="p-2.5">{row.label}</td>
                          <td className="p-2.5 text-right text-muted-foreground line-through">
                            {formatCurrency(row.current)}
                          </td>
                          <td className="p-2.5 text-right font-medium text-green-600">
                            {formatCurrency(row.final)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Meta info */}
              <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Basisjaar:</span>
                  <span className="font-medium">{baseYear}</span>
                  <span className="text-muted-foreground">Doeljaar:</span>
                  <span className="font-medium">{targetYear}</span>
                  <span className="text-muted-foreground">Basis %:</span>
                  <span className="font-medium">+{percentage}%</span>
                  {negotiation.pctHourly && Number(negotiation.pctHourly) !== percentage && (
                    <>
                      <span className="text-muted-foreground">Aanpassing uurtarieven:</span>
                      <span className="font-medium">+{negotiation.pctHourly}%</span>
                    </>
                  )}
                  {negotiation.pctSla && Number(negotiation.pctSla) !== percentage && (
                    <>
                      <span className="text-muted-foreground">Aanpassing SLA:</span>
                      <span className="font-medium">+{negotiation.pctSla}%</span>
                    </>
                  )}
                </div>
              </div>

              {negotiation.info && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Notities</div>
                  <p className="whitespace-pre-wrap">{negotiation.info}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(3)}>
              Terug
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? 'Goedkeuren...' : 'Bevestigen & tarieven opslaan'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
