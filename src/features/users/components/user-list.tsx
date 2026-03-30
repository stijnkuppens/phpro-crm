'use client';

import { useRouter } from 'next/navigation';
import DataTable from '@/components/admin/data-table';
import { userColumns } from '../columns';
import type { UserWithEmail } from '../queries/get-users';

type Props = {
  initialData: UserWithEmail[];
};

export function UserList({ initialData }: Props) {
  const router = useRouter();

  return (
    <DataTable
      tableId="users"
      columns={userColumns}
      data={initialData}
      onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
    />
  );
}
