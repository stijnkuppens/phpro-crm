import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { UserEditForm } from '@/features/users/components/user-edit-form';
import { getUser } from '@/features/users/queries/get-user';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user ? `${user.full_name} bewerken` : 'Gebruiker bewerken' };
}

export default async function UserEditPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user.full_name || 'Gebruiker'} bewerken`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Gebruikers', href: '/admin/users' },
          { label: user.full_name || 'Gebruiker', href: `/admin/users/${id}` },
          { label: 'Bewerken' },
        ]}
      />
      <div className="max-w-2xl">
        <UserEditForm user={user} />
      </div>
    </div>
  );
}
