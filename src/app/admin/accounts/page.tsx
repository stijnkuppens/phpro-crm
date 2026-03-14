import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { AccountList } from '@/features/accounts/components/account-list';
import { Button } from '@/components/ui/button';

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts' },
        ]}
        actions={
          <Button asChild>
            <Link href="/admin/accounts/new">Nieuw Account</Link>
          </Button>
        }
      />
      <AccountList />
    </div>
  );
}
