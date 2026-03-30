'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useRef, useState } from 'react';
import { toast } from 'sonner';
import { RefChipInput } from '@/components/admin/ref-chip-input';
import { StringChipInput } from '@/components/admin/string-chip-input';
import { Label } from '@/components/ui/label';
import { createAccount } from '@/features/accounts/actions/create-account';
import {
  addAccountRelation,
  deleteAccountRelation,
  syncAccountFKRelation,
} from '@/features/accounts/actions/manage-account-relations';
import { updateAccount } from '@/features/accounts/actions/update-account';
import {
  AccountFormCCSection,
  type CompetenceCenterEntry,
} from '@/features/accounts/components/account-form-cc-section';
import { AccountFormCompanySection } from '@/features/accounts/components/account-form-company-section';
import {
  AccountFormHostingSection,
  type HostingEntry,
} from '@/features/accounts/components/account-form-hosting-section';
import { AccountFormPeopleSection } from '@/features/accounts/components/account-form-people-section';
import {
  type AccountFormValues,
  type AccountReferenceData,
  accountFormSchema,
} from '@/features/accounts/types';

// ── Types ────────────────────────────────────────────────────────────────────

type Props = {
  referenceData?: AccountReferenceData;
  defaultValues?: Partial<AccountFormValues> & {
    id?: string;
    techStackIds?: string[];
    samenwerkingsvormIds?: string[];
    manualServices?: string[];
    competenceCenters?: Array<{
      id: string;
      competence_center_id: string;
      competence_center_name: string;
      service_ids: string[];
    }>;
    hosting?: Array<{
      id: string;
      provider_id: string;
      provider_name: string;
      environment_id: string;
      environment_name: string;
      url: string | null;
      notes: string | null;
    }>;
  };
  onSuccess?: () => void;
  /** External form ref — when provided, the form doesn't render its own FormActions */
  formRef?: React.RefObject<HTMLFormElement | null>;
};

// ── Main form ────────────────────────────────────────────────────────────────

export function AccountForm({
  referenceData,
  defaultValues,
  onSuccess,
  formRef: externalFormRef,
}: Props) {
  const router = useRouter();
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
  const [techStackIds, setTechStackIds] = useState<string[]>(defaultValues?.techStackIds ?? []);
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
    setCompetenceCenters((prev) => [
      ...prev,
      { competence_center_id: '', competence_center_name: '', service_ids: [] },
    ]);
  }

  function removeCompetenceCenter(index: number) {
    setCompetenceCenters((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCompetenceCenter(index: number, updates: Partial<CompetenceCenterEntry>) {
    setCompetenceCenters((prev) => prev.map((cc, i) => (i === index ? { ...cc, ...updates } : cc)));
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
    setHosting((prev) => [
      ...prev,
      {
        provider_id: '',
        provider_name: '',
        environment_id: '',
        environment_name: '',
        url: '',
        notes: '',
      },
    ]);
  }

  function removeHosting(index: number) {
    setHosting((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHosting(index: number, updates: Partial<HostingEntry>) {
    setHosting((prev) => prev.map((h, i) => (i === index ? { ...h, ...updates } : h)));
  }

  const [, formAction] = useActionState(async (_prev: null, formData: FormData) => {
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
      phpro_contract:
        (formData.get('phpro_contract') as AccountFormValues['phpro_contract']) || undefined,
    };

    const parsed = accountFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      return null;
    }

    // 1. Save main account
    const result = isEdit
      ? await updateAccount(defaultValues!.id!, parsed.data)
      : await createAccount(parsed.data);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return null;
    }

    const accountId = isEdit
      ? defaultValues!.id!
      : (result as { success: true; data?: { id: string } }).data?.id;

    if (!accountId) {
      toast.error('Kon account ID niet ophalen');
      return null;
    }

    // 2. Sync FK relations
    const relationResults = await Promise.all([
      syncAccountFKRelation(accountId, 'account_tech_stacks', 'technology_id', techStackIds),
      syncAccountFKRelation(
        accountId,
        'account_samenwerkingsvormen',
        'collaboration_type_id',
        samenwerkingsvormIds,
      ),
      syncAccountFKRelation(accountId, 'account_manual_services', 'service_name', manualServices),
    ]);

    const relationError = relationResults.find((r) => 'error' in r && r.error);
    if (relationError && 'error' in relationError) {
      toast.error(
        typeof relationError.error === 'string' ? relationError.error : 'Fout bij opslaan relaties',
      );
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
    return null;
  }, null);

  return (
    <form id="account-form" ref={formRef} action={formAction}>
      <div className="rounded-xl border bg-card p-6 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* -- Left Column: Bedrijfsinformatie -- */}
        <AccountFormCompanySection defaultValues={defaultValues} />

        {/* -- Right Column: PHPro Intern -- */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            PHPro Intern
          </h3>

          <AccountFormPeopleSection
            defaultValues={defaultValues}
            internalPeople={referenceData?.internalPeople}
            teams={referenceData?.teams}
          />

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
          <AccountFormCCSection
            entries={competenceCenters}
            onAdd={addCompetenceCenter}
            onRemove={removeCompetenceCenter}
            onUpdate={updateCompetenceCenter}
            onToggleService={toggleCCService}
            competenceCenters={ref.competenceCenters}
            ccServices={ref.ccServices}
          />

          {/* Hosting */}
          <AccountFormHostingSection
            entries={hosting}
            onAdd={addHosting}
            onRemove={removeHosting}
            onUpdate={updateHosting}
            providers={ref.hostingProviders}
            environments={ref.hostingEnvironments}
          />
        </div>
      </div>
    </form>
  );
}
