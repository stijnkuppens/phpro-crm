import { PageHeader } from '@/components/admin/page-header';
import { getActivities } from '@/features/activities/queries/get-activities';
import { getAccountNames } from '@/features/accounts/queries/get-account-names';
import { ActivityList } from '@/features/activities/components/activity-list';

export default async function ActivitiesPage() {
  const [{ data, count }, accounts] = await Promise.all([
    getActivities(),
    getAccountNames(),
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
      <ActivityList initialData={data} initialCount={count} accounts={accounts} />
    </div>
  );
}
