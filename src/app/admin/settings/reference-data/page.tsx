import { ReferenceDataPage } from '@/features/reference-data/components/reference-data-page';
import { getReferenceItems } from '@/features/reference-data/queries/get-reference-items';

export default async function ReferenceDataSettingsPage() {
  const initialData = await getReferenceItems('ref_competence_centers');

  return <ReferenceDataPage initialTable="ref_competence_centers" initialData={initialData} />;
}
