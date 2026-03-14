'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ActivityWithRelations } from './types';

export const activityColumns: ColumnDef<ActivityWithRelations>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'subject',
    header: 'Onderwerp',
  },
  {
    accessorKey: 'date',
    header: 'Datum',
    cell: ({ getValue }) => {
      const d = getValue<string>();
      return d ? new Date(d).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    },
  },
  {
    accessorKey: 'duration_minutes',
    header: 'Duur',
    cell: ({ getValue }) => {
      const m = getValue<number | null>();
      return m ? `${m} min` : '';
    },
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    header: 'Account',
  },
  {
    accessorFn: (row) => row.deal?.title ?? '',
    id: 'deal',
    header: 'Deal',
  },
  {
    accessorKey: 'is_done',
    header: 'Status',
    cell: ({ getValue }) => getValue<boolean>() ? 'Afgerond' : 'Gepland',
  },
];
