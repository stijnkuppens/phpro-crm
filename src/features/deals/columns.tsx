'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { DealWithRelations } from './types';
import { formatEUR } from '@/lib/format';
import { Avatar } from '@/components/admin/avatar';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const ORIGIN_LABEL: Record<string, string> = {
  rechtstreeks: 'Direct',
  cronos: 'Cronos',
};

export const dealColumns: ColumnDef<DealWithRelations>[] = [
  {
    accessorKey: 'title',
    id: 'title',
    meta: {
      label: 'Titel',
      filter: { type: 'search', placeholder: 'Zoek op titel of account...' },
    },
    header: 'Titel',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    meta: {
      label: 'Account',
    },
    header: 'Account',
  },
  {
    accessorFn: (row) => row.pipeline?.name ?? '',
    id: 'pipeline_id',
    meta: {
      label: 'Type',
      filter: { type: 'pills', filterKey: 'pipeline_id', allLabel: 'Alle' },
    },
    header: 'Type',
  },
  {
    accessorFn: (row) => row.origin ?? '',
    id: 'origin',
    meta: {
      label: 'Herkomst',
      filter: { type: 'select', filterKey: 'origin', placeholder: 'Alle herkomst' },
    },
    header: 'Herkomst',
    cell: ({ row }) => {
      const origin = row.original.origin;
      return origin ? ORIGIN_LABEL[origin] ?? origin : <span className="text-muted-foreground">–</span>;
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
    cell: ({ row }) => {
      const stage = row.original.stage;
      if (!stage) return '';
      return (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: stage.color || '#9ca3af' }}
          />
          <span>{stage.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'amount',
    id: 'amount',
    meta: { label: 'Bedrag' },
    header: 'Bedrag',
    cell: ({ getValue }) => {
      const n = Number(getValue<number>() ?? 0);
      return n ? <span className="font-medium">{formatEUR(n)}</span> : <span className="text-muted-foreground">–</span>;
    },
  },
  {
    accessorKey: 'close_date',
    id: 'close_date',
    meta: { label: 'Sluitdatum' },
    header: 'Sluitdatum',
    cell: ({ getValue }) => {
      const d = getValue<string | null>();
      return d ? new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    },
  },
  {
    accessorKey: 'probability',
    id: 'probability',
    meta: { label: 'Kans%' },
    header: 'Kans%',
    cell: ({ getValue }) => `${getValue<number>()}%`,
  },
  {
    accessorKey: 'lead_source',
    id: 'lead_source',
    meta: {
      label: 'Lead Bron',
      filter: { type: 'select', placeholder: 'Alle lead bronnen' },
    },
    header: 'Lead Bron',
    cell: ({ getValue }) => {
      const v = getValue<string | null>();
      return v || <span className="text-muted-foreground">–</span>;
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
    cell: ({ row }) => {
      const name = row.original.owner?.full_name;
      if (!name) return '';
      const initials = getInitials(name);
      return (
        <div className="flex items-center gap-2">
          <Avatar fallback={initials} size="xs" />
          <span>{name}</span>
        </div>
      );
    },
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
