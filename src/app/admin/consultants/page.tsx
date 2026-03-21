import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { getActiveConsultants } from '@/features/consultants/queries/get-active-consultants';
import { getAccounts } from '@/features/accounts/queries/get-accounts';
import { getBenchConsultants } from '@/features/bench/queries/get-bench-consultants';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import { ConsultantListView } from '@/features/consultants/components/consultant-list';

export const metadata: Metadata = { title: 'Consultants' };

export default async function ConsultantsPage() {
  const [consultants, accountsResult, benchConsultants, rolesRaw] = await Promise.all([
    getActiveConsultants(),
    getAccounts({ pageSize: 9999 }),
    getBenchConsultants(),
    getReferenceOptions('ref_consultant_roles'),
  ]);

  const accounts = accountsResult.data.map((a) => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    type: a.type,
    city: null as string | null,
  }));

  const roles = rolesRaw.map((r) => ({ value: r.name, label: r.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actieve Consultants"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Consultants' },
        ]}
      />
      <ConsultantListView
        initialData={consultants}
        accounts={accounts}
        benchConsultants={benchConsultants}
        roles={roles}
      />
    </div>
  );
}
