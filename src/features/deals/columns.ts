'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { DealWithRelations } from './types';

export const dealColumns: ColumnDef<DealWithRelations>[] = [
  {
    accessorKey: 'title',
    header: 'Titel',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    header: 'Account',
  },
  {
    accessorKey: 'amount',
    header: 'Bedrag',
    cell: ({ getValue }) => {
      const n = Number(getValue<number>() ?? 0);
      return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
    },
  },
  {
    accessorFn: (row) => row.stage?.name ?? '',
    id: 'stage',
    header: 'Stage',
  },
  {
    accessorKey: 'probability',
    header: 'Kans',
    cell: ({ getValue }) => `${getValue<number>()}%`,
  },
  {
    accessorKey: 'close_date',
    header: 'Close Date',
    cell: ({ getValue }) => {
      const d = getValue<string | null>();
      return d ? new Date(d).toLocaleDateString('nl-BE') : '';
    },
  },
  {
    accessorFn: (row) => row.owner?.full_name ?? '',
    id: 'owner',
    header: 'Owner',
  },
  {
    accessorKey: 'forecast_category',
    header: 'Forecast',
  },
];
