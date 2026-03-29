import { PageHeader } from '@/components/admin/page-header';
import { getActivities } from '@/features/activities/queries/get-activities';
import { getAccounts } from '@/features/accounts/queries/get-accounts';
import { ActivityList } from '@/features/activities/components/activity-list';

export default async function ActivitiesPage() {
  const [{ data, count }, { data: accountsData }] = await Promise.all([
    getActivities(),
    getAccounts({ pageSize: 500 }),
  ]);

  const accounts = accountsData.map((a) => ({ id: a.id, name: a.name }));

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
