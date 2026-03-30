import { Pencil } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { UserDetail } from '@/features/users/components/user-detail';
import { getUser } from '@/features/users/queries/get-user';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user?.full_name || 'Gebruiker' };
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.full_name || 'Gebruiker'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Gebruikers', href: '/admin/users' },
          { label: user.full_name || 'Gebruiker' },
        ]}
        actions={
          <Button size="sm" nativeButton={false} render={<Link href={`/admin/users/${id}/edit`} />}>
            <Pencil /> Bewerken
          </Button>
        }
      />
      <UserDetail user={user} />
    </div>
  );
}
