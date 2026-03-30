import { Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { UserList } from '@/features/users/components/user-list';
import { getUsers } from '@/features/users/queries/get-users';

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gebruikers"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Gebruikers' }]}
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/admin/users/invite" />}>
            <Plus /> Uitnodigen
          </Button>
        }
      />
      <UserList initialData={users} />
    </div>
  );
}
