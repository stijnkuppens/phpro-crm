'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Avatar } from '@/components/admin/avatar';
import { StatusBadge } from '@/components/admin/status-badge';
import { formatDate } from '@/lib/format';
import type { UserWithEmail } from './queries/get-users';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_rep: 'Sales Rep',
  customer_success: 'Customer Success',
  marketing: 'Marketing',
};

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  sales_manager: 'bg-blue-100 text-blue-700',
  sales_rep: 'bg-green-100 text-green-700',
  customer_success: 'bg-orange-100 text-orange-700',
  marketing: 'bg-pink-100 text-pink-700',
};

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export const userColumns: ColumnDef<UserWithEmail>[] = [
  {
    accessorKey: 'full_name',
    id: 'full_name',
    meta: { label: 'Naam' },
    header: 'Naam',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar
          path={row.original.avatar_url || null}
          fallback={getInitials(row.original.full_name)}
          size="sm"
          round
        />
        <span className="font-medium">{row.original.full_name || 'Naamloos'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    id: 'email',
    meta: { label: 'E-mail' },
    header: 'E-mail',
  },
  {
    accessorKey: 'role',
    id: 'role',
    meta: {
      label: 'Rol',
      filter: {
        type: 'pills' as const,
        options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
        allLabel: 'Alle',
      },
    },
    header: 'Rol',
    cell: ({ row }) => (
      <StatusBadge colorMap={ROLE_STYLES} value={row.original.role}>
        {ROLE_LABELS[row.original.role] ?? row.original.role}
      </StatusBadge>
    ),
  },
  {
    accessorKey: 'last_sign_in_at',
    id: 'last_sign_in_at',
    meta: { label: 'Laatste login' },
    header: 'Laatste login',
    cell: ({ row }) =>
      row.original.last_sign_in_at ? (
        formatDate(row.original.last_sign_in_at)
      ) : (
        <span className="text-muted-foreground">Nooit</span>
      ),
  },
];
