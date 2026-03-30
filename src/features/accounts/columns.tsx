'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Avatar } from '@/components/admin/avatar';
import { StatusBadge } from '@/components/admin/status-badge';
import type { AccountListItem } from './types';
import { ACCOUNT_TYPE_STYLES } from './types';

export const accountColumns: ColumnDef<AccountListItem>[] = [
  {
    accessorKey: 'name',
    id: 'name',
    meta: {
      label: 'Account',
      filter: { type: 'search', placeholder: 'Zoek accounts...', searchColumns: ['name', 'domain'] },
    },
    header: 'Account',
    cell: ({ row }) => {
      const name = row.original.name;
      const domain = row.original.domain;
      const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
      return (
        <div className="flex items-center gap-3">
          <Avatar path={row.original.logo_url} fallback={initials} round={false} />
          <div className="min-w-0">
            <div className="truncate font-medium">{name}</div>
            {domain && <div className="truncate text-xs text-muted-foreground">{domain}</div>}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    id: 'type',
    meta: {
      label: 'Type',
      filter: {
        type: 'pills',
        options: [
          { value: 'Klant', label: 'Klant' },
          { value: 'Prospect', label: 'Prospect' },
          { value: 'Partner', label: 'Partner' },
        ],
        allLabel: 'Alle',
      },
    },
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <StatusBadge colorMap={ACCOUNT_TYPE_STYLES} value={type}>
          {type}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: 'status',
    id: 'status',
    meta: {
      label: 'Status',
      filter: {
        type: 'select',
        options: [
          { value: 'Actief', label: 'Actief' },
          { value: 'Inactief', label: 'Inactief' },
        ],
        placeholder: 'Alle statussen',
      },
    },
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.original.status === 'Actief';
      return <StatusBadge positive={isActive}>{row.original.status}</StatusBadge>;
    },
  },
  {
    id: 'raamcontract',
    meta: {
      label: 'Raamcontract',
      filter: {
        type: 'select',
        options: [
          { value: 'true', label: 'Ja' },
          { value: 'false', label: 'Nee' },
        ],
        filterKey: 'has_framework_contract',
        placeholder: 'Raamcontract',
      },
    },
    header: 'Raamcontract',
    cell: ({ row }) => {
      const has = row.original.has_framework_contract;
      return <StatusBadge positive={has}>{has ? 'Ja' : 'Nee'}</StatusBadge>;
    },
  },
  {
    id: 'sla',
    meta: {
      label: 'SLA',
      filter: {
        type: 'select',
        options: [
          { value: 'true', label: 'Ja' },
          { value: 'false', label: 'Nee' },
        ],
        filterKey: 'has_service_contract',
        placeholder: 'SLA',
      },
    },
    header: 'SLA',
    cell: ({ row }) => {
      const has = row.original.has_service_contract;
      return <StatusBadge positive={has}>{has ? 'Ja' : 'Nee'}</StatusBadge>;
    },
  },
  {
    id: 'consultants',
    meta: { label: 'Consultants' },
    header: 'Consultants',
    cell: ({ row }) => {
      const count = row.original.active_consultant_count;
      return <StatusBadge positive={count > 0}>{count > 0 ? `${count} actief` : 'Geen'}</StatusBadge>;
    },
  },
  {
    id: 'owner',
    meta: {
      label: 'Owner',
      filter: {
        type: 'select',
        filterKey: 'owner_id',
        placeholder: 'Alle owners',
      },
    },
    header: 'Owner',
    cell: ({ row }) => {
      const owner = row.original.owner;
      if (!owner?.full_name) return <span className="text-sm text-muted-foreground">-</span>;
      const initials = owner.full_name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
            {initials}
          </div>
          <span className="text-sm">{owner.full_name}</span>
        </div>
      );
    },
  },
];
