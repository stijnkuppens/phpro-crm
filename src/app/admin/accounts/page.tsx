import { PageHeader } from '@/components/admin/page-header';
import { AccountList } from '@/features/accounts/components/account-list';

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts' },
        ]}
      />
      <AccountList />
    </div>
  );
}
