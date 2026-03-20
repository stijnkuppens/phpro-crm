import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { ReferenceDataPage } from '@/features/reference-data/components/reference-data-page';
import { getReferenceItems } from '@/features/reference-data/queries/get-reference-items';

export const metadata: Metadata = {
  title: 'Referentiegegevens',
};

export default async function ReferenceDataRoute() {
  const initialData = await getReferenceItems('ref_competence_centers');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referentiegegevens"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Referentiegegevens' },
        ]}
      />
      <ReferenceDataPage initialTable="ref_competence_centers" initialData={initialData} />
    </div>
  );
}
