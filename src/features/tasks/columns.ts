'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { TaskWithRelations } from './types';

export const taskColumns: ColumnDef<TaskWithRelations>[] = [
  {
    accessorKey: 'title',
    id: 'title',
    meta: {
      label: 'Titel',
      filter: { type: 'search', placeholder: 'Zoek taken...' },
    },
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
    meta: {
      label: 'Prioriteit',
      filter: {
        type: 'select',
        options: [
          { value: 'High', label: 'High' },
          { value: 'Medium', label: 'Medium' },
          { value: 'Low', label: 'Low' },
        ],
        placeholder: 'Alle prioriteiten',
      },
    },
    header: 'Prioriteit',
  },
  {
    accessorKey: 'status',
    id: 'status',
    meta: {
      label: 'Status',
      filter: {
        type: 'select',
        options: [
          { value: 'Open', label: 'Open' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Done', label: 'Done' },
        ],
        placeholder: 'Alle statussen',
      },
    },
    header: 'Status',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    meta: {
      label: 'Account',
      filter: { type: 'select', filterKey: 'account_id', placeholder: 'Alle accounts' },
    },
    header: 'Account',
  },
  {
    accessorFn: (row) => row.assignee?.full_name ?? '',
    id: 'assignee',
    meta: {
      label: 'Toegewezen',
      filter: { type: 'select', filterKey: 'assigned_to', placeholder: 'Alle gebruikers' },
    },
    header: 'Toegewezen',
  },
];
