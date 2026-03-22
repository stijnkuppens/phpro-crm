import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InviteForm } from '@/features/users/components/invite-form';

export default function InviteUserPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Gebruiker uitnodigen"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Gebruikers', href: '/admin/users' },
          { label: 'Uitnodigen' },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Nieuwe gebruiker uitnodigen</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>
    </div>
  );
}
