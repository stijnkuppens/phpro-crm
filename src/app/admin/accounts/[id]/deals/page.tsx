import { getDealsByAccount } from '@/features/deals/queries/get-deals-by-account';
import { AccountDealsTab } from '@/features/deals/components/account-deals-tab';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DealsPage({ params }: Props) {
  const { id } = await params;
  const deals = await getDealsByAccount(id);
  return <AccountDealsTab deals={deals} />;
}
