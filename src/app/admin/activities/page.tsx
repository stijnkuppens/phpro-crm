import { PageHeader } from '@/components/admin/page-header';
import { getActivities } from '@/features/activities/queries/get-activities';
import { getActivityFilterOptions } from '@/features/activities/queries/get-activity-filter-options';
import { ActivityList } from '@/features/activities/components/activity-list';

export default async function ActivitiesPage() {
  const [{ data, count }, filterOptions] = await Promise.all([
    getActivities(),
    getActivityFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activiteiten"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Activiteiten' },
        ]}
      />
      <ActivityList initialData={data} initialCount={count} filterOptions={filterOptions} />
    </div>
  );
}
