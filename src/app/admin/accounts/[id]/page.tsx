import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { getAccount } from '@/features/accounts/queries/get-account';
import { getDealsByAccount } from '@/features/deals/queries/get-deals-by-account';
import { AccountDetail } from '@/features/accounts/components/account-detail';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const account = await getAccount(id);
  return { title: account ? account.name : 'Account' };
}

export default async function AccountDetailPage({ params }: Props) {
  const { id } = await params;
  const account = await getAccount(id);

  if (!account) {
    notFound();
  }

  const deals = await getDealsByAccount(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts', href: '/admin/accounts' },
          { label: account.name },
        ]}
      />
      <AccountDetail account={account} deals={deals} />
    </div>
  );
}
