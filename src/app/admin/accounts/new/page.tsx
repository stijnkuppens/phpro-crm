import { requirePermission } from '@/lib/require-permission';
import { AccountForm } from '@/features/accounts/components/account-form';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import type { AccountReferenceData } from '@/features/accounts/types';

export default async function NewAccountPage() {
  await requirePermission('accounts.write');

  const [technologies, collaborationTypes, hostingProviders, hostingEnvironments, competenceCenters, ccServices] = await Promise.all([
    getReferenceOptions('ref_technologies'),
    getReferenceOptions('ref_collaboration_types'),
    getReferenceOptions('ref_hosting_providers'),
    getReferenceOptions('ref_hosting_environments'),
    getReferenceOptions('ref_competence_centers'),
    getReferenceOptions('ref_cc_services'),
  ]);

  const referenceData: AccountReferenceData = {
    technologies,
    collaborationTypes,
    hostingProviders,
    hostingEnvironments,
    competenceCenters,
    ccServices,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nieuw Account</h1>
      <AccountForm referenceData={referenceData} />
    </div>
  );
}
