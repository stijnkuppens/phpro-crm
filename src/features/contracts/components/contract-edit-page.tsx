'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PdfUploadField } from '@/components/admin/pdf-upload-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { upsertContract } from '@/features/contracts/actions/upsert-contract';
import { upsertHourlyRates } from '@/features/contracts/actions/upsert-hourly-rates';
import { upsertSlaRates } from '@/features/contracts/actions/upsert-sla-rates';
import { upsertIndexationConfig } from '@/features/indexation/actions/upsert-indexation-config';
import { ContractFrameworkCard } from '@/features/contracts/components/contract-framework-card';
import { ContractServiceCard } from '@/features/contracts/components/contract-service-card';
import { ContractHourlyRatesSection } from '@/features/contracts/components/contract-hourly-rates-section';
import { ContractSlaRatesSection } from '@/features/contracts/components/contract-sla-rates-section';
import type { Contract, ContractFormValues, HourlyRate, SlaRateWithTools, SlaYearState, ToolEntry } from '@/features/contracts/types';
import type { IndexationConfig } from '@/features/indexation/types';

// ── Constants ──────────────────────────────────────────────────────────────

const MONTHS = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maart' },
  { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Augustus' }, { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const INDEX_TYPES = ['Agoria', 'Agoria Digital'];

// ── Types ──────────────────────────────────────────────────────────────────

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
        <ContractFrameworkCard
          hasFramework={hasFramework}
          setHasFramework={setHasFramework}
          frameworkUrl={frameworkUrl}
          setFrameworkUrl={setFrameworkUrl}
          frameworkDoc={frameworkDoc}
          setFrameworkDoc={setFrameworkDoc}
          contract={contract}
          accountId={accountId}
        />
        <ContractServiceCard
          hasService={hasService}
          setHasService={setHasService}
          serviceUrl={serviceUrl}
          setServiceUrl={setServiceUrl}
          serviceDoc={serviceDoc}
          setServiceDoc={setServiceDoc}
          contract={contract}
          accountId={accountId}
        />
      </div>

      {/* ── Second row: Indexering + Bestelbonnen side by side ─────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5 space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bestelbonnen</h2>
            <div className="space-y-1.5">
              <Label>Link (Confluence URL)</Label>
              <Input value={purchaseOrdersUrl} onChange={(e) => setPurchaseOrdersUrl(e.target.value)} placeholder="https://confluence.phpro.be/..." />
            </div>
            <div className="space-y-1.5">
              <Label>Document uploaden</Label>
              <PdfUploadField value={purchaseOrdersDoc} onChange={setPurchaseOrdersDoc} folder={`contracts/${accountId}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Uurtarieven (full width table) ────────────────────────── */}
      <ContractHourlyRatesSection
        hrRoles={hrRoles}
        hrGrid={hrGrid}
        hrVisibleYears={hrVisibleYears}
        currentYear={currentYear}
        updateHrRate={updateHrRate}
        addHrRole={addHrRole}
        removeHrRole={removeHrRole}
        renameHrRole={renameHrRole}
        setHrWindowStart={setHrWindowStart}
      />

      {/* ── SLA Tarieven (per-year cards in grid) ─────────────────── */}
      <ContractSlaRatesSection
        slaVisibleYears={slaVisibleYears}
        currentYear={currentYear}
        getSlaState={getSlaState}
        updateSlaField={updateSlaField}
        addSlaTool={addSlaTool}
        removeSlaTool={removeSlaTool}
        updateSlaTool={updateSlaTool}
        setSlaWindowStart={setSlaWindowStart}
      />

      {/* ── Acties ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 flex justify-end gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href={`/admin/accounts/${accountId}/contracten`} />}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save />
            {saving ? 'Opslaan...' : 'Alles opslaan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
