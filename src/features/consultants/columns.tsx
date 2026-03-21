'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Avatar } from '@/components/admin/avatar';
import type { ActiveConsultantWithDetails } from './types';
import { getContractStatus, getCurrentRate, contractStatusColors } from './types';

const rateFmt = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const dateFmt = (d: string) => new Date(d).toLocaleDateString('nl-BE');

export const consultantColumns: ColumnDef<ActiveConsultantWithDetails>[] = [
  {
    accessorKey: 'last_name',
    header: 'Consultant',
    cell: ({ row }) => {
      const c = row.original;
      const name = `${c.first_name} ${c.last_name}`;
      const initials = [c.first_name, c.last_name]
        .map((w) => w?.[0]?.toUpperCase() ?? '')
        .join('');
      return (
        <div className="flex items-center gap-3">
          <Avatar fallback={initials} round />
          <div className="min-w-0">
            <div className="truncate font-medium">{name}</div>
            {c.city && (
              <div className="truncate text-xs text-muted-foreground">{c.city}</div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    header: 'Rol',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.role ?? '-'}</span>
    ),
  },
  {
    id: 'account',
    header: 'Klant',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.account?.name ?? '-'}</span>
    ),
  },
  {
    id: 'rate',
    header: 'Uurtarief',
    cell: ({ row }) => {
      const rate = getCurrentRate(row.original);
      return (
        <span className="text-sm font-medium">
          {rateFmt.format(rate)}/u
        </span>
      );
    },
  },
  {
    id: 'period',
    header: 'Periode',
    cell: ({ row }) => {
      const c = row.original;
      const start = c.start_date ? dateFmt(c.start_date) : '';
      const end = c.is_indefinite || !c.end_date ? 'onbepaald' : dateFmt(c.end_date);
      return (
        <span className="text-sm text-muted-foreground">
          {start} &rarr; {end}
        </span>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = getContractStatus(row.original);
      return (
        <span className={`inline-flex items-center rounded-full border-0 px-2 py-0.5 text-xs font-medium ${contractStatusColors[status]}`}>
          {status}
        </span>
      );
    },
  },
];
