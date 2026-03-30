import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { UserDetail } from '@/features/users/components/user-detail';
import { getUser } from '@/features/users/queries/get-user';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user?.full_name || 'User' };
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getUser(id);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={profile.full_name || 'User'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: profile.full_name || 'User' },
        ]}
      />
      <UserDetail profile={profile} />
    </div>
  );
}
