'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ContactWithDetails } from './types';

export const contactColumns: ColumnDef<ContactWithDetails>[] = [
  {
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    id: 'name',
    header: 'Naam',
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
