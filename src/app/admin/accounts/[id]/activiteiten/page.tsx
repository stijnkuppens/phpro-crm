import { getActivities } from '@/features/activities/queries/get-activities';
import { getDealsByAccount } from '@/features/deals/queries/get-deals-by-account';
import { getAccount } from '@/features/accounts/queries/get-account';
import { AccountActivitiesTab } from '@/features/accounts/components/account-activities-tab';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ActiviteitenPage({ params }: Props) {
  const { id } = await params;
  const [activities, deals, account] = await Promise.all([
    getActivities({ filters: { account_id: id }, pageSize: 50 }),
    getDealsByAccount(id),
    getAccount(id),
  ]);
  return (
    <AccountActivitiesTab
      accountId={id}
      accountName={account?.name ?? ''}
      initialData={activities.data}
      initialCount={activities.count}
      deals={deals.map((d) => ({ id: d.id, title: d.title }))}
    />
  );
}
