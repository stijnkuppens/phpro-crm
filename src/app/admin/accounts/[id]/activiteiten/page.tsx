import { getActivities } from '@/features/activities/queries/get-activities';
import { AccountActivitiesTab } from '@/features/accounts/components/account-activities-tab';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ActiviteitenPage({ params }: Props) {
  const { id } = await params;
  const activities = await getActivities({ filters: { account_id: id }, pageSize: 50 });
  return <AccountActivitiesTab accountId={id} initialData={activities.data} initialCount={activities.count} />;
}
