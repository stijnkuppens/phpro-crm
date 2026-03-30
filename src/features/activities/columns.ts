'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ActivityWithRelations } from './types';

export const activityColumns: ColumnDef<ActivityWithRelations>[] = [
  {
    accessorKey: 'type',
    id: 'type',
    meta: {
      label: 'Type',
      filter: {
        type: 'select',
        options: [
          { value: 'Meeting', label: 'Meeting' },
          { value: 'Demo', label: 'Demo' },
          { value: 'Call', label: 'Call' },
          { value: 'E-mail', label: 'E-mail' },
          { value: 'Lunch', label: 'Lunch' },
          { value: 'Event', label: 'Event' },
        ],
        placeholder: 'Alle types',
      },
    },
    header: 'Type',
  },
  {
    accessorKey: 'subject',
    id: 'subject',
    meta: {
      label: 'Onderwerp',
      filter: { type: 'search', placeholder: 'Zoek activiteiten...' },
    },
    header: 'Onderwerp',
  },
  {
    accessorKey: 'date',
    id: 'date',
    meta: { label: 'Datum' },
    header: 'Datum',
    cell: ({ getValue }) => {
      const d = getValue<string>();
      return d
        ? new Date(d).toLocaleDateString('nl-BE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '';
    },
  },
  {
    accessorKey: 'duration_minutes',
    id: 'duration_minutes',
    meta: { label: 'Duur' },
    header: 'Duur',
    cell: ({ getValue }) => {
      const m = getValue<number | null>();
      return m ? `${m} min` : '';
    },
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    meta: {
      label: 'Account',
      filter: {
        type: 'select',
        filterKey: 'account_id',
        placeholder: 'Alle accounts',
      },
    },
    header: 'Account',
  },
  {
    accessorFn: (row) => row.deal?.title ?? '',
    id: 'deal',
    meta: { label: 'Deal' },
    header: 'Deal',
  },
  {
    accessorKey: 'is_done',
    id: 'is_done',
    meta: {
      label: 'Status',
      filter: {
        type: 'pills',
        options: [
          { value: 'true', label: 'Afgerond' },
          { value: 'false', label: 'Gepland' },
        ],
        allLabel: 'Alle',
      },
    },
    header: 'Status',
    cell: ({ getValue }) => (getValue<boolean>() ? 'Afgerond' : 'Gepland'),
  },
];
