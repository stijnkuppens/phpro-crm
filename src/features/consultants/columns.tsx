'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Avatar } from '@/components/admin/avatar';
import { StatusBadge } from '@/components/admin/status-badge';
import type { ConsultantWithDetails, ConsultantStatus } from './types';
import { contractStatusColors, contractStatusDescriptions, CONSULTANT_STATUS_STYLES, CONSULTANT_STATUS_LABELS } from './types';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { getContractStatus, getCurrentRate } from './utils';
import { formatEUR } from '@/lib/format';

const dateFmt = (d: string) => new Date(d).toLocaleDateString('nl-BE');

function calcMaxRevenue(c: ConsultantWithDetails): number | null {
  if (c.status !== 'actief') return null;
  const rate = getCurrentRate(c);
  if (!rate || !c.start_date) return null;
  const end = c.is_indefinite || !c.end_date ? null : new Date(c.end_date);
  // For indefinite: estimate 12 months from now
  const endDate = end ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const start = new Date(c.start_date) > new Date() ? new Date(c.start_date) : new Date();
  const months = Math.max(0, (endDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return Math.round(rate * 8 * 21 * months);
}

export const consultantColumns: ColumnDef<ConsultantWithDetails>[] = [
  {
    id: 'status',
    meta: {
      label: 'Status',
      filter: {
        type: 'select',
        options: [
          { value: 'actief', label: 'Actief' },
          { value: 'bench', label: 'Bench' },
          { value: 'stopgezet', label: 'Stopgezet' },
        ],
        placeholder: 'Alle statussen',
      },
    },
    header: 'Status',
    cell: ({ row }) => {
      const c = row.original;
      if (c.is_archived) {
        return <StatusBadge colorMap={{ Gearchiveerd: 'bg-red-100 text-red-700' }} value="Gearchiveerd">Gearchiveerd</StatusBadge>;
      }
      return <StatusBadge colorMap={CONSULTANT_STATUS_STYLES} value={c.status}>{CONSULTANT_STATUS_LABELS[c.status]}</StatusBadge>;
    },
  },
  {
    id: 'contract_status',
    meta: { label: 'Contract' },
    header: 'Contract',
    cell: ({ row }) => {
      const c = row.original;
      if (c.status !== 'actief' || c.is_archived) return <span className="text-sm text-muted-foreground">—</span>;
      const cs = getContractStatus(c);
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className={`inline-flex w-fit cursor-help items-center rounded-full px-2 py-0.5 text-xs font-medium ${contractStatusColors[cs]}`}>
              {cs}
            </TooltipTrigger>
            <TooltipContent>{contractStatusDescriptions[cs]}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: 'last_name',
    id: 'consultant',
    meta: {
      label: 'Consultant',
      filter: { type: 'search', placeholder: 'Zoek consultant...', searchColumns: ['first_name', 'last_name'] },
    },
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
    meta: { label: 'Rol' },
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
    meta: { label: 'Klant' },
    header: 'Klant',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.account?.name ?? '-'}</span>
    ),
  },
  {
    id: 'rate',
    meta: { label: 'Uurtarief' },
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
    meta: { label: 'Periode' },
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
  {
    id: 'max_revenue',
    meta: { label: 'Max. omzet' },
    header: 'Max. omzet',
    cell: ({ row }) => {
      const revenue = calcMaxRevenue(row.original);
      if (revenue == null) return <span className="text-sm text-muted-foreground">-</span>;
      return <span className="text-sm font-medium text-primary-action">{formatEUR(revenue)}</span>;
    },
  },
];
