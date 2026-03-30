import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AccountEditPageClient } from '@/features/accounts/components/account-edit-page-client';
import { getAccount } from '@/features/accounts/queries/get-account';
import type { AccountReferenceData } from '@/features/accounts/types';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import { requirePermission } from '@/lib/require-permission';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const account = await getAccount(id);
  return { title: account ? `${account.name} bewerken` : 'Account bewerken' };
}

export default async function AccountEditPage({ params }: Props) {
  await requirePermission('accounts.write');

  const { id } = await params;

  const [
    account,
    technologies,
    collaborationTypes,
    hostingProviders,
    hostingEnvironments,
    competenceCenters,
    ccServices,
    internalPeople,
    teams,
  ] = await Promise.all([
    getAccount(id),
    getReferenceOptions('ref_technologies'),
    getReferenceOptions('ref_collaboration_types'),
    getReferenceOptions('ref_hosting_providers'),
    getReferenceOptions('ref_hosting_environments'),
    getReferenceOptions('ref_competence_centers'),
    getReferenceOptions('ref_cc_services'),
    getReferenceOptions('ref_internal_people'),
    getReferenceOptions('ref_teams'),
  ]);

  if (!account) {
    notFound();
  }

  const referenceData: AccountReferenceData = {
    technologies,
    collaborationTypes,
    hostingProviders,
    hostingEnvironments,
    competenceCenters,
    ccServices,
    internalPeople,
    teams,
  };

  const defaultValues = {
    id: account.id,
    name: account.name,
    domain: account.domain ?? undefined,
    type: account.type as 'Klant' | 'Prospect' | 'Partner',
    status: account.status as 'Actief' | 'Inactief',
    industry: account.industry ?? undefined,
    size: account.size ?? undefined,
    revenue: account.revenue ?? undefined,
    phone: account.phone ?? undefined,
    website: account.website ?? undefined,
    address: account.address ?? undefined,
    country: account.country ?? undefined,
    vat_number: account.vat_number ?? undefined,
    about: account.about ?? undefined,
    managing_partner: account.managing_partner ?? undefined,
    account_director: account.account_director ?? undefined,
    project_manager: account.project_manager_id ?? undefined,
    team: account.team ?? undefined,
    phpro_contract:
      (account.phpro_contract as 'Geen' | 'Actief' | 'Inactief' | 'In onderhandeling') ?? undefined,
    techStackIds: account.tech_stacks.map((t) => t.technology.id),
    samenwerkingsvormIds: account.samenwerkingsvormen.map((s) => s.collaboration_type.id),
    manualServices: account.manual_services.map((s) => s.service_name),
    competenceCenters: account.competence_centers.map((cc) => ({
      id: cc.id,
      competence_center_id: cc.cc.id,
      competence_center_name: cc.cc.name,
      service_ids: cc.cc_services.map((s) => s.service_id),
    })),
    hosting: account.hosting.map((h) => ({
      id: h.id,
      provider_id: h.provider.id,
      provider_name: h.provider.name,
      environment_id: h.environment?.id ?? '',
      environment_name: h.environment?.name ?? '',
      url: h.url,
      notes: h.notes,
    })),
  };

  return (
    <AccountEditPageClient
      account={{ id: account.id, name: account.name }}
      referenceData={referenceData}
      defaultValues={defaultValues}
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Accounts', href: '/admin/accounts' },
        { label: account.name, href: `/admin/accounts/${id}` },
        { label: 'Bewerken' },
      ]}
    />
  );
}
