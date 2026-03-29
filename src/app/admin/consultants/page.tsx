import type { Metadata } from 'next';
import { getConsultants } from '@/features/consultants/queries/get-consultants';
import { getConsultantStats } from '@/features/consultants/queries/get-consultant-stats';
import { getAccountNames } from '@/features/accounts/queries/get-account-names';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';
import { ConsultantListView } from '@/features/consultants/components/consultant-list';

export const metadata: Metadata = { title: 'Consultants' };

const PAGE_SIZE = 25;

export default async function ConsultantsPage() {
  const [{ data: firstPage, count }, accountOptions, rolesRaw, stats] = await Promise.all([
    getConsultants({ pageSize: PAGE_SIZE }),
    getAccountNames(),
    getReferenceOptions('ref_consultant_roles'),
    getConsultantStats(),
  ]);

  const roles = rolesRaw.map((r) => ({ value: r.name, label: r.name }));
  const accounts = accountOptions.map((a) => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    type: a.type,
    city: null as string | null,
  }));

  return (
    <ConsultantListView
      initialData={firstPage}
      initialCount={count}
      stats={stats}
      roles={roles}
      accounts={accounts}
    />
  );
}
