import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { AccountList } from '@/features/accounts/components/account-list';
import { getAccounts } from '@/features/accounts/queries/get-accounts';

export default async function AccountsPage() {
  const { data, count } = await getAccounts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts' },
        ]}
        actions={
          <Link
            href="/admin/accounts/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Nieuw Account
          </Link>
        }
      />
      <AccountList initialData={data} initialCount={count} />
    </div>
  );
}
