import { PageHeader } from '@/components/admin/page-header';
import { getActivities } from '@/features/activities/queries/get-activities';
import { ActivityList } from '@/features/activities/components/activity-list';

export default async function ActivitiesPage() {
  const { data, count } = await getActivities();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activiteiten"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Activiteiten' },
        ]}
      />
      <ActivityList initialData={data} initialCount={count} />
    </div>
  );
}
