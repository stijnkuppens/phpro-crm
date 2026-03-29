import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { accountExportColumns, ACCOUNT_EXPORT_SELECT } from '@/features/accounts/export-columns';
import { AccountList } from '@/features/accounts/components/account-list';
import { getAccounts } from '@/features/accounts/queries/get-accounts';
import { getAccountFilterOptions } from '@/features/accounts/queries/get-account-filter-options';

export default async function AccountsPage() {
  const [{ data, count }, filterOptions] = await Promise.all([
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
          <div className="flex gap-2">
            <ExportDropdown
              entity="accounts"
              columns={accountExportColumns}
              getFilters={() => ({ sort: { column: 'name', direction: 'asc' } })}
              selectQuery={ACCOUNT_EXPORT_SELECT}
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
