'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { TaskWithRelations } from './types';

export const taskColumns: ColumnDef<TaskWithRelations>[] = [
  {
    accessorKey: 'title',
    id: 'title',
    meta: { label: 'Titel' },
    header: 'Titel',
  },
  {
    accessorKey: 'due_date',
    id: 'due_date',
    meta: { label: 'Deadline' },
    header: 'Deadline',
    cell: ({ getValue }) => {
      const d = getValue<string | null>();
      return d ? new Date(d).toLocaleDateString('nl-BE') : '';
    },
  },
  {
    accessorKey: 'priority',
    id: 'priority',
    meta: { label: 'Prioriteit' },
    header: 'Prioriteit',
  },
  {
    accessorKey: 'status',
    id: 'status',
    meta: { label: 'Status' },
    header: 'Status',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    meta: { label: 'Account' },
    header: 'Account',
  },
  {
    accessorFn: (row) => row.assignee?.full_name ?? '',
    id: 'assignee',
    meta: { label: 'Toegewezen' },
    header: 'Toegewezen',
  },
];
