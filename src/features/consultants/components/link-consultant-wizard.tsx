'use client';

import { ArrowLeft, Check, Save, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createContext, use, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ACCOUNT_TYPE_STYLES } from '@/features/accounts/types';
import { formatEUR } from '@/lib/format';
import { createBrowserClient } from '@/lib/supabase/client';
import { linkConsultantToAccount } from '../actions/link-consultant-to-account';
import type { ConsultantAccount } from '../types';
import { CONSULTANT_PRIORITY_STYLES } from '../types';

type BenchConsultant = {
  id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  priority: string;
  roles: string[] | null;
  technologies: string[] | null;
  min_hourly_rate: number | null;
  max_hourly_rate: number | null;
  available_date: string | null;
  languages: { id: string; language: string; level: string }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  accounts: ConsultantAccount[];
  roles: { value: string; label: string }[];
  /** Pre-select account (from account page) — skips step 1 */
  preselectedAccountId?: string;
  /** Pre-select bench consultant (from bench page) — skips step 2 */
  preselectedBenchConsultantId?: string;
};

function calcWorkdays(start: string, end: string | null): number {
  if (!end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  const totalDays = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  const fullWeeks = Math.floor(totalDays / 7);
  const remainder = totalDays % 7;
  const startDay = s.getDay();
  let extraWorkdays = 0;
  for (let i = 0; i < remainder; i++) {
    const day = (startDay + i) % 7;
    if (day !== 0 && day !== 6) extraWorkdays++;
  }
  return fullWeeks * 5 + extraWorkdays;
}

/* ─── Context ─────────────────────────────────────────────────────────── */

type WizardState = {
  step: number;
  accountId: string;
  accountSearch: string;
  accountTypeFilter: string;
  benchId: string;
  benchSearch: string;
  benchConsultants: BenchConsultant[];
  benchLoading: boolean;
  role: string;
  startDate: string;
  endDate: string;
  isIndefinite: boolean;
  hourlyRate: string;
  dailyRate: string;
  noticePeriod: string;
  sowUrl: string;
  notes: string;
  loading: boolean;
};

type WizardActions = {
  setStep: (step: number) => void;
  setAccountId: (id: string) => void;
  setAccountSearch: (search: string) => void;
  setAccountTypeFilter: (filter: string) => void;
  setBenchId: (id: string) => void;
  setBenchSearch: (search: string) => void;
  goToStep3: (bench: BenchConsultant) => void;
  onHourlyChange: (val: string) => void;
  onDailyChange: (val: string) => void;
  setRole: (role: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setIsIndefinite: (val: boolean) => void;
  setNoticePeriod: (val: string) => void;
  setSowUrl: (url: string) => void;
  setNotes: (notes: string) => void;
  handleSubmit: () => Promise<void>;
  handleClose: () => void;
};

type WizardMeta = {
  accounts: ConsultantAccount[];
  roles: { value: string; label: string }[];
  preselectedAccountId?: string;
  preselectedBenchConsultantId?: string;
  selectedAccount: ConsultantAccount | undefined;
  selectedBench: BenchConsultant | undefined;
  filteredAccounts: ConsultantAccount[];
  filteredBench: BenchConsultant[];
  werkdagen: number;
  estimatedRevenue: number;
  accountTypes: string[];
};

type WizardContextValue = {
  state: WizardState;
  actions: WizardActions;
  meta: WizardMeta;
};

const WizardContext = createContext<WizardContextValue | null>(null);

function useWizard() {
  const ctx = use(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}

/* ─── Provider ────────────────────────────────────────────────────────── */

function WizardProvider({
  open,
  onClose,
  accounts,
  roles,
  preselectedAccountId,
  preselectedBenchConsultantId,
  children,
}: Props & { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Client-side fetch is intentional: bench consultants change frequently (consultants
  // get linked/unlinked between page loads) and are only needed when the wizard opens.
  // The parent list page doesn't have this data, and pre-fetching would be wasteful.
  const [benchConsultants, setBenchConsultants] = useState<BenchConsultant[]>([]);
  const [benchLoading, setBenchLoading] = useState(false);

  // Set loading when open changes to true (render-phase setState to avoid lint error)
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setBenchLoading(true);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    supabase
      .from('consultants')
      .select(
        'id, first_name, last_name, city, priority, roles, technologies, min_hourly_rate, max_hourly_rate, available_date, languages:consultant_languages(id, language, level)',
      )
      .eq('status', 'bench')
      .eq('is_archived', false)
      .order('available_date', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setBenchConsultants((data as unknown as BenchConsultant[]) ?? []);
        setBenchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Determine initial step based on preselections
  const initialStep =
    preselectedAccountId && preselectedBenchConsultantId ? 3 : preselectedAccountId ? 2 : 1;

  type WizardFormState = {
    step: number;
    accountId: string;
    accountSearch: string;
    accountTypeFilter: string;
    benchId: string;
    benchSearch: string;
    role: string;
    startDate: string;
    endDate: string;
    isIndefinite: boolean;
    hourlyRate: string;
    dailyRate: string;
    noticePeriod: string;
    sowUrl: string;
    notes: string;
  };

  const initialFormState = useMemo<WizardFormState>(
    () => ({
      step: initialStep,
      accountId: preselectedAccountId ?? '',
      accountSearch: '',
      accountTypeFilter: '',
      benchId: preselectedBenchConsultantId ?? '',
      benchSearch: '',
      role: '',
      startDate: '',
      endDate: '',
      isIndefinite: false,
      hourlyRate: '',
      dailyRate: '',
      noticePeriod: '30',
      sowUrl: '',
      notes: '',
    }),
    [initialStep, preselectedAccountId, preselectedBenchConsultantId],
  );

  const [form, updateForm] = useReducer(
    (prev: WizardFormState, updates: Partial<WizardFormState>) => ({
      ...prev,
      ...updates,
    }),
    initialFormState,
  );

  // Derived
  const selectedAccount = accounts.find((a) => a.id === form.accountId);
  const selectedBench = benchConsultants.find((c) => c.id === form.benchId);

  const accountTypes = useMemo(() => {
    const types = new Set(accounts.map((a) => a.type).filter(Boolean));
    return Array.from(types) as string[];
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    let result = accounts;
    if (form.accountTypeFilter) {
      result = result.filter((a) => a.type === form.accountTypeFilter);
    }
    if (form.accountSearch) {
      const q = form.accountSearch.toLowerCase();
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || (a.domain?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [accounts, form.accountSearch, form.accountTypeFilter]);

  const filteredBench = useMemo(() => {
    if (!form.benchSearch) return benchConsultants;
    const q = form.benchSearch.toLowerCase();
    return benchConsultants.filter(
      (c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (c.roles?.some((r) => r.toLowerCase().includes(q)) ?? false) ||
        (c.technologies?.some((t) => t.toLowerCase().includes(q)) ?? false),
    );
  }, [benchConsultants, form.benchSearch]);

  // Auto-sync hourly <-> daily rate
  const onHourlyChange = useCallback((val: string) => {
    updateForm({
      hourlyRate: val,
      ...(val ? { dailyRate: String(Math.round(Number(val) * 8)) } : {}),
    });
  }, []);

  const onDailyChange = useCallback((val: string) => {
    updateForm({
      dailyRate: val,
      ...(val ? { hourlyRate: String(Math.round(Number(val) / 8)) } : {}),
    });
  }, []);

  // Revenue preview
  const werkdagen =
    form.startDate && form.endDate && !form.isIndefinite
      ? calcWorkdays(form.startDate, form.endDate)
      : 0;
  const estimatedRevenue = form.hourlyRate ? Number(form.hourlyRate) * 8 * (werkdagen || 21) : 0;

  // Pre-fill role from bench consultant when moving to step 3
  const goToStep3 = useCallback(
    (bench: BenchConsultant) => {
      const updates: Partial<WizardFormState> = { step: 3 };
      if (bench && !form.role) {
        updates.role = bench.roles?.[0] ?? '';
      }
      if (bench?.min_hourly_rate && !form.hourlyRate) {
        updates.hourlyRate = String(bench.min_hourly_rate);
        updates.dailyRate = String(Math.round(bench.min_hourly_rate * 8));
      }
      updateForm(updates);
    },
    [form.role, form.hourlyRate],
  );

  // Reset all state when modal closes
  const resetState = useCallback(() => {
    updateForm(initialFormState);
  }, [initialFormState]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    const result = await linkConsultantToAccount({
      consultant_id: form.benchId,
      account_id: form.accountId,
      role: form.role || undefined,
      start_date: form.startDate,
      end_date: form.isIndefinite ? null : form.endDate || null,
      is_indefinite: form.isIndefinite,
      hourly_rate: Number(form.hourlyRate),
      notice_period_days: Number(form.noticePeriod) || undefined,
      sow_url: form.sowUrl || undefined,
      notes: form.notes || undefined,
    });
    setLoading(false);

    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success(
      `${selectedBench?.first_name} ${selectedBench?.last_name} gekoppeld aan ${selectedAccount?.name}`,
    );
    handleClose();
    router.refresh();
  }, [form, selectedBench, selectedAccount, handleClose, router]);

  const state: WizardState = {
    ...form,
    benchConsultants,
    benchLoading,
    loading,
  };

  const actions: WizardActions = {
    setStep: (step) => updateForm({ step }),
    setAccountId: (accountId) => updateForm({ accountId }),
    setAccountSearch: (accountSearch) => updateForm({ accountSearch }),
    setAccountTypeFilter: (accountTypeFilter) => updateForm({ accountTypeFilter }),
    setBenchId: (benchId) => updateForm({ benchId }),
    setBenchSearch: (benchSearch) => updateForm({ benchSearch }),
    goToStep3,
    onHourlyChange,
    onDailyChange,
    setRole: (role) => updateForm({ role }),
    setStartDate: (startDate) => updateForm({ startDate }),
    setEndDate: (endDate) => updateForm({ endDate }),
    setIsIndefinite: (isIndefinite) => updateForm({ isIndefinite }),
    setNoticePeriod: (noticePeriod) => updateForm({ noticePeriod }),
    setSowUrl: (sowUrl) => updateForm({ sowUrl }),
    setNotes: (notes) => updateForm({ notes }),
    handleSubmit,
    handleClose,
  };

  const meta: WizardMeta = {
    accounts,
    roles,
    preselectedAccountId,
    preselectedBenchConsultantId,
    selectedAccount,
    selectedBench,
    filteredAccounts,
    filteredBench,
    werkdagen,
    estimatedRevenue,
    accountTypes,
  };

  return <WizardContext value={{ state, actions, meta }}>{children}</WizardContext>;
}

/* ─── Progress Bar ────────────────────────────────────────────────────── */

const stepTitles = ['Account kiezen', 'Consultant kiezen', 'Opdracht details'];

function WizardProgressBar() {
  const { state } = useWizard();

  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s < state.step
                ? 'bg-primary text-primary-foreground'
                : s === state.step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {s < state.step ? <Check className="h-4 w-4" /> : s}
          </div>
          <span className={`text-sm ${s === state.step ? 'font-medium' : 'text-muted-foreground'}`}>
            {stepTitles[s - 1]}
          </span>
          {s < 3 && <div className="w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

/* ─── Step 1: Account Selection ───────────────────────────────────────── */

function WizardStep1() {
  const { state, actions, meta } = useWizard();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek account..."
            value={state.accountSearch}
            onChange={(e) => actions.setAccountSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="flex gap-1">
          {meta.accountTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => actions.setAccountTypeFilter(state.accountTypeFilter === t ? '' : t)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                state.accountTypeFilter === t
                  ? (ACCOUNT_TYPE_STYLES[t] ?? 'bg-gray-200 text-gray-800')
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y">
        {meta.filteredAccounts.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
              state.accountId === a.id ? 'bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => {
              actions.setAccountId(a.id);
              if (meta.preselectedBenchConsultantId) {
                // Bench consultant already selected — skip step 2, go to details
                const bench = state.benchConsultants.find(
                  (c) => c.id === meta.preselectedBenchConsultantId,
                );
                if (bench) {
                  actions.goToStep3(bench);
                  return;
                }
              }
              actions.setStep(2);
            }}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{a.name}</div>
              {a.domain && <div className="truncate text-xs text-muted-foreground">{a.domain}</div>}
            </div>
            {a.type && (
              <Badge
                className={`ml-2 shrink-0 ${ACCOUNT_TYPE_STYLES[a.type] ?? 'bg-gray-100 text-gray-700'}`}
              >
                {a.type}
              </Badge>
            )}
          </button>
        ))}
        {meta.filteredAccounts.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Geen accounts gevonden</p>
        )}
      </div>
    </div>
  );
}

/* ─── Step 2: Bench Consultant Selection ──────────────────────────────── */

function WizardStep2() {
  const { state, actions, meta } = useWizard();

  return (
    <div className="space-y-4">
      {/* Selected account summary */}
      {meta.selectedAccount && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <div>
            <span className="text-xs text-muted-foreground">Account:</span>{' '}
            <span className="text-sm font-medium">{meta.selectedAccount.name}</span>
          </div>
          {!meta.preselectedAccountId && (
            <Button variant="ghost" size="sm" onClick={() => actions.setStep(1)}>
              Wijzigen
            </Button>
          )}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek op naam, rol of technologie..."
          value={state.benchSearch}
          onChange={(e) => actions.setBenchSearch(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>
      <div className="max-h-72 overflow-y-auto divide-y">
        {state.benchLoading ? (
          <p className="text-center text-muted-foreground py-4">Laden...</p>
        ) : (
          <>
            {meta.filteredBench.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                  state.benchId === c.id ? 'bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  actions.setBenchId(c.id);
                  actions.goToStep3(c);
                }}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                  {c.first_name[0]}
                  {c.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {c.first_name} {c.last_name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {c.city && <span>{c.city}</span>}
                    {c.roles && c.roles.length > 0 && <span>{c.roles.slice(0, 2).join(', ')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.min_hourly_rate && c.max_hourly_rate && (
                    <span className="text-xs text-muted-foreground">
                      €{c.min_hourly_rate}–€{c.max_hourly_rate}/u
                    </span>
                  )}
                  <Badge className={`text-[10px] ${CONSULTANT_PRIORITY_STYLES[c.priority] ?? ''}`}>
                    {c.priority}
                  </Badge>
                </div>
              </button>
            ))}
            {meta.filteredBench.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Geen bench consultants gevonden
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Step 3: Assignment Details ──────────────────────────────────────── */

function WizardStep3() {
  const { state, actions, meta } = useWizard();

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {meta.selectedAccount && (
          <div className="bg-muted/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Account</span>
            <div className="text-sm font-medium">{meta.selectedAccount.name}</div>
            {!meta.preselectedAccountId && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 text-xs px-2"
                onClick={() => actions.setStep(1)}
              >
                Wijzigen
              </Button>
            )}
          </div>
        )}
        {meta.selectedBench && (
          <div className="bg-muted/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Consultant</span>
            <div className="text-sm font-medium">
              {meta.selectedBench.first_name} {meta.selectedBench.last_name}
            </div>
            {!meta.preselectedBenchConsultantId && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-6 text-xs px-2"
                onClick={() => actions.setStep(2)}
              >
                Wijzigen
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rol</Label>
          <Select value={state.role} onValueChange={(v) => actions.setRole(v ?? '')}>
            <SelectTrigger>
              {meta.roles.find((r) => r.value === state.role)?.label ?? 'Selecteer...'}
            </SelectTrigger>
            <SelectContent>
              {meta.roles.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Opzegtermijn (dagen)</Label>
          <Input
            type="number"
            min={0}
            value={state.noticePeriod}
            onChange={(e) => actions.setNoticePeriod(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Startdatum *</Label>
          <DatePicker value={state.startDate} onChange={actions.setStartDate} required />
        </div>
        <div className="space-y-2">
          <Label>Einddatum</Label>
          <DatePicker
            value={state.endDate}
            onChange={actions.setEndDate}
            disabled={state.isIndefinite}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="wizard_indefinite"
          type="checkbox"
          checked={state.isIndefinite}
          onChange={(e) => actions.setIsIndefinite(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="wizard_indefinite" className="font-normal">
          Onbepaalde duur
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Uurtarief €/u *</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={state.hourlyRate}
            onChange={(e) => actions.onHourlyChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Dagtarief €/dag</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={state.dailyRate}
            onChange={(e) => actions.onDailyChange(e.target.value)}
          />
        </div>
      </div>

      {/* Revenue preview */}
      {state.hourlyRate && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="text-muted-foreground">Geschatte omzet</div>
          <div className="text-lg font-bold">{formatEUR(meta.estimatedRevenue)}</div>
          <div className="text-xs text-muted-foreground">
            {formatEUR(Number(state.hourlyRate))}/u × 8u × {meta.werkdagen || 21} werkdagen
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>SoW URL</Label>
        <Input
          value={state.sowUrl}
          onChange={(e) => actions.setSowUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label>Notities</Label>
        <Textarea value={state.notes} onChange={(e) => actions.setNotes(e.target.value)} rows={3} />
      </div>
    </div>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────── */

function WizardFooter() {
  const { state, actions, meta } = useWizard();

  const showBack =
    state.step > 1 &&
    !(state.step === 2 && meta.preselectedAccountId) &&
    !(state.step === 3 && meta.preselectedAccountId && meta.preselectedBenchConsultantId);

  return (
    <ModalFooter className="justify-between">
      <div>
        {showBack && (
          <Button variant="outline" onClick={() => actions.setStep(state.step - 1)}>
            <ArrowLeft />
            Vorige
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={actions.handleClose}>
          Annuleren
        </Button>
        {state.step === 3 && (
          <Button
            onClick={actions.handleSubmit}
            disabled={
              state.loading ||
              !state.accountId ||
              !state.benchId ||
              !state.startDate ||
              !state.hourlyRate ||
              Number(state.hourlyRate) <= 0
            }
          >
            <Save />
            {state.loading ? 'Verwerken...' : 'Koppelen'}
          </Button>
        )}
      </div>
    </ModalFooter>
  );
}

/* ─── Content (assembles steps) ───────────────────────────────────────── */

function WizardContent() {
  const { state, actions } = useWizard();
  const currentTitle = `Opdracht koppelen — ${stepTitles[state.step - 1]}`;

  return (
    <Modal open title={currentTitle} onClose={actions.handleClose} size="extra-wide">
      <WizardProgressBar />
      {state.step === 1 && <WizardStep1 />}
      {state.step === 2 && <WizardStep2 />}
      {state.step === 3 && <WizardStep3 />}
      <WizardFooter />
    </Modal>
  );
}

/* ─── Export ──────────────────────────────────────────────────────────── */

export function LinkConsultantWizard(props: Props) {
  if (!props.open) return null;

  return (
    <WizardProvider {...props}>
      <WizardContent />
    </WizardProvider>
  );
}
