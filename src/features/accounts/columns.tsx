'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { AccountListItem } from './types';

export const accountColumns: ColumnDef<AccountListItem>[] = [
  {
    accessorKey: 'name',
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{name}</div>
            {domain && (
              <div className="truncate text-xs text-muted-foreground">{domain}</div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type;
      const styles: Record<string, string> = {
        Klant: 'bg-green-100 text-green-700 border-green-200',
        Prospect: 'bg-blue-100 text-blue-700 border-blue-200',
        Partner: 'bg-purple-100 text-purple-700 border-purple-200',
      };
      return (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[type] ?? ''}`}
        >
          {type}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const isActive = status === 'Actief';
      return (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: 'raamcontract',
    header: 'Raamcontract',
    cell: ({ row }) => {
      const has = row.original.has_framework_contract;
      return (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            has
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
        >
          {has ? 'Ja' : 'Nee'}
        </span>
      );
    },
  },
  {
    id: 'sla',
    header: 'SLA',
    cell: ({ row }) => {
      const has = row.original.has_service_contract;
      return (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            has
              ? 'bg-blue-100 text-blue-700 border-blue-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
        >
          {has ? 'Ja' : 'Nee'}
        </span>
      );
    },
  },
  {
    id: 'consultants',
    header: 'Consultants',
    cell: ({ row }) => {
      const count = row.original.active_consultant_count;
      return (
        <span className="text-sm text-muted-foreground">
          {count} actief
        </span>
      );
    },
  },
  {
    id: 'owner',
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
