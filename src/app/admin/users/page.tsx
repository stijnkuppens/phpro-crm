import { getUsers } from '@/features/users/queries/get-users';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]}
        actions={
          <Link href="/admin/users/invite">
            <Button>Invite User</Button>
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users?.map((user) => (
          <Link key={user.id} href={`/admin/users/${user.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar>
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {user.full_name
                      ? user.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                      : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{user.full_name || 'Unnamed'}</p>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
