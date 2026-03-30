import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { AccountList } from '@/features/accounts/components/account-list';
import { accountExportColumns } from '@/features/accounts/export-columns';
import { getAccountFilterOptions } from '@/features/accounts/queries/get-account-filter-options';
import { getAccounts } from '@/features/accounts/queries/get-accounts';

export default async function AccountsPage() {
  const [{ data, count }, filterOptions] = await Promise.all([getAccounts(), getAccountFilterOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Accounts' }]}
        actions={
          <div className="flex gap-2">
            <ExportDropdown
              entity="accounts"
              columns={accountExportColumns}
              filters={{ sort: { column: 'name', direction: 'asc' } }}
            />
            <Button size="sm" nativeButton={false} render={<Link href="/admin/accounts/new" />}>
              <Plus />
              Nieuw Account
            </Button>
          </div>
        }
      />
      <AccountList initialData={data} initialCount={count} filterOptions={filterOptions} />
    </div>
  );
}
