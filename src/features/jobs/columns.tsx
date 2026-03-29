'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Job } from './types';
import {
  JOB_STATUS_STYLES,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  ENTITY_LABELS,
  FORMAT_LABELS,
} from './types';

export const jobColumns: ColumnDef<Job>[] = [
  {
    accessorKey: 'type',
    id: 'type',
    meta: { label: 'Type' },
    header: 'Type',
    cell: ({ row }) => JOB_TYPE_LABELS[row.original.type] ?? row.original.type,
  },
  {
    accessorKey: 'entity',
    id: 'entity',
    meta: { label: 'Entiteit' },
    header: 'Entiteit',
    cell: ({ row }) => {
      const entity = row.original.entity;
      return entity ? (ENTITY_LABELS[entity] ?? entity) : '-';
    },
  },
  {
    accessorKey: 'format',
    id: 'format',
    meta: { label: 'Formaat' },
    header: 'Formaat',
    cell: ({ row }) => {
      const format = row.original.format;
      return format ? (FORMAT_LABELS[format] ?? format) : '-';
    },
  },
  {
    accessorKey: 'status',
    id: 'status',
    meta: {
      label: 'Status',
      filter: {
        type: 'pills',
        options: [
          { value: 'pending', label: 'In wachtrij' },
          { value: 'processing', label: 'Bezig' },
          { value: 'completed', label: 'Voltooid' },
          { value: 'failed', label: 'Mislukt' },
        ],
        allLabel: 'Alle',
      },
    },
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      if (status === 'processing') {
        return (
          <div className="flex items-center gap-2">
            <StatusBadge colorMap={JOB_STATUS_STYLES} value={status}>
              {JOB_STATUS_LABELS[status]}
            </StatusBadge>
            <span className="text-xs text-muted-foreground">{row.original.progress}%</span>
          </div>
        );
      }
      return (
        <StatusBadge colorMap={JOB_STATUS_STYLES} value={status}>
          {JOB_STATUS_LABELS[status]}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: 'row_count',
    id: 'row_count',
    meta: { label: 'Rijen' },
    header: 'Rijen',
    cell: ({ row }) => {
      const count = row.original.row_count;
      return count !== null ? count.toLocaleString('nl-BE') : '-';
    },
  },
  {
    accessorKey: 'created_at',
    id: 'created_at',
    meta: { label: 'Aangevraagd' },
    header: 'Aangevraagd',
    cell: ({ row }) =>
      formatDistanceToNow(new Date(row.original.created_at), {
        addSuffix: true,
        locale: nl,
      }),
  },
];
