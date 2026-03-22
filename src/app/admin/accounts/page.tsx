import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { AccountList } from '@/features/accounts/components/account-list';
import { getAccounts } from '@/features/accounts/queries/get-accounts';
import { getAccountFilterOptions } from '@/features/accounts/queries/get-account-filter-options';

export default async function AccountsPage() {
  const [{ data, count }, { owners, countries }] = await Promise.all([
    getAccounts(),
    getAccountFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts' },
        ]}
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/admin/accounts/new" />}>
            <Plus />
            Nieuw Account
          </Button>
        }
      />
      <AccountList initialData={data} initialCount={count} owners={owners} countries={countries} />
    </div>
  );
}
