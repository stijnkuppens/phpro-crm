'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListPageToolbar } from '@/components/admin/list-page-toolbar';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/admin/data-table';
import { userColumns } from '../columns';
import type { UserWithEmail } from '../queries/get-users';

type Props = {
  initialData: UserWithEmail[];
};

export function UserList({ initialData }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <ListPageToolbar
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/admin/users/invite" />}>
            <Plus /> Uitnodigen
          </Button>
        }
      />
      <DataTable
        tableId="users"
        columns={userColumns}
        data={initialData}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
      />
    </div>
  );
}
