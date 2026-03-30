import { getAccountNames } from '@/features/accounts/queries/get-account-names';
import { ActivityList } from '@/features/activities/components/activity-list';
import { getActivities } from '@/features/activities/queries/get-activities';

export default async function ActivitiesPage() {
  const [{ data, count }, accounts] = await Promise.all([getActivities(), getAccountNames()]);

  return <ActivityList initialData={data} initialCount={count} accounts={accounts} />;
}
