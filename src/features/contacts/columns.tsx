'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Avatar } from '@/components/admin/avatar';
import { Badge } from '@/components/ui/badge';
import type { ContactWithDetails } from './types';

export const contactColumns: ColumnDef<ContactWithDetails>[] = [
  {
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    id: 'name',
    meta: { label: 'Naam' },
    header: 'Naam',
    cell: ({ row }) => {
      const initials = `${row.original.first_name[0] ?? ''}${row.original.last_name[0] ?? ''}`.toUpperCase();
      return (
        <div className="flex items-center gap-2">
          <Avatar path={row.original.avatar_url} fallback={initials} size="sm" />
          <span>
            {row.original.first_name} {row.original.last_name}
          </span>
          {row.original.is_steerco && (
            <Badge variant="secondary" className="text-[10px]">
              Steerco
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    id: 'email',
    meta: { label: 'E-mail' },
    header: 'E-mail',
  },
  {
    accessorKey: 'phone',
    id: 'phone',
    meta: { label: 'Telefoon' },
    header: 'Telefoon',
  },
  {
    accessorKey: 'title',
    id: 'title',
    meta: { label: 'Functie' },
    header: 'Functie',
  },
  {
    accessorKey: 'role',
    id: 'role',
    meta: { label: 'Rol' },
    header: 'Rol',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    meta: { label: 'Account' },
    header: 'Account',
  },
];
