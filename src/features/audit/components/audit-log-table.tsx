'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Info } from 'lucide-react';
import DataTable from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AuditLog } from '../types';
import { AuditDetail } from './audit-detail';

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

type AuditLogTableProps = {
  data: AuditLog[];
  pagination: { page: number; pageSize: number; total: number };
  onPageChange: (page: number) => void;
  loading?: boolean;
  refreshing?: boolean;
  filterBar?: React.ReactNode;
};

export function AuditLogTable({
  data,
  pagination,
  onPageChange,
  loading,
  refreshing,
  filterBar,
}: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'created_at',
      id: 'created_at',
      meta: { label: 'Tijdstip' },
      header: 'Timestamp',
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatTimestamp(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: 'user_id',
      id: 'user_id',
      meta: { label: 'Gebruiker' },
      header: 'User',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.user_id?.slice(0, 8) ?? 'system'}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      id: 'action',
      meta: { label: 'Actie' },
      header: 'Action',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.action}</Badge>
      ),
    },
    {
      accessorKey: 'entity',
      id: 'entity',
      meta: { label: 'Entiteit' },
      header: 'Entity Type',
      cell: ({ row }) => row.original.entity ?? '\u2014',
    },
    {
      accessorKey: 'entity_id',
      id: 'entity_id',
      meta: { label: 'Entiteit ID' },
      header: 'Entity ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.entity_id?.slice(0, 8) ?? '\u2014'}
        </span>
      ),
    },
    {
      id: 'detail',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSelectedLog(row.original)}
        >
          <Info className="h-4 w-4" />
          <span className="sr-only">View details</span>
        </Button>
      ),
      enableSorting: false,
    },
  ];

  return (
    <>
      <DataTable
        tableId="audit-logs"
        filterBar={filterBar}
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={onPageChange}
        loading={loading}
        refreshing={refreshing}
      />
      <AuditDetail
        log={selectedLog}
        open={selectedLog !== null}
        onCloseAction={() => setSelectedLog(null)}
      />
    </>
  );
}
