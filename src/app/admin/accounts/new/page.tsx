import { requirePermission } from '@/lib/require-permission';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import { AccountCreatePageClient } from '@/features/accounts/components/account-create-page-client';
import type { AccountReferenceData } from '@/features/accounts/types';

export default async function NewAccountPage() {
  await requirePermission('accounts.write');

  const [technologies, collaborationTypes, hostingProviders, hostingEnvironments, competenceCenters, ccServices, internalPeople, teams] = await Promise.all([
    getReferenceOptions('ref_technologies'),
    getReferenceOptions('ref_collaboration_types'),
    getReferenceOptions('ref_hosting_providers'),
    getReferenceOptions('ref_hosting_environments'),
    getReferenceOptions('ref_competence_centers'),
    getReferenceOptions('ref_cc_services'),
    getReferenceOptions('ref_internal_people'),
    getReferenceOptions('ref_teams'),
  ]);

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

  return <AccountCreatePageClient referenceData={referenceData} />;
}
