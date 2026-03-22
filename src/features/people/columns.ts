'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Employee } from './types';
import { formatEUR } from '@/lib/format';

export const employeeColumns: ColumnDef<Employee>[] = [
  {
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    id: 'name',
    header: 'Naam',
  },
  { accessorKey: 'job_title', header: 'Functie' },
  { accessorKey: 'department', header: 'Afdeling' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'email', header: 'E-mail' },
  {
    accessorKey: 'hire_date',
    header: 'In dienst',
    cell: ({ getValue }) => {
      const d = getValue<string | null>();
      return d ? new Date(d).toLocaleDateString('nl-BE') : '';
    },
  },
  {
    accessorKey: 'gross_salary',
    header: 'Brutoloon',
    cell: ({ getValue }) => {
      const n = Number(getValue<number | null>() ?? 0);
      return n > 0
        ? formatEUR(n)
        : '';
    },
  },
];
