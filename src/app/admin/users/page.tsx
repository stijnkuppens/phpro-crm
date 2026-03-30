import { PageHeader } from '@/components/admin/page-header';
import { UserList } from '@/features/users/components/user-list';
import { getUsers } from '@/features/users/queries/get-users';

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-2">
      <PageHeader
        title="Gebruikers"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Gebruikers' }]}
      />
      <UserList initialData={users} />
    </div>
  );
}
