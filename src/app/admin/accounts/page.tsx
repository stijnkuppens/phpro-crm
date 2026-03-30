import { PageHeader } from '@/components/admin/page-header';
import { AccountList } from '@/features/accounts/components/account-list';
import { getAccountFilterOptions } from '@/features/accounts/queries/get-account-filter-options';
import { getAccounts } from '@/features/accounts/queries/get-accounts';

export default async function AccountsPage() {
  const [{ data, count }, filterOptions] = await Promise.all([
    getAccounts(),
    getAccountFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Accounts' }]}
      />
      <AccountList initialData={data} initialCount={count} filterOptions={filterOptions} />
    </div>
  );
}
