# Link Consultant Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat "Consultant koppelen" form with a 3-step wizard that selects from bench consultants, matching the demo_crm's `KoppelOpdachtModal`. Enable bidirectional linking: from account → consultant, and from bench/consultants page → account.

**Architecture:** New `LinkConsultantWizard` component with 3 steps: select account, select bench consultant, fill assignment details. New `linkBenchToAccount` server action that creates the active consultant AND archives the bench consultant atomically. The wizard is triggered from 3 entry points, each pre-selecting different data. The existing `AddConsultantModal` (manual entry) stays as a "Manueel toevoegen" fallback within the wizard's step 2.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase, Zod, shadcn/ui, Lucide icons

---

## File Inventory

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/features/consultants/components/link-consultant-wizard.tsx` | 3-step wizard modal |
| Create | `src/features/consultants/actions/link-bench-to-account.ts` | Server action: create active consultant + archive bench consultant |
| Modify | `src/features/consultants/components/account-consultants-tab.tsx` | Replace `AddConsultantModal` with wizard (preselect account) |
| Modify | `src/features/consultants/components/consultant-list.tsx` | Add "Opdracht koppelen" button → wizard (no preselection) |
| Modify | `src/app/admin/consultants/page.tsx` | Fetch accounts + bench consultants for wizard |
| Modify | `src/features/bench/components/bench-grid.tsx` | Add "Koppel" button per card → wizard (preselect bench consultant) |
| Modify | `src/features/bench/components/bench-detail-modal.tsx` | Add "Koppel" button → wizard (preselect bench consultant) |
| Modify | `src/app/admin/bench/page.tsx` | Fetch accounts for wizard |
| Modify | `src/app/admin/accounts/[id]/page.tsx` | Fetch bench consultants for wizard |

---

### Task 1: Server Action — `linkBenchToAccount`

**Files:**
- Create: `src/features/consultants/actions/link-bench-to-account.ts`

- [ ] **Step 1: Create the Zod schema and action**

```ts
// src/features/consultants/actions/link-bench-to-account.ts
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { ok, err, type ActionResult } from '@/lib/action-result';

const linkSchema = z.object({
  bench_consultant_id: z.string().min(1, 'Bench consultant is verplicht'),
  account_id: z.string().min(1, 'Account is verplicht'),
  role: z.string().optional(),
  start_date: z.string().min(1, 'Startdatum is verplicht'),
  end_date: z.string().optional().nullable(),
  is_indefinite: z.boolean().optional(),
  hourly_rate: z.coerce.number().min(0, 'Uurtarief is verplicht'),
  notice_period_days: z.coerce.number().optional(),
  sow_url: z.string().optional(),
  notes: z.string().optional(),
});

export type LinkBenchToAccountValues = z.infer<typeof linkSchema>;

export async function linkBenchToAccount(
  values: LinkBenchToAccountValues,
): Promise<ActionResult<{ id: string }>> {
  await requirePermission('consultants.write');

  const parsed = linkSchema.safeParse(values);
  if (!parsed.success) return err(parsed.error.flatten().fieldErrors);

  const supabase = await createServerClient();

  // 1. Fetch bench consultant data
  const { data: bench, error: benchErr } = await supabase
    .from('bench_consultants')
    .select('*')
    .eq('id', parsed.data.bench_consultant_id)
    .single();

  if (benchErr || !bench) return err('Bench consultant niet gevonden');

  // 2. Fetch account for denormalized fields
  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .select('name, city')
    .eq('id', parsed.data.account_id)
    .single();

  if (accErr || !account) return err('Account niet gevonden');

  // 3. Create active consultant
  const { data: consultant, error: insertErr } = await supabase
    .from('active_consultants')
    .insert({
      account_id: parsed.data.account_id,
      first_name: bench.first_name,
      last_name: bench.last_name,
      role: parsed.data.role ?? bench.roles?.[0] ?? null,
      city: bench.city,
      cv_pdf_url: bench.cv_pdf_url,
      client_name: account.name,
      client_city: account.city,
      start_date: parsed.data.start_date,
      end_date: parsed.data.is_indefinite ? null : parsed.data.end_date,
      is_indefinite: parsed.data.is_indefinite ?? false,
      hourly_rate: parsed.data.hourly_rate,
      sow_url: parsed.data.sow_url ?? null,
      notice_period_days: parsed.data.notice_period_days ?? 30,
      notes: parsed.data.notes ?? null,
      is_active: true,
      is_stopped: false,
    })
    .select('id')
    .single();

  if (insertErr || !consultant) return err(insertErr?.message ?? 'Fout bij aanmaken');

  // 4. Create initial rate history entry
  const { error: rateErr } = await supabase.from('consultant_rate_history').insert({
    active_consultant_id: consultant.id,
    date: parsed.data.start_date,
    rate: parsed.data.hourly_rate,
    reason: 'Initieel tarief',
  });
  if (rateErr) return err(rateErr.message);

  // 5. Archive the bench consultant
  const { error: archiveErr } = await supabase
    .from('bench_consultants')
    .update({ is_archived: true })
    .eq('id', parsed.data.bench_consultant_id);
  if (archiveErr) return err(archiveErr.message);

  await logAction({
    action: 'active_consultant.linked_from_bench',
    entityType: 'active_consultant',
    entityId: consultant.id,
    metadata: {
      name: `${bench.first_name} ${bench.last_name}`,
      bench_consultant_id: parsed.data.bench_consultant_id,
      account_id: parsed.data.account_id,
    },
  });

  revalidatePath('/admin/consultants');
  revalidatePath(`/admin/accounts/${parsed.data.account_id}`);
  revalidatePath('/admin/bench');

  return ok({ id: consultant.id });
}
```

- [ ] **Step 2: Commit**

```
feat: add linkBenchToAccount server action
```

---

### Task 2: Link Consultant Wizard Component

**Files:**
- Create: `src/features/consultants/components/link-consultant-wizard.tsx`

This is the core component. A 3-step wizard inside a Modal:
- **Step 1** (Account): Search + select account from list. Skipped if `preselectedAccountId` is provided.
- **Step 2** (Consultant): Search + select bench consultant. Skipped if `preselectedBenchConsultant` is provided. Has a "Manueel toevoegen" link to open the old `AddConsultantModal` as fallback.
- **Step 3** (Details): Assignment form (role, dates, rate with auto dagtarief, SoW, notes, revenue preview).

- [ ] **Step 1: Create the wizard component**

```tsx
// src/features/consultants/components/link-consultant-wizard.tsx
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
import { ArrowLeft, ArrowRight, Check, Save, Search } from 'lucide-react';
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

  // Auto-sync hourly ↔ daily rate
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
                    <div className="text-xs text-muted-foreground">{a.domain ?? a.city ?? ''}</div>
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
              <Select value={role} onValueChange={setRole}>
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
              disabled={loading || !accountId || !benchId || !startDate || !hourlyRate}
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
```

- [ ] **Step 2: Commit**

```
feat: add LinkConsultantWizard 3-step modal component
```

---

### Task 3: Wire Wizard into Account Consultants Tab

**Files:**
- Modify: `src/features/consultants/components/account-consultants-tab.tsx`
- Modify: `src/app/admin/accounts/[id]/page.tsx`

- [ ] **Step 1: Update `AccountConsultantsTab` props and rendering**

Replace `AddConsultantModal` with `LinkConsultantWizard`. Add `benchConsultants` and `accounts` to props. The "Consultant koppelen" button opens the wizard with `preselectedAccountId`.

Keep `AddConsultantModal` as a secondary option: add a "Manueel toevoegen" text button that opens the old form for consultants not on the bench.

Changes to `account-consultants-tab.tsx`:
- Add `benchConsultants: BenchConsultantWithLanguages[]` to Props
- Replace `addModalOpen` state → `wizardOpen` and `manualOpen` states
- Primary button: "Consultant koppelen" → opens wizard
- Secondary text link: "of manueel toevoegen" → opens AddConsultantModal
- Pass `preselectedAccountId={accountId}` to wizard
- Pass `accounts={[]}` — step 1 is skipped since account is pre-selected, and the "Wijzigen" button is hidden when `preselectedAccountId` is set. Empty array is intentional and safe here.

- [ ] **Step 2: Update `src/app/admin/accounts/[id]/page.tsx`**

Add `getBenchConsultants()` to the `Promise.all` fetch. Pass `benchConsultants` to `AccountDetail`, which passes it down to `AccountConsultantsTab`.

- [ ] **Step 3: Update `AccountDetail` props to thread `benchConsultants`**

Add `benchConsultants: BenchConsultantWithLanguages[]` to `AccountDetail` Props. Pass through to `<AccountConsultantsTab>`.

- [ ] **Step 4: Verify in browser**

Navigate to account detail → Consultants tab → click "Consultant koppelen" → wizard starts at step 2 (account pre-selected) → select bench consultant → fill details → submit → consultant appears in list, bench consultant is archived.

- [ ] **Step 5: Commit**

```
feat: wire link-consultant wizard into account consultants tab
```

---

### Task 4: Wire Wizard into Consultants Page

**Files:**
- Modify: `src/features/consultants/components/consultant-list.tsx`
- Modify: `src/app/admin/consultants/page.tsx`

- [ ] **Step 1: Update `ConsultantListView`**

Add props: `accounts: Account[]`, `benchConsultants: BenchConsultantWithLanguages[]`, `roles: { value: string; label: string }[]`.
Add "Opdracht koppelen" button in the header area (next to filter bar or as a page action).
Add `LinkConsultantWizard` with no preselection (full 3-step flow).

- [ ] **Step 2: Update `src/app/admin/consultants/page.tsx`**

Add `getAccounts({ pageSize: 9999 })`, `getBenchConsultants`, and `getReferenceOptions('ref_consultant_roles')` to Promise.all. Pass to `ConsultantListView`.

**IMPORTANT:** `getAccounts()` defaults to `pageSize: 25` — the wizard needs ALL accounts for the search list. Pass `{ pageSize: 9999 }` or create a lightweight `getAllAccountsForSelect()` query that only fetches `id, name, domain, type, city`. The same applies to Task 3 (accounts page) and Task 5 (bench page).

Update PageHeader with `actions` prop containing the "Opdracht koppelen" button. Or pass it inside ConsultantListView — depends on whether it needs client state. Since it opens a modal, it should be inside ConsultantListView.

- [ ] **Step 3: Verify in browser**

Navigate to /admin/consultants → click "Opdracht koppelen" → full wizard (3 steps) → select account → select bench consultant → fill details → submit.

- [ ] **Step 4: Commit**

```
feat: add opdracht koppelen wizard to consultants page
```

---

### Task 5: Wire Wizard into Bench Page

**Files:**
- Modify: `src/features/bench/components/bench-grid.tsx`
- Modify: `src/features/bench/components/bench-detail-modal.tsx`
- Modify: `src/app/admin/bench/page.tsx`

- [ ] **Step 1: Update `BenchGrid`**

Add props: `accounts: Account[]`, `roles: { value: string; label: string }[]`.
Add a "Koppel" button on each bench card (top-right corner, small outline button).
Clicking "Koppel" opens `LinkConsultantWizard` with `preselectedBenchConsultantId`.
Also pass `benchConsultants={consultants}` (the full list, though only the preselected one matters — the wizard needs the full list for its search).

- [ ] **Step 2: Update `BenchDetailModal`**

Add props: `accounts: Account[]`, `roles: { value: string; label: string }[]`, `benchConsultants: BenchConsultantWithLanguages[]`.
`BenchGrid` must thread the full `benchConsultants` array down: `<BenchDetailModal ... accounts={accounts} roles={roles} benchConsultants={consultants} />`.
Add "Koppel" button next to existing "Bewerken" and "Maak deal aan" buttons.
Opens wizard with `preselectedBenchConsultantId={consultant.id}` and `benchConsultants={benchConsultants}` (wizard needs the list for step 2, even though it's pre-selected).

- [ ] **Step 3: Update `src/app/admin/bench/page.tsx`**

Add `getAccounts()` and `getReferenceOptions('ref_consultant_roles')` to the Promise.all fetch. Pass `accounts` and `roles` to `BenchGrid`.

- [ ] **Step 4: Verify in browser**

1. Bench page → "Koppel" on card → wizard starts at step 1 (select account) → select → step 3 (consultant pre-selected) → fill details → submit.
2. Bench detail modal → "Koppel" → same flow.

- [ ] **Step 5: Commit**

```
feat: add koppel wizard buttons to bench grid and detail modal
```

---

### Task 6: Final Polish

- [ ] **Step 1: Ensure bench consultant is filtered out after linking**

After the wizard submits and `router.refresh()` fires, the archived bench consultant should no longer appear in the bench grid (because `getBenchConsultants(false)` filters `is_archived`). Verify this works.

- [ ] **Step 2: Test empty states**

- Wizard step 2 when bench is empty: show "Geen bench consultants beschikbaar" + hint to add one
- All entry points should be disabled or hidden if both bench is empty (for the wizard — the manual "Manueel toevoegen" still works)

- [ ] **Step 3: Verify revalidation covers all pages**

`linkBenchToAccount` revalidates `/admin/consultants`, `/admin/accounts/[id]`, and `/admin/bench`. Verify all three pages update after a link action.

- [ ] **Step 4: End-to-end test all 3 entry points**

1. Account → Consultants tab → "Consultant koppelen" → wizard (account pre-selected)
2. /admin/consultants → "Opdracht koppelen" → wizard (full flow)
3. /admin/bench → "Koppel" button → wizard (bench consultant pre-selected)

- [ ] **Step 5: Commit**

```
chore: link-consultant wizard polish and validation
```
