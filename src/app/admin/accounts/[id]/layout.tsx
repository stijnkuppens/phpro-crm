import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { AccountBanner } from '@/features/accounts/components/account-banner';
import { AccountSubNav } from '@/features/accounts/components/account-sub-nav';
import { getAccount } from '@/features/accounts/queries/get-account';
import { getAccountBannerStats } from '@/features/accounts/queries/get-account-banner-stats';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const account = await getAccount(id);
  return { title: account ? account.name : 'Account' };
}

export default async function AccountDetailLayout({ params, children }: Props) {
  const { id } = await params;

  const [account, stats] = await Promise.all([getAccount(id), getAccountBannerStats(id)]);

  if (!account) notFound();

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
      <AccountBanner account={account} stats={stats} />
      <AccountSubNav accountId={id} stats={stats} />
      {children}
    </div>
  );
}
