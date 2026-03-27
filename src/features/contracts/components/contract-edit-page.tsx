'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { PdfUploadField } from '@/components/admin/pdf-upload-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { upsertContract } from '../actions/upsert-contract';
import { upsertHourlyRates } from '../actions/upsert-hourly-rates';
import { upsertSlaRates } from '../actions/upsert-sla-rates';
import { upsertIndexationConfig } from '@/features/indexation/actions/upsert-indexation-config';
import type { Contract, ContractFormValues, HourlyRate, SlaRateWithTools } from '../types';
import type { IndexationConfig } from '@/features/indexation/types';

// ── Constants ──────────────────────────────────────────────────────────────

const MONTHS = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maart' },
  { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Augustus' }, { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const INDEX_TYPES = ['Agoria', 'Agoria Digital'];

const SECTION_WHITE = '[&_input]:bg-white [&_[data-slot=select-trigger]]:bg-white [&_button[data-slot=button]]:bg-white dark:[&_input]:bg-background dark:[&_[data-slot=select-trigger]]:bg-background dark:[&_button[data-slot=button]]:bg-background';

// ── Types ──────────────────────────────────────────────────────────────────

type RateEntry = { role: string; rate: string };
type ToolEntry = { tool_name: string; monthly_price: string };
type SlaYearState = { fixed_monthly_rate: string; support_hourly_rate: string; tools: ToolEntry[] };

type Props = {
  accountId: string;
  contract: Contract | null;
  hourlyRates: HourlyRate[];
  slaRates: SlaRateWithTools[];
  indexationConfig: IndexationConfig | null;
};

// ── Component ──────────────────────────────────────────────────────────────

export function ContractEditPage({ accountId, contract, hourlyRates, slaRates, indexationConfig }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // ── Contract state ─────────────────────────────────────────────────────
  const [hasFramework, setHasFramework] = useState(contract?.has_framework_contract ?? false);
  const [hasService, setHasService] = useState(contract?.has_service_contract ?? false);
  const [frameworkUrl, setFrameworkUrl] = useState(contract?.framework_pdf_url ?? '');
  const [frameworkDoc, setFrameworkDoc] = useState(contract?.framework_doc_path ?? '');
  const [serviceUrl, setServiceUrl] = useState(contract?.service_pdf_url ?? '');
  const [serviceDoc, setServiceDoc] = useState(contract?.service_doc_path ?? '');
  const [purchaseOrdersUrl, setPurchaseOrdersUrl] = useState(contract?.purchase_orders_url ?? '');
  const [purchaseOrdersDoc, setPurchaseOrdersDoc] = useState(contract?.purchase_orders_doc_path ?? '');

  // ── Indexation state ───────────────────────────────────────────────────
  const [indexType, setIndexType] = useState(indexationConfig?.indexation_type ?? '');
  const [indexMonth, setIndexMonth] = useState(String(indexationConfig?.start_month ?? ''));
  const [indexYear, setIndexYear] = useState(indexationConfig?.start_year?.toString() ?? '');

  // ── Year window (shared) ──────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const [hrWindowStart, setHrWindowStart] = useState(currentYear);
  const [slaWindowStart, setSlaWindowStart] = useState(currentYear);

  const hrVisibleYears = [hrWindowStart, hrWindowStart - 1, hrWindowStart - 2];
  const slaVisibleYears = [slaWindowStart, slaWindowStart - 1, slaWindowStart - 2];

  // ── Hourly rates state (multi-year) ────────────────────────────────────
  const [hrRoles, setHrRoles] = useState<string[]>(() => {
    const roles = new Set<string>();
    for (const r of hourlyRates) roles.add(r.role);
    return Array.from(roles).sort();
  });

  const [hrGrid, setHrGrid] = useState<Record<string, Record<number, string>>>(() => {
    const grid: Record<string, Record<number, string>> = {};
    for (const r of hourlyRates) {
      if (!grid[r.role]) grid[r.role] = {};
      grid[r.role][r.year] = String(Number(r.rate));
    }
    return grid;
  });

  const updateHrRate = useCallback((role: string, year: number, value: string) => {
    setHrGrid((prev) => ({
      ...prev,
      [role]: { ...prev[role], [year]: value },
    }));
  }, []);

  const addHrRole = useCallback(() => {
    const name = `Nieuwe rol ${hrRoles.length + 1}`;
    setHrRoles((prev) => [...prev, name]);
    setHrGrid((prev) => ({ ...prev, [name]: {} }));
  }, [hrRoles.length]);

  const removeHrRole = useCallback((role: string) => {
    setHrRoles((prev) => prev.filter((r) => r !== role));
    setHrGrid((prev) => {
      const next = { ...prev };
      delete next[role];
      return next;
    });
  }, []);

  const renameHrRole = useCallback((oldName: string, newName: string) => {
    if (oldName === newName) return;
    setHrRoles((prev) => prev.map((r) => (r === oldName ? newName : r)));
    setHrGrid((prev) => {
      const next = { ...prev };
      next[newName] = next[oldName] ?? {};
      delete next[oldName];
      return next;
    });
  }, []);

  // ── SLA rates state (multi-year) ──────────────────────────────────────
  const [slaGrid, setSlaGrid] = useState<Record<number, SlaYearState>>(() => {
    const grid: Record<number, SlaYearState> = {};
    for (const s of slaRates) {
      grid[s.year] = {
        fixed_monthly_rate: String(Number(s.fixed_monthly_rate)),
        support_hourly_rate: String(Number(s.support_hourly_rate)),
        tools: (s.tools ?? []).map((t) => ({ tool_name: t.tool_name, monthly_price: String(Number(t.monthly_price)) })),
      };
    }
    return grid;
  });

  const getSlaState = useCallback((year: number): SlaYearState => {
    return slaGrid[year] ?? { fixed_monthly_rate: '', support_hourly_rate: '', tools: [] };
  }, [slaGrid]);

  const updateSlaField = useCallback((year: number, field: 'fixed_monthly_rate' | 'support_hourly_rate', value: string) => {
    setSlaGrid((prev) => ({
      ...prev,
      [year]: { ...(prev[year] ?? { fixed_monthly_rate: '', support_hourly_rate: '', tools: [] }), [field]: value },
    }));
  }, []);

  const emptySla: SlaYearState = { fixed_monthly_rate: '', support_hourly_rate: '', tools: [] };

  const addSlaTool = useCallback((year: number) => {
    setSlaGrid((prev) => {
      const cur = prev[year] ?? emptySla;
      return { ...prev, [year]: { ...cur, tools: [...cur.tools, { tool_name: '', monthly_price: '' }] } };
    });
  }, []);

  const removeSlaTool = useCallback((year: number, index: number) => {
    setSlaGrid((prev) => {
      const cur = prev[year] ?? emptySla;
      return { ...prev, [year]: { ...cur, tools: cur.tools.filter((_, i) => i !== index) } };
    });
  }, []);

  const updateSlaTool = useCallback((year: number, index: number, field: keyof ToolEntry, value: string) => {
    setSlaGrid((prev) => {
      const cur = prev[year] ?? emptySla;
      return { ...prev, [year]: { ...cur, tools: cur.tools.map((t, i) => (i === index ? { ...t, [field]: value } : t)) } };
    });
  }, []);

  // ── Save all ──────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);

    // 1. Contract
    const contractValues: ContractFormValues = {
      has_framework_contract: hasFramework,
      framework_pdf_url: frameworkUrl || null,
      framework_doc_path: frameworkDoc || null,
      framework_start: (document.querySelector<HTMLInputElement>('[name="framework_start"]')?.value) || null,
      framework_end: (document.querySelector<HTMLInputElement>('[name="framework_end"]')?.value) || null,
      framework_indefinite: (document.querySelector<HTMLInputElement>('#framework_indefinite')?.checked) ?? false,
      has_service_contract: hasService,
      service_pdf_url: serviceUrl || null,
      service_doc_path: serviceDoc || null,
      service_start: (document.querySelector<HTMLInputElement>('[name="service_start"]')?.value) || null,
      service_end: (document.querySelector<HTMLInputElement>('[name="service_end"]')?.value) || null,
      service_indefinite: (document.querySelector<HTMLInputElement>('#service_indefinite')?.checked) ?? false,
      purchase_orders_url: purchaseOrdersUrl || null,
      purchase_orders_doc_path: purchaseOrdersDoc || null,
    };

    const contractResult = await upsertContract(accountId, contractValues);
    if (!contractResult.success) {
      toast.error(typeof contractResult.error === 'string' ? contractResult.error : 'Contract opslaan mislukt');
      setSaving(false);
      return;
    }

    // 2. Indexation config
    if (indexType || indexMonth || indexYear) {
      await upsertIndexationConfig({
        account_id: accountId,
        indexation_type: indexType || null,
        start_month: indexMonth ? Number(indexMonth) : null,
        start_year: indexYear ? Number(indexYear) : null,
      });
    }

    // 3. Hourly rates — save all years that have data in the grid
    const hrYearsWithData = new Set<number>();
    for (const role of hrRoles) {
      for (const [yearStr, val] of Object.entries(hrGrid[role] ?? {})) {
        if (Number(val) > 0) hrYearsWithData.add(Number(yearStr));
      }
    }
    for (const year of hrYearsWithData) {
      const rates = hrRoles
        .map((role) => ({ role, rate: Number(hrGrid[role]?.[year] || 0) }))
        .filter((r) => r.rate > 0);
      if (rates.length > 0) {
        await upsertHourlyRates(accountId, year, rates);
      }
    }

    // 4. SLA rates — save all years that have data in the grid
    for (const [yearStr, state] of Object.entries(slaGrid)) {
      const year = Number(yearStr);
      const fixed = Number(state.fixed_monthly_rate) || 0;
      const support = Number(state.support_hourly_rate) || 0;
      if (fixed > 0 || support > 0) {
        const tools = state.tools
          .filter((t) => t.tool_name.trim() && Number(t.monthly_price) > 0)
          .map((t) => ({ tool_name: t.tool_name.trim(), monthly_price: Number(t.monthly_price) }));
        await upsertSlaRates(accountId, year, { fixed_monthly_rate: fixed, support_hourly_rate: support, tools });
      }
    }

    setSaving(false);
    toast.success('Alles opgeslagen');
    router.push(`/admin/accounts/${accountId}/contracten`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracten & Tarieven bewerken"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts', href: '/admin/accounts' },
          { label: 'Account', href: `/admin/accounts/${accountId}` },
          { label: 'Contracten', href: `/admin/accounts/${accountId}/contracten` },
          { label: 'Bewerken' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={`/admin/accounts/${accountId}/contracten`} />}>
              <ArrowLeft /> Annuleren
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save />
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        }
      />

      {/* ── Top row: contracts side by side ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Raamcontract */}
        <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raamcontract</h2>
            <Switch checked={hasFramework} onCheckedChange={setHasFramework} />
          </div>
          {hasFramework && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start</Label>
                  <DatePicker name="framework_start" value={contract?.framework_start ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label>Einde</Label>
                  <DatePicker name="framework_end" value={contract?.framework_end ?? ''} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Document uploaden</Label>
                <PdfUploadField value={frameworkDoc} onChange={setFrameworkDoc} folder={`contracts/${accountId}`} />
              </div>
              <div className="space-y-1.5">
                <Label>Link naar document (URL)</Label>
                <Input
                  value={frameworkUrl}
                  onChange={(e) => setFrameworkUrl(e.target.value)}
                  placeholder="https://confluence.phpro.be/..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="framework_indefinite" defaultChecked={contract?.framework_indefinite ?? false} />
                <Label htmlFor="framework_indefinite">Onbepaalde duur</Label>
              </div>
            </div>
          )}
        </div>

        {/* Right: Dienstencontract */}
        <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dienstencontract (SLA)</h2>
            <Switch checked={hasService} onCheckedChange={setHasService} />
          </div>
          {hasService && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start</Label>
                  <DatePicker name="service_start" value={contract?.service_start ?? ''} />
                </div>
                <div className="space-y-1.5">
                  <Label>Einde</Label>
                  <DatePicker name="service_end" value={contract?.service_end ?? ''} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Document uploaden</Label>
                <PdfUploadField value={serviceDoc} onChange={setServiceDoc} folder={`contracts/${accountId}`} />
              </div>
              <div className="space-y-1.5">
                <Label>Link naar document (URL)</Label>
                <Input
                  value={serviceUrl}
                  onChange={(e) => setServiceUrl(e.target.value)}
                  placeholder="https://confluence.phpro.be/..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="service_indefinite" defaultChecked={contract?.service_indefinite ?? false} />
                <Label htmlFor="service_indefinite">Onbepaalde duur</Label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Second row: Indexering + Bestelbonnen side by side ─────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Indexering</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={indexType} onValueChange={(v) => setIndexType(v ?? '')}>
                <SelectTrigger>{indexType || 'Niet ingesteld'}</SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Niet ingesteld</SelectItem>
                  {INDEX_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vanaf maand</Label>
              <Select value={indexMonth} onValueChange={(v) => setIndexMonth(v ?? '')}>
                <SelectTrigger>{indexMonth ? MONTHS.find((m) => m.value === indexMonth)?.label : 'Selecteer...'}</SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vanaf jaar</Label>
              <Input type="number" value={indexYear} onChange={(e) => setIndexYear(e.target.value)} placeholder={String(currentYear)} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bestelbonnen</h2>
          <div className="space-y-1.5">
            <Label>Link (Confluence URL)</Label>
            <Input value={purchaseOrdersUrl} onChange={(e) => setPurchaseOrdersUrl(e.target.value)} placeholder="https://confluence.phpro.be/..." />
          </div>
          <div className="space-y-1.5">
            <Label>Document uploaden</Label>
            <PdfUploadField value={purchaseOrdersDoc} onChange={setPurchaseOrdersDoc} folder={`contracts/${accountId}`} />
          </div>
        </div>
      </div>

      {/* ── Uurtarieven (full width table) ────────────────────────── */}
      <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uurtarieven</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => setHrWindowStart((y) => y + 1)}>
              <ChevronLeft />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {hrVisibleYears[0]}–{hrVisibleYears[2]}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => setHrWindowStart((y) => y - 1)}>
              <ChevronRight />
            </Button>
            <Button variant="outline" size="sm" onClick={addHrRole}>
              <Plus /> Rol
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2.5 font-medium w-56">Rol</th>
                {hrVisibleYears.map((year, i) => (
                  <th key={year} className={`text-right p-2.5 font-medium w-32 ${year === currentYear ? 'bg-primary/5' : ''}`}>
                    {year} (€/u)
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {hrRoles.map((role) => (
                <tr key={role} className="border-b last:border-0">
                  <td className="p-1.5">
                    <Input
                      value={role}
                      onChange={(e) => renameHrRole(role, e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  {hrVisibleYears.map((year, i) => (
                    <td key={year} className={`p-1.5 ${year === currentYear ? 'bg-primary/5' : ''}`}>
                      <Input
                        type="number"
                        value={hrGrid[role]?.[year] ?? ''}
                        onChange={(e) => updateHrRate(role, year, e.target.value)}
                        placeholder="0"
                        className="h-9 text-right text-sm"
                      />
                    </td>
                  ))}
                  <td className="p-1.5 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeHrRole(role)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {hrRoles.length === 0 && (
                <tr>
                  <td colSpan={hrVisibleYears.length + 2} className="p-6 text-center text-muted-foreground">
                    Geen rollen. Klik &quot;Rol toevoegen&quot; om te beginnen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SLA Tarieven (per-year cards in grid) ─────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SLA Tarieven</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => setSlaWindowStart((y) => y + 1)}>
              <ChevronLeft />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {slaVisibleYears[0]}–{slaVisibleYears[2]}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => setSlaWindowStart((y) => y - 1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {slaVisibleYears.map((year, yi) => {
            const state = getSlaState(year);
            const isCurrentYear = year === currentYear;
            return (
              <div
                key={year}
                className={`rounded-xl border p-5 space-y-4 shadow-sm ${
                  year === currentYear ? `bg-primary/5 border-primary/20 ${SECTION_WHITE}` : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{year}</h3>
                  {isCurrentYear && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary-action">
                      Huidig
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vast maandtarief (€/m)</Label>
                    <Input
                      type="number"
                      value={state.fixed_monthly_rate}
                      onChange={(e) => updateSlaField(year, 'fixed_monthly_rate', e.target.value)}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Support uurtarief (€/u)</Label>
                    <Input
                      type="number"
                      value={state.support_hourly_rate}
                      onChange={(e) => updateSlaField(year, 'support_hourly_rate', e.target.value)}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Tools */}
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Tools & Modules</span>
                    <Button type="button" variant="outline" size="xs" onClick={() => addSlaTool(year)}>
                      <Plus /> Tool
                    </Button>
                  </div>
                  {state.tools.length > 0 && (
                    <div className="space-y-1.5">
                      {state.tools.map((tool, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Input
                            value={tool.tool_name}
                            onChange={(e) => updateSlaTool(year, i, 'tool_name', e.target.value)}
                            placeholder="Naam"
                            className="h-8 flex-1 text-xs"
                          />
                          <Input
                            type="number"
                            value={tool.monthly_price}
                            onChange={(e) => updateSlaTool(year, i, 'monthly_price', e.target.value)}
                            placeholder="€/m"
                            className="h-8 w-20 text-right text-xs"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeSlaTool(year, i)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Acties ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-5 shadow-sm flex justify-end gap-2">
        <Button variant="outline" nativeButton={false} render={<Link href={`/admin/accounts/${accountId}/contracten`} />}>
          Annuleren
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save />
          {saving ? 'Opslaan...' : 'Alles opslaan'}
        </Button>
      </div>
    </div>
  );
}
