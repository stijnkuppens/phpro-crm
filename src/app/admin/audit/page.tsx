'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/admin/page-header';
import { useEntity } from '@/lib/hooks/use-entity';
import { AuditLogTable } from '@/features/audit/components/audit-log-table';
import { AuditFilters } from '@/features/audit/components/audit-filters';
import type { AuditLog, AuditLogFilters } from '@/features/audit/types';

const PAGE_SIZE = 20;

export default function AuditPage() {
  const { data, total, loading, fetchList } = useEntity<AuditLog>({
    table: 'audit_logs',
    pageSize: PAGE_SIZE,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({});

  const load = useCallback(() => {
    fetchList({ page });
  }, [fetchList, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side filtering for action and entity_type since useEntity
  // doesn't support arbitrary column filters. For production, consider
  // a dedicated server query with getAuditLogs.
  const filtered = data.filter((log) => {
    if (filters.action && log.action !== filters.action) return false;
    if (filters.entityType && log.entity_type !== filters.entityType) return false;
    if (filters.dateFrom && log.created_at < filters.dateFrom) return false;
    if (filters.dateTo && log.created_at > filters.dateTo + 'T23:59:59') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Audit Log' },
        ]}
      />

      <AuditFilters filters={filters} onFilterChange={setFilters} />

      <AuditLogTable
        data={filtered}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
