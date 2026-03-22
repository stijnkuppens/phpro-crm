'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Avatar } from '@/components/admin/avatar';
import type { ConsultantWithDetails, ConsultantStatus } from './types';
import { contractStatusColors } from './types';
import { getContractStatus, getCurrentRate } from './utils';
import { formatEUR } from '@/lib/format';

const dateFmt = (d: string) => new Date(d).toLocaleDateString('nl-BE');

const statusBadgeStyles: Record<ConsultantStatus, string> = {
  bench: 'bg-orange-100 text-orange-700 border-0',
  actief: 'bg-green-100 text-green-700 border-0',
  stopgezet: 'bg-muted text-muted-foreground border-0',
};

const statusLabels: Record<ConsultantStatus, string> = {
  bench: 'Bench',
  actief: 'Actief',
  stopgezet: 'Stopgezet',
};

export const consultantColumns: ColumnDef<ConsultantWithDetails>[] = [
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const c = row.original;
      const status = c.status;
      return (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeStyles[status]}`}>
            {statusLabels[status]}
          </span>
          {status === 'actief' && (
            <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${contractStatusColors[getContractStatus(c)]}`}>
              {getContractStatus(c)}
            </span>
          )}
        </div>
      );
    },
  },
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
          <Avatar fallback={initials} path={c.avatar_path} round />
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
    id: 'role',
    header: 'Rol',
    cell: ({ row }) => {
      const c = row.original;
      if (c.status === 'bench') {
        const firstRole = c.roles?.[0];
        return <span className="text-sm">{firstRole ?? '-'}</span>;
      }
      return <span className="text-sm">{c.role ?? '-'}</span>;
    },
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
      const c = row.original;
      if (c.status === 'bench') {
        const min = c.min_hourly_rate;
        const max = c.max_hourly_rate;
        if (min != null && max != null) {
          return (
            <span className="text-sm font-medium">
              {formatEUR(min)}&ndash;{formatEUR(max)}/u
            </span>
          );
        }
        if (min != null) return <span className="text-sm font-medium">vanaf {formatEUR(min)}/u</span>;
        if (max != null) return <span className="text-sm font-medium">tot {formatEUR(max)}/u</span>;
        return <span className="text-sm text-muted-foreground">-</span>;
      }
      const rate = getCurrentRate(c);
      return (
        <span className="text-sm font-medium">
          {formatEUR(rate)}/u
        </span>
      );
    },
  },
  {
    id: 'period',
    header: 'Periode',
    cell: ({ row }) => {
      const c = row.original;
      if (c.status === 'bench') {
        return (
          <span className="text-sm text-muted-foreground">
            {c.available_date ? `Beschikbaar vanaf ${dateFmt(c.available_date)}` : 'Beschikbaar'}
          </span>
        );
      }
      const start = c.start_date ? dateFmt(c.start_date) : '';
      const end = c.is_indefinite || !c.end_date ? 'onbepaald' : dateFmt(c.end_date);
      return (
        <span className="text-sm text-muted-foreground">
          {start} &rarr; {end}
        </span>
      );
    },
  },
];
