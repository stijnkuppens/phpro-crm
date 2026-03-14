'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { TaskWithRelations } from './types';

export const taskColumns: ColumnDef<TaskWithRelations>[] = [
  {
    accessorKey: 'title',
    header: 'Titel',
  },
  {
    accessorKey: 'due_date',
    header: 'Deadline',
    cell: ({ getValue }) => {
      const d = getValue<string | null>();
      return d ? new Date(d).toLocaleDateString('nl-BE') : '';
    },
  },
  {
    accessorKey: 'priority',
    header: 'Prioriteit',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    header: 'Account',
  },
  {
    accessorFn: (row) => row.assignee?.full_name ?? '',
    id: 'assignee',
    header: 'Toegewezen',
  },
];
