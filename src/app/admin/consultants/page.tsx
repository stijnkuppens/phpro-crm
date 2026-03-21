import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { getActiveConsultants } from '@/features/consultants/queries/get-active-consultants';
import { getAccountNames } from '@/features/accounts/queries/get-account-names';
import { getBenchConsultants } from '@/features/bench/queries/get-bench-consultants';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import { ConsultantListView } from '@/features/consultants/components/consultant-list';
import { getContractStatus, getCurrentRate } from '@/features/consultants/types';

export const metadata: Metadata = { title: 'Consultants' };

const PAGE_SIZE = 25;

export default async function ConsultantsPage() {
  const [{ data: firstPage, count }, accountOptions, benchConsultants, rolesRaw] = await Promise.all([
    getActiveConsultants({ pageSize: PAGE_SIZE }),
    getAccountNames(),
    getBenchConsultants(),
    getReferenceOptions('ref_consultant_roles'),
  ]);

  // Stats need the full dataset — use a separate lightweight call
  // React.cache deduplicates within the same request if params match
  const { data: allConsultants } = await getActiveConsultants({ pageSize: 9999 });
  const activeOnes = allConsultants.filter((c) => !c.is_stopped);
  const stats = {
    activeCount: activeOnes.length,
    maxRevenue: activeOnes.reduce((sum, c) => sum + getCurrentRate(c) * 8 * 21, 0),
    critical: allConsultants.filter((c) => getContractStatus(c) === 'kritiek').length,
    stopped: allConsultants.filter((c) => c.is_stopped).length,
  };

  const accounts = accountOptions.map((a) => ({
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
        initialData={firstPage}
        initialCount={count}
        stats={stats}
        accounts={accounts}
        benchConsultants={benchConsultants}
        roles={roles}
      />
    </div>
  );
}
