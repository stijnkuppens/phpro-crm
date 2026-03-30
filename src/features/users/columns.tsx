'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { UserWithEmail } from './queries/get-users';

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
    header: 'Name',
    cell: ({ row }) => (
      <Link href={`/admin/users/${row.original.id}`} className="flex items-center gap-3 hover:underline">
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.original.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{getInitials(row.original.full_name)}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{row.original.full_name || 'Unnamed'}</span>
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    id: 'email',
    meta: { label: 'E-mail' },
    header: 'Email',
  },
  {
    accessorKey: 'role',
    id: 'role',
    meta: { label: 'Rol' },
    header: 'Role',
    cell: ({ row }) => (
      <Badge variant={row.original.role === 'admin' ? 'default' : 'secondary'}>{row.original.role}</Badge>
    ),
  },
];
