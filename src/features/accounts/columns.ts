'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Account } from './types';

export const accountColumns: ColumnDef<Account>[] = [
  {
    accessorKey: 'name',
    header: 'Naam',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'industry',
    header: 'Sector',
  },
  {
    accessorKey: 'country',
    header: 'Land',
  },
  {
    accessorKey: 'health',
    header: 'Health',
  },
  {
    accessorKey: 'phpro_contract',
    header: 'Contract',
  },
];
