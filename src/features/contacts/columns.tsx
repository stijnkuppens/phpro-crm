'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { ContactWithDetails } from './types';

export const contactColumns: ColumnDef<ContactWithDetails>[] = [
  {
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    id: 'name',
    header: 'Naam',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.original.first_name} {row.original.last_name}</span>
        {row.original.is_steerco && (
          <Badge variant="secondary" className="text-[10px]">Steerco</Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'E-mail',
  },
  {
    accessorKey: 'phone',
    header: 'Telefoon',
  },
  {
    accessorKey: 'title',
    header: 'Functie',
  },
  {
    accessorKey: 'role',
    header: 'Rol',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    header: 'Account',
  },
];
