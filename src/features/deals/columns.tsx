'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { DealWithRelations } from './types';
import { formatEUR } from '@/lib/format';

const ORIGIN_BADGE: Record<string, { label: string; className: string }> = {
  rechtstreeks: { label: 'Direct', className: 'bg-green-100 text-green-800 border-green-200' },
  cronos: { label: 'Cronos', className: 'bg-blue-100 text-blue-800 border-blue-200' },
};

export const dealColumns: ColumnDef<DealWithRelations>[] = [
  {
    accessorKey: 'title',
    header: 'Titel',
    cell: ({ row }) => {
      const origin = row.original.origin;
      const badge = origin ? ORIGIN_BADGE[origin] : null;
      return (
        <div className="flex items-center gap-2">
          <span>{row.original.title}</span>
          {badge && (
            <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
              {badge.label}
            </Badge>
          )}
        </div>
      );
    },
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
      return formatEUR(n);
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
