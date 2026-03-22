'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { ArrowLeft, Check, Save, Search } from 'lucide-react';
import { linkConsultantToAccount } from '../actions/link-consultant-to-account';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ConsultantWithDetails } from '../types';
import { formatEUR } from '@/lib/format';

type Account = { id: string; name: string; domain: string | null; type: string | null; city: string | null };

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
  accounts: Account[];
  roles: { value: string; label: string }[];
  /** Pre-select account (from account page) — skips step 1 */
  preselectedAccountId?: string;
  /** Pre-select bench consultant (from bench page) — skips step 2 */
  preselectedBenchConsultantId?: string;
};

const typeColors: Record<string, string> = {
  Klant: 'bg-green-100 text-green-700',
  Prospect: 'bg-blue-100 text-blue-700',
  Partner: 'bg-orange-100 text-orange-700',
};

const priorityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-100 text-gray-800',
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

export function LinkConsultantWizard({
  open,
  onClose,
  accounts,
  roles,
  preselectedAccountId,
  preselectedBenchConsultantId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Fetch bench consultants internally
  const [benchConsultants, setBenchConsultants] = useState<BenchConsultant[]>([]);
  const [benchLoading, setBenchLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBenchLoading(true);
    const supabase = createBrowserClient();
    supabase
      .from('consultants')
      .select('id, first_name, last_name, city, priority, roles, technologies, min_hourly_rate, max_hourly_rate, available_date, languages:consultant_languages(id, language, level)')
      .eq('status', 'bench')
      .eq('is_archived', false)
      .order('available_date', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setBenchConsultants((data as unknown as BenchConsultant[]) ?? []);
        setBenchLoading(false);
      });
    return () => { cancelled = true; };
  }, [open]);

  // Determine initial step based on preselections
  const initialStep = preselectedAccountId && preselectedBenchConsultantId ? 3
    : preselectedAccountId ? 2
    : 1;
  const [step, setStep] = useState(initialStep);

  // Reset all state when modal opens/closes
  function resetState() {
    setStep(initialStep);
    setAccountId(preselectedAccountId ?? '');
    setBenchId(preselectedBenchConsultantId ?? '');
    setAccountSearch('');
    setBenchSearch('');
    setRole('');
    setStartDate('');
    setEndDate('');
    setIsIndefinite(false);
    setHourlyRate('');
    setDailyRate('');
    setNoticePeriod('30');
    setSowUrl('');
    setNotes('');
  }

  function handleClose() {
    resetState();
    onClose();
  }

  // Step 1: account selection
  const [accountId, setAccountId] = useState(preselectedAccountId ?? '');
  const [accountSearch, setAccountSearch] = useState('');

  // Step 2: bench consultant selection
  const [benchId, setBenchId] = useState(preselectedBenchConsultantId ?? '');
  const [benchSearch, setBenchSearch] = useState('');

  // Step 3: assignment details
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [hourlyRate, setHourlyRate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('30');
  const [sowUrl, setSowUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Derived
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedBench = benchConsultants.find((c) => c.id === benchId);

  // Step 1 filters
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const accountTypes = useMemo(() => {
    const types = new Set(accounts.map((a) => a.type).filter(Boolean));
    return Array.from(types) as string[];
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    let result = accounts;
    if (accountTypeFilter) {
      result = result.filter((a) => a.type === accountTypeFilter);
    }
    if (accountSearch) {
      const q = accountSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.domain?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [accounts, accountSearch, accountTypeFilter]);

  const filteredBench = useMemo(() => {
    if (!benchSearch) return benchConsultants;
    const q = benchSearch.toLowerCase();
    return benchConsultants.filter(
      (c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (c.roles?.some((r) => r.toLowerCase().includes(q)) ?? false) ||
        (c.technologies?.some((t) => t.toLowerCase().includes(q)) ?? false),
    );
  }, [benchConsultants, benchSearch]);

  // Auto-sync hourly <-> daily rate
  function onHourlyChange(val: string) {
    setHourlyRate(val);
    if (val) setDailyRate(String(Math.round(Number(val) * 8)));
  }
  function onDailyChange(val: string) {
    setDailyRate(val);
    if (val) setHourlyRate(String(Math.round(Number(val) / 8)));
  }

  // Revenue preview
  const werkdagen = startDate && endDate && !isIndefinite
    ? calcWorkdays(startDate, endDate)
    : 0;
  const estimatedRevenue = hourlyRate
    ? Number(hourlyRate) * 8 * (werkdagen || 21)
    : 0;

  // Pre-fill role from bench consultant when moving to step 3
  function goToStep3(bench: BenchConsultant) {
    if (bench && !role) {
      setRole(bench.roles?.[0] ?? '');
    }
    if (bench?.min_hourly_rate && !hourlyRate) {
      onHourlyChange(String(bench.min_hourly_rate));
    }
    setStep(3);
  }

  async function handleSubmit() {
    setLoading(true);
    const result = await linkConsultantToAccount({
      consultant_id: benchId,
      account_id: accountId,
      role: role || undefined,
      start_date: startDate,
      end_date: isIndefinite ? null : endDate || null,
      is_indefinite: isIndefinite,
      hourly_rate: Number(hourlyRate),
      notice_period_days: Number(noticePeriod) || undefined,
      sow_url: sowUrl || undefined,
      notes: notes || undefined,
    });
    setLoading(false);

    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success(`${selectedBench?.first_name} ${selectedBench?.last_name} gekoppeld aan ${selectedAccount?.name}`);
    handleClose();
    router.refresh();
  }

  // Step titles
  const stepTitles = ['Account kiezen', 'Consultant kiezen', 'Opdracht details'];
  const currentTitle = `Opdracht koppelen — ${stepTitles[step - 1]}`;

  return (
    <Modal open={open} onClose={handleClose} title={currentTitle} size="extra-wide">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s < step
                  ? 'bg-primary text-primary-foreground'
                  : s === step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm ${s === step ? 'font-medium' : 'text-muted-foreground'}`}>
              {stepTitles[s - 1]}
            </span>
            {s < 3 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Account selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek account..."
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="flex gap-1">
              {accountTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAccountTypeFilter(accountTypeFilter === t ? '' : t)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    accountTypeFilter === t
                      ? typeColors[t] ?? 'bg-gray-200 text-gray-800'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y">
            {filteredAccounts.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
                  accountId === a.id ? 'bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setAccountId(a.id);
                  if (preselectedBenchConsultantId) {
                    // Bench consultant already selected — skip step 2, go to details
                    const bench = benchConsultants.find((c) => c.id === preselectedBenchConsultantId);
                    if (bench) { goToStep3(bench); return; }
                  }
                  setStep(2);
                }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  {a.domain && <div className="truncate text-xs text-muted-foreground">{a.domain}</div>}
                </div>
                {a.type && (
                  <Badge className={`ml-2 shrink-0 ${typeColors[a.type] ?? 'bg-gray-100 text-gray-700'}`}>
                    {a.type}
                  </Badge>
                )}
              </button>
            ))}
            {filteredAccounts.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Geen accounts gevonden</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Bench consultant selection */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Selected account summary */}
          {selectedAccount && (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div>
                <span className="text-xs text-muted-foreground">Account:</span>{' '}
                <span className="text-sm font-medium">{selectedAccount.name}</span>
              </div>
              {!preselectedAccountId && (
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Wijzigen
                </Button>
              )}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam, rol of technologie..."
              value={benchSearch}
              onChange={(e) => setBenchSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y">
            {benchLoading ? (
              <p className="text-center text-muted-foreground py-4">Laden...</p>
            ) : (
              <>
                {filteredBench.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                      benchId === c.id ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      setBenchId(c.id);
                      goToStep3(c);
                    }}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.first_name} {c.last_name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {c.city && <span>{c.city}</span>}
                        {c.roles && c.roles.length > 0 && (
                          <span>{c.roles.slice(0, 2).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.min_hourly_rate && c.max_hourly_rate && (
                        <span className="text-xs text-muted-foreground">
                          €{c.min_hourly_rate}–€{c.max_hourly_rate}/u
                        </span>
                      )}
                      <Badge className={`text-[10px] ${priorityColors[c.priority] ?? ''}`}>{c.priority}</Badge>
                    </div>
                  </button>
                ))}
                {filteredBench.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Geen bench consultants gevonden</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Assignment details */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {selectedAccount && (
              <div className="bg-muted/50 rounded-lg p-3">
                <span className="text-xs text-muted-foreground">Account</span>
                <div className="text-sm font-medium">{selectedAccount.name}</div>
                {!preselectedAccountId && (
                  <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs px-2" onClick={() => setStep(1)}>
                    Wijzigen
                  </Button>
                )}
              </div>
            )}
            {selectedBench && (
              <div className="bg-muted/50 rounded-lg p-3">
                <span className="text-xs text-muted-foreground">Consultant</span>
                <div className="text-sm font-medium">{selectedBench.first_name} {selectedBench.last_name}</div>
                {!preselectedBenchConsultantId && (
                  <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs px-2" onClick={() => setStep(2)}>
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
              <Select value={role} onValueChange={(v) => setRole(v ?? '')}>
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
              <Label>Opzegtermijn (dagen)</Label>
              <Input
                type="number"
                min={0}
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Startdatum *</Label>
              <DatePicker value={startDate} onChange={setStartDate} required />
            </div>
            <div className="space-y-2">
              <Label>Einddatum</Label>
              <DatePicker value={endDate} onChange={setEndDate} disabled={isIndefinite} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="wizard_indefinite"
              type="checkbox"
              checked={isIndefinite}
              onChange={(e) => setIsIndefinite(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="wizard_indefinite" className="font-normal">Onbepaalde duur</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Uurtarief €/u *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={hourlyRate}
                onChange={(e) => onHourlyChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Dagtarief €/dag</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={dailyRate}
                onChange={(e) => onDailyChange(e.target.value)}
              />
            </div>
          </div>

          {/* Revenue preview */}
          {hourlyRate && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="text-muted-foreground">Geschatte omzet</div>
              <div className="text-lg font-bold">
                {formatEUR(estimatedRevenue)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatEUR(Number(hourlyRate))}/u × 8u × {werkdagen || 21} werkdagen
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>SoW URL</Label>
            <Input value={sowUrl} onChange={(e) => setSowUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label>Notities</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
      )}

      {/* Footer navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        <div>
          {step > 1 && !(step === 2 && preselectedAccountId) && !(step === 3 && preselectedAccountId && preselectedBenchConsultantId) && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft />
              Vorige
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>Annuleren</Button>
          {step === 3 && (
            <Button
              onClick={handleSubmit}
              disabled={loading || !accountId || !benchId || !startDate || !hourlyRate || Number(hourlyRate) <= 0}
            >
              <Save />
              {loading ? 'Verwerken...' : 'Koppelen'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
