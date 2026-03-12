import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InviteUserPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Invite User"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: 'Invite' },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Invite a New User</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User invitation is not yet implemented. Use Supabase Auth to invite users via the
            dashboard or API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
