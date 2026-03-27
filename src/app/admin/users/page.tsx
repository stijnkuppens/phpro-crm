import { getUsers } from '@/features/users/queries/get-users';
import { PageHeader } from '@/components/admin/page-header';
import { userColumns } from '@/features/users/columns';
import DataTable from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gebruikers"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Gebruikers' }]}
        actions={
          <Button nativeButton={false} render={<Link href="/admin/users/invite" />}>Gebruiker uitnodigen</Button>
        }
      />
      <DataTable tableId="users" columns={userColumns} data={users} />
    </div>
  );
}
