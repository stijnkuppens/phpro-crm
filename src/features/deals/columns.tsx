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
    id: 'title',
    meta: {
      label: 'Titel',
      filter: { type: 'search', placeholder: 'Zoek deals...' },
    },
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
    meta: {
      label: 'Account',
      filter: { type: 'select', filterKey: 'account_id', placeholder: 'Alle accounts' },
    },
    header: 'Account',
  },
  {
    accessorKey: 'amount',
    id: 'amount',
    meta: { label: 'Bedrag' },
    header: 'Bedrag',
    cell: ({ getValue }) => {
      const n = Number(getValue<number>() ?? 0);
      return formatEUR(n);
    },
  },
  {
    accessorFn: (row) => row.stage?.name ?? '',
    id: 'stage',
    meta: {
      label: 'Stage',
      filter: { type: 'select', filterKey: 'stage_id', placeholder: 'Alle stages' },
    },
    header: 'Stage',
  },
  {
    accessorKey: 'probability',
    id: 'probability',
    meta: { label: 'Kans' },
    header: 'Kans',
    cell: ({ getValue }) => `${getValue<number>()}%`,
  },
  {
    accessorKey: 'close_date',
    id: 'close_date',
    meta: { label: 'Close Date' },
    header: 'Close Date',
    cell: ({ getValue }) => {
      const d = getValue<string | null>();
      return d ? new Date(d).toLocaleDateString('nl-BE') : '';
    },
  },
  {
    accessorFn: (row) => row.owner?.full_name ?? '',
    id: 'owner',
    meta: {
      label: 'Owner',
      filter: { type: 'select', filterKey: 'owner_id', placeholder: 'Alle owners' },
    },
    header: 'Owner',
  },
  {
    accessorKey: 'forecast_category',
    id: 'forecast_category',
    meta: {
      label: 'Forecast',
      filter: {
        type: 'select',
        placeholder: 'Alle forecasts',
      },
    },
    header: 'Forecast',
  },
];
