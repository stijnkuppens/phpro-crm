import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { getConsultants } from '@/features/consultants/queries/get-consultants';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import { ConsultantListView } from '@/features/consultants/components/consultant-list';
import { getCurrentRate } from '@/features/consultants/types';

export const metadata: Metadata = { title: 'Consultants' };

const PAGE_SIZE = 25;

export default async function ConsultantsPage() {
  const [{ data: firstPage, count }, rolesRaw, statsData] = await Promise.all([
    getConsultants({ pageSize: PAGE_SIZE }),
    getReferenceOptions('ref_consultant_roles'),
    // Lightweight call for stats — fetch all non-archived consultants across all statuses
    getConsultants({ pageSize: 9999, status: ['bench', 'actief', 'stopgezet'] }),
  ]);

  const allConsultants = statsData.data;
  const benchOnes = allConsultants.filter((c) => c.status === 'bench');
  const activeOnes = allConsultants.filter((c) => c.status === 'actief');
  const stoppedOnes = allConsultants.filter((c) => c.status === 'stopgezet');

  const stats = {
    benchCount: benchOnes.length,
    activeCount: activeOnes.length,
    maxRevenue: activeOnes.reduce((sum, c) => sum + getCurrentRate(c) * 8 * 21, 0),
    stoppedCount: stoppedOnes.length,
  };

  const roles = rolesRaw.map((r) => ({ value: r.name, label: r.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultants"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Consultants' },
        ]}
      />
      <ConsultantListView
        initialData={firstPage}
        initialCount={count}
        stats={stats}
        roles={roles}
      />
    </div>
  );
}
