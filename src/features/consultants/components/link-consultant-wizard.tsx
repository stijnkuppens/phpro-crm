'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { ArrowLeft, Check, Save, Search } from 'lucide-react';
import { linkBenchToAccount } from '../actions/link-bench-to-account';
import type { BenchConsultantWithLanguages } from '@/features/bench/types';

type Account = { id: string; name: string; domain: string | null; type: string | null; city: string | null };

type Props = {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  benchConsultants: BenchConsultantWithLanguages[];
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

const eurFmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

function calcWorkdays(start: string, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  let count = 0;
  const d = new Date(s);
  while (d <= e) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function LinkConsultantWizard({
  open,
  onClose,
  accounts,
  benchConsultants,
  roles,
  preselectedAccountId,
  preselectedBenchConsultantId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Determine initial step based on preselections
  const initialStep = preselectedAccountId ? (preselectedBenchConsultantId ? 3 : 2) : 1;
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

  // Filtered lists
  const filteredAccounts = useMemo(() => {
    if (!accountSearch) return accounts;
    const q = accountSearch.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.domain?.toLowerCase().includes(q) ?? false),
    );
  }, [accounts, accountSearch]);

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
  // NOTE: pass the bench consultant directly — React state is async,
  // so selectedBench would still reference the OLD benchId.
  function goToStep3(bench: BenchConsultantWithLanguages) {
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
    const result = await linkBenchToAccount({
      bench_consultant_id: benchId,
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek account..."
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredAccounts.map((a) => (
              <Card
                key={a.id}
                className={`cursor-pointer transition-colors ${
                  accountId === a.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setAccountId(a.id);
                  setStep(2);
                }}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.domain ?? ''}</div>
                  </div>
                  {a.type && (
                    <Badge className={typeColors[a.type] ?? 'bg-gray-100 text-gray-700'}>
                      {a.type}
                    </Badge>
                  )}
                </CardContent>
              </Card>
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
          <div className="max-h-72 overflow-y-auto space-y-2">
            {filteredBench.map((c) => (
              <Card
                key={c.id}
                className={`cursor-pointer transition-colors ${
                  benchId === c.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setBenchId(c.id);
                  goToStep3(c);
                }}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  {/* Avatar initials */}
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{c.first_name} {c.last_name}</div>
                    <div className="text-xs text-muted-foreground">{c.city}</div>
                    {c.roles && c.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {c.min_hourly_rate && c.max_hourly_rate && (
                      <div className="text-xs text-muted-foreground">
                        €{c.min_hourly_rate} - €{c.max_hourly_rate}/u
                      </div>
                    )}
                    <Badge className={priorityColors[c.priority] ?? ''}>{c.priority}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredBench.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Geen bench consultants gevonden</p>
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
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Einddatum</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isIndefinite}
              />
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
                {eurFmt(estimatedRevenue)}
              </div>
              <div className="text-xs text-muted-foreground">
                {eurFmt(Number(hourlyRate))}/u × 8u × {werkdagen || 21} werkdagen
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
