'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/admin/status-badge';
import type { NotificationListItem } from './types';
import { NOTIFICATION_READ_STYLES } from './types';

export const notificationColumns: ColumnDef<NotificationListItem>[] = [
  {
    accessorKey: 'title',
    id: 'title',
    meta: {
      label: 'Titel',
      filter: {
        type: 'search',
        placeholder: 'Zoek meldingen...',
        searchColumns: ['title', 'message'],
      },
    },
    header: 'Titel',
    cell: ({ row }) => {
      const isUnread = !row.original.read;
      return (
        <div className="min-w-0">
          <div className={`truncate ${isUnread ? 'font-medium' : ''}`}>
            {row.original.title}
          </div>
          {row.original.message && (
            <div className="truncate text-xs text-muted-foreground">
              {row.original.message}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: 'read_status',
    accessorFn: (row) => (row.read ? 'gelezen' : 'ongelezen'),
    meta: {
      label: 'Status',
      filter: {
        type: 'pills',
        options: [
          { value: 'ongelezen', label: 'Ongelezen' },
          { value: 'gelezen', label: 'Gelezen' },
        ],
        allLabel: 'Alle',
        filterKey: 'read_status',
      },
    },
    header: 'Status',
    cell: ({ row }) => {
      const label = row.original.read ? 'gelezen' : 'ongelezen';
      return (
        <StatusBadge colorMap={NOTIFICATION_READ_STYLES} value={label}>
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: 'created_at',
    id: 'created_at',
    meta: { label: 'Datum' },
    header: 'Datum',
    cell: ({ row }) => {
      const date = row.original.created_at;
      if (!date) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString('nl-BE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      );
    },
  },
];
