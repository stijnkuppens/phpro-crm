'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar } from '@/components/admin/avatar';
import { accountFormSchema, type AccountFormValues, type AccountReferenceData, type ReferenceOption } from '../types';
import { createAccount } from '../actions/create-account';
import { updateAccount } from '../actions/update-account';
import {
  syncAccountFKRelation,
  addAccountRelation,
  deleteAccountRelation,
} from '../actions/manage-account-relations';

// ── Constants (not from ref tables) ─────────────────────────────────────────

const COUNTRY_OPTIONS = [
  { value: 'BE', label: 'Belgie' },
  { value: 'NL', label: 'Nederland' },
  { value: 'FR', label: 'Frankrijk' },
  { value: 'DE', label: 'Duitsland' },
];

// ── Types ────────────────────────────────────────────────────────────────────

type CompetenceCenterEntry = {
  id?: string;
  competence_center_id: string;
  competence_center_name: string;
  service_ids: string[];
};

type HostingEntry = {
  id?: string;
  provider_id: string;
  provider_name: string;
  environment_id: string;
  environment_name: string;
  url: string;
  notes: string;
};

type Props = {
  referenceData?: AccountReferenceData;
  defaultValues?: Partial<AccountFormValues> & {
    id?: string;
    techStackIds?: string[];
    samenwerkingsvormIds?: string[];
    manualServices?: string[];
    competenceCenters?: Array<{ id: string; competence_center_id: string; competence_center_name: string; service_ids: string[] }>;
    hosting?: Array<{ id: string; provider_id: string; provider_name: string; environment_id: string; environment_name: string; url: string | null; notes: string | null }>;
  };
  onSuccess?: () => void;
  /** External form ref — when provided, the form doesn't render its own FormActions */
  formRef?: React.RefObject<HTMLFormElement | null>;
  /** Called when loading state changes — used to sync with external FormActions */
  onLoadingChange?: (loading: boolean) => void;
};

// ── ChipInput component (inline) ────────────────────────────────────────────

function RefChipInput({
  selectedIds,
  onChange,
  options,
  placeholder,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  options: ReferenceOption[];
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedNames = selectedIds.map((id) => options.find((o) => o.id === id)?.name ?? id);
  const filtered = options.filter(
    (o) => !selectedIds.includes(o.id) && o.name.toLowerCase().includes(input.toLowerCase()),
  );

  function add(option: ReferenceOption) {
    if (!selectedIds.includes(option.id)) {
      onChange([...selectedIds, option.id]);
    }
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    onChange(selectedIds.filter((v) => v !== id));
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {selectedIds.map((id, i) => (
          <Badge key={id} variant="secondary" className="gap-1 pr-1">
            {selectedNames[i]}
            <button
              type="button"
              onClick={() => remove(id)}
              className="ml-0.5 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        ref={inputRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered.length > 0) {
              add(filtered[0]);
            }
          }
        }}
        placeholder={placeholder}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-accent"
              onMouseDown={(e) => {
                e.preventDefault();
                add(o);
              }}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── StringChipInput (for manual_services which stay text-based) ─────────────

function StringChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function add(value: string) {
    if (!values.includes(value)) {
      onChange([...values, value]);
    }
    setInput('');
    inputRef.current?.focus();
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value));
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1 pr-1">
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="ml-0.5 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim() && !values.includes(input.trim())) {
              add(input.trim());
            }
          }
        }}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────

export function AccountForm({ referenceData, defaultValues, onSuccess, formRef: externalFormRef, onLoadingChange }: Props) {
  const router = useRouter();
  const [loading, setLoadingState] = useState(false);
  const setLoading = (v: boolean) => { setLoadingState(v); onLoadingChange?.(v); };
  const internalFormRef = useRef<HTMLFormElement>(null);
  const formRef = externalFormRef ?? internalFormRef;
  const isEdit = !!defaultValues?.id;

  const ref = referenceData ?? {
    technologies: [],
    collaborationTypes: [],
    hostingProviders: [],
    hostingEnvironments: [],
    competenceCenters: [],
    ccServices: [],
  };

  // Controlled state for relation fields
  const [samenwerkingsvormIds, setSamenwerkingsvormIds] = useState<string[]>(
    defaultValues?.samenwerkingsvormIds ?? [],
  );
  const [techStackIds, setTechStackIds] = useState<string[]>(
    defaultValues?.techStackIds ?? [],
  );
  const [manualServices, setManualServices] = useState<string[]>(
    defaultValues?.manualServices ?? [],
  );
  const [competenceCenters, setCompetenceCenters] = useState<CompetenceCenterEntry[]>(
    defaultValues?.competenceCenters?.map((cc) => ({
      id: cc.id,
      competence_center_id: cc.competence_center_id,
      competence_center_name: cc.competence_center_name,
      service_ids: cc.service_ids,
    })) ?? [],
  );
  const [hosting, setHosting] = useState<HostingEntry[]>(
    defaultValues?.hosting?.map((h) => ({
      id: h.id,
      provider_id: h.provider_id,
      provider_name: h.provider_name,
      environment_id: h.environment_id ?? '',
      environment_name: h.environment_name ?? '',
      url: h.url ?? '',
      notes: h.notes ?? '',
    })) ?? [],
  );

  function toggleSamenwerkingsvorm(id: string) {
    setSamenwerkingsvormIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  function addCompetenceCenter() {
    setCompetenceCenters((prev) => [...prev, { competence_center_id: '', competence_center_name: '', service_ids: [] }]);
  }

  function removeCompetenceCenter(index: number) {
    setCompetenceCenters((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCompetenceCenter(index: number, updates: Partial<CompetenceCenterEntry>) {
    setCompetenceCenters((prev) =>
      prev.map((cc, i) => (i === index ? { ...cc, ...updates } : cc)),
    );
  }

  function toggleCCService(index: number, serviceId: string) {
    setCompetenceCenters((prev) =>
      prev.map((cc, i) => {
        if (i !== index) return cc;
        const service_ids = cc.service_ids.includes(serviceId)
          ? cc.service_ids.filter((s) => s !== serviceId)
          : [...cc.service_ids, serviceId];
        return { ...cc, service_ids };
      }),
    );
  }

  function addHosting() {
    setHosting((prev) => [...prev, { provider_id: '', provider_name: '', environment_id: '', environment_name: '', url: '', notes: '' }]);
  }

  function removeHosting(index: number) {
    setHosting((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHosting(index: number, updates: Partial<HostingEntry>) {
    setHosting((prev) =>
      prev.map((h, i) => (i === index ? { ...h, ...updates } : h)),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: AccountFormValues = {
      name: formData.get('name') as string,
      type: (formData.get('type') as AccountFormValues['type']) ?? 'Prospect',
      status: (formData.get('status') as AccountFormValues['status']) ?? 'Actief',
      domain: (formData.get('domain') as string) || undefined,
      industry: (formData.get('industry') as string) || undefined,
      size: (formData.get('size') as string) || undefined,
      revenue: formData.get('revenue') ? Number(formData.get('revenue')) : undefined,
      phone: (formData.get('phone') as string) || undefined,
      website: (formData.get('website') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
      country: (formData.get('country') as string) || undefined,
      vat_number: (formData.get('vat_number') as string) || undefined,
      about: (formData.get('about') as string) || undefined,
      managing_partner: (formData.get('managing_partner') as string) || undefined,
      account_director: (formData.get('account_director') as string) || undefined,
      project_manager: (formData.get('project_manager') as string) || undefined,
      team: (formData.get('team') as string) || undefined,
      phpro_contract: (formData.get('phpro_contract') as AccountFormValues['phpro_contract']) || undefined,
    };

    const parsed = accountFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    // 1. Save main account
    const result = isEdit
      ? await updateAccount(defaultValues!.id!, parsed.data)
      : await createAccount(parsed.data);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      setLoading(false);
      return;
    }

    const accountId = isEdit
      ? defaultValues!.id!
      : (result as { success: true; data?: { id: string } }).data?.id;

    if (!accountId) {
      toast.error('Kon account ID niet ophalen');
      setLoading(false);
      return;
    }

    // 2. Sync FK relations
    const relationResults = await Promise.all([
      syncAccountFKRelation(accountId, 'account_tech_stacks', 'technology_id', techStackIds),
      syncAccountFKRelation(accountId, 'account_samenwerkingsvormen', 'collaboration_type_id', samenwerkingsvormIds),
      syncAccountFKRelation(accountId, 'account_manual_services', 'service_name', manualServices),
    ]);

    const relationError = relationResults.find((r) => 'error' in r && r.error);
    if (relationError && 'error' in relationError) {
      toast.error(typeof relationError.error === 'string' ? relationError.error : 'Fout bij opslaan relaties');
    }

    // 3. Sync hosting: delete existing, add new
    if (defaultValues?.hosting) {
      await Promise.all(
        defaultValues.hosting.map((h) => deleteAccountRelation('account_hosting', h.id)),
      );
    }
    if (hosting.length > 0) {
      await Promise.all(
        hosting
          .filter((h) => h.provider_id)
          .map((h) =>
            addAccountRelation(accountId, 'account_hosting', {
              provider_id: h.provider_id,
              environment_id: h.environment_id || null,
              url: h.url || null,
              notes: h.notes || null,
            }),
          ),
      );
    }

    // 4. Sync competence centers: delete existing, add new
    if (defaultValues?.competenceCenters) {
      await Promise.all(
        defaultValues.competenceCenters.map((cc) =>
          deleteAccountRelation('account_competence_centers', cc.id),
        ),
      );
    }
    if (competenceCenters.length > 0) {
      for (const cc of competenceCenters.filter((cc) => cc.competence_center_id)) {
        const ccResult = await addAccountRelation(accountId, 'account_competence_centers', {
          competence_center_id: cc.competence_center_id,
        });
        // Add CC services if the CC was created successfully
        if ('data' in ccResult && ccResult.data && cc.service_ids.length > 0) {
          const ccId = ccResult.data.id;
          await Promise.all(
            cc.service_ids.map((serviceId) =>
              addAccountRelation(accountId, 'account_cc_services', {
                account_competence_center_id: ccId,
                service_id: serviceId,
              }),
            ),
          );
        }
      }
    }

    setLoading(false);
    toast.success(isEdit ? 'Account bijgewerkt' : 'Account aangemaakt');

    const shouldClose = formRef.current?.dataset.closeAfterSave === 'true';
    if (formRef.current) formRef.current.dataset.closeAfterSave = '';

    if (onSuccess) {
      onSuccess();
    } else if (isEdit && shouldClose) {
      router.push(`/admin/accounts/${accountId}`);
    } else if (isEdit) {
      router.refresh();
    } else {
      router.push('/admin/accounts');
    }
  }

  return (
    <form id="account-form" ref={formRef} onSubmit={handleSubmit}>
      <div className="rounded-xl border bg-card p-6 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* -- Left Column: Bedrijfsinformatie -- */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bedrijfsinformatie
          </h3>

          <div className="space-y-1.5">
            <Label htmlFor="name">Naam *</Label>
            <Input id="name" name="name" defaultValue={defaultValues?.name ?? ''} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="domain">Domein</Label>
            <Input id="domain" name="domain" defaultValue={defaultValues?.domain ?? ''} placeholder="bv. bedrijf.be" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={defaultValues?.type ?? 'Prospect'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Klant">Klant</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={defaultValues?.status ?? 'Actief'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actief">Actief</SelectItem>
                  <SelectItem value="Inactief">Inactief</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="industry">Sector</Label>
            <Input id="industry" name="industry" defaultValue={defaultValues?.industry ?? ''} placeholder="bv. Technology" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="size">Grootte</Label>
              <Select name="size" defaultValue={defaultValues?.size ?? ''}>
                <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-200">51-200</SelectItem>
                  <SelectItem value="201-1000">201-1000</SelectItem>
                  <SelectItem value="1000+">1000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="revenue_display">Omzet</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                <Input
                  id="revenue_display"
                  type="text"
                  inputMode="numeric"
                  defaultValue={defaultValues?.revenue ? new Intl.NumberFormat('nl-BE').format(Number(defaultValues.revenue)) : ''}
                  placeholder="bv. 1.000.000"
                  className="pl-7"
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const hidden = e.target.form?.querySelector<HTMLInputElement>('input[name="revenue"]');
                    if (hidden) hidden.value = raw;
                    if (raw) {
                      e.target.value = new Intl.NumberFormat('nl-BE').format(Number(raw));
                    }
                  }}
                />
                <input type="hidden" name="revenue" defaultValue={defaultValues?.revenue ?? ''} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefoon</Label>
            <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ''} placeholder="+32 ..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" defaultValue={defaultValues?.website ?? ''} placeholder="www.bedrijf.be" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Adres</Label>
            <Input id="address" name="address" defaultValue={defaultValues?.address ?? ''} placeholder="Straat 1, 1000 Stad" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="country">Land</Label>
              <Select name="country" defaultValue={defaultValues?.country ?? ''}>
                <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vat_number">BTW-nummer</Label>
              <Input id="vat_number" name="vat_number" defaultValue={defaultValues?.vat_number ?? ''} placeholder="BE0123.456.789" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="about">Over dit bedrijf</Label>
            <Textarea id="about" name="about" rows={3} defaultValue={defaultValues?.about ?? ''} placeholder="Korte omschrijving..." />
          </div>
        </div>

        {/* -- Right Column: PHPro Intern -- */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            PHPro Intern
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="managing_partner">Managing Partner</Label>
              <Select name="managing_partner" defaultValue={defaultValues?.managing_partner ?? ''}>
                <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geen</SelectItem>
                  {referenceData?.internalPeople.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      <Avatar path={p.avatar_url} fallback={p.name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)} size="xs" />
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account_director">Account Director</Label>
              <Select name="account_director" defaultValue={defaultValues?.account_director ?? ''}>
                <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geen</SelectItem>
                  {referenceData?.internalPeople.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      <Avatar path={p.avatar_url} fallback={p.name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)} size="xs" />
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project_manager">Project Manager</Label>
              <Select name="project_manager" defaultValue={defaultValues?.project_manager ?? ''}>
                <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geen</SelectItem>
                  {referenceData?.internalPeople.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      <Avatar path={p.avatar_url} fallback={p.name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)} size="xs" />
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="team">Team</Label>
              <Select name="team" defaultValue={defaultValues?.team ?? ''}>
                <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geen</SelectItem>
                  {referenceData?.teams.map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phpro_contract">PHPro Contract status</Label>
            <Select name="phpro_contract" defaultValue={defaultValues?.phpro_contract ?? 'Geen'}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Geen">Geen</SelectItem>
                <SelectItem value="Actief">Actief</SelectItem>
                <SelectItem value="Inactief">Inactief</SelectItem>
                <SelectItem value="In onderhandeling">In onderhandeling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Samenwerkingsvorm toggle chips */}
          <div className="space-y-1.5">
            <Label>Samenwerkingsvorm</Label>
            <div className="flex flex-wrap gap-2">
              {ref.collaborationTypes.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleSamenwerkingsvorm(option.id)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    samenwerkingsvormIds.includes(option.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-accent'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack chip select */}
          <div className="space-y-1.5">
            <Label>Tech Stack</Label>
            <RefChipInput
              selectedIds={techStackIds}
              onChange={setTechStackIds}
              options={ref.technologies}
              placeholder="Zoek of voeg toe..."
            />
          </div>

          {/* Manual Services chip input */}
          <div className="space-y-1.5">
            <Label>PHPro Services manueel</Label>
            <StringChipInput
              values={manualServices}
              onChange={setManualServices}
              placeholder="Zoek service..."
            />
          </div>

          {/* Competence Centers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Andere Competence Centers</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addCompetenceCenter}>
                <Plus className="h-4 w-4 mr-1" /> CC toevoegen
              </Button>
            </div>
            {competenceCenters.map((cc, index) => (
              <div key={index} className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={cc.competence_center_id || undefined}
                    onValueChange={(v) => {
                      if (!v) return;
                      const found = ref.competenceCenters.find((o) => o.id === v);
                      updateCompetenceCenter(index, {
                        competence_center_id: v,
                        competence_center_name: found?.name ?? '',
                      });
                    }}
                  >
                    <SelectTrigger>{cc.competence_center_name || <span className="text-muted-foreground">Selecteer CC...</span>}</SelectTrigger>
                    <SelectContent>
                      {ref.competenceCenters.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompetenceCenter(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ref.ccServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleCCService(index, service.id)}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                        cc.service_ids.includes(service.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      {service.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Hosting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Hosting</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addHosting}>
                <Plus className="h-4 w-4 mr-1" /> Hosting toevoegen
              </Button>
            </div>
            {hosting.map((entry, index) => (
              <div key={index} className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={entry.provider_id || undefined}
                      onValueChange={(v) => {
                        if (!v) return;
                        const found = ref.hostingProviders.find((o) => o.id === v);
                        updateHosting(index, { provider_id: v, provider_name: found?.name ?? '' });
                      }}
                    >
                      <SelectTrigger>{entry.provider_name || <span className="text-muted-foreground">Provider...</span>}</SelectTrigger>
                      <SelectContent>
                        {ref.hostingProviders.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-36">
                    <Select
                      value={entry.environment_id || undefined}
                      onValueChange={(v) => {
                        const found = ref.hostingEnvironments.find((o) => o.id === v);
                        updateHosting(index, { environment_id: v ?? '', environment_name: found?.name ?? '' });
                      }}
                    >
                      <SelectTrigger>{entry.environment_name || <span className="text-muted-foreground">Omgeving</span>}</SelectTrigger>
                      <SelectContent>
                        {ref.hostingEnvironments.map((env) => (
                          <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHosting(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <Input
                  value={entry.url}
                  onChange={(e) => updateHosting(index, { url: e.target.value })}
                  placeholder="URL"
                />
                <Input
                  value={entry.notes}
                  onChange={(e) => updateHosting(index, { notes: e.target.value })}
                  placeholder="Notitie"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
