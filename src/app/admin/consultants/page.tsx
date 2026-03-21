import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { getActiveConsultants } from '@/features/consultants/queries/get-active-consultants';
import { ConsultantListView } from '@/features/consultants/components/consultant-list';

export const metadata: Metadata = { title: 'Consultants' };

export default async function ConsultantsPage() {
  const consultants = await getActiveConsultants();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actieve Consultants"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Consultants' },
        ]}
      />
      <ConsultantListView initialData={consultants} />
    </div>
  );
}
