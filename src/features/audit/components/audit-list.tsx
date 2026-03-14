'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { AuditLogTable } from './audit-log-table';
import { AuditFilters } from './audit-filters';
import type { AuditLog, AuditLogFilters } from '../types';

const PAGE_SIZE = 20;

type AuditListProps = {
  initialData?: AuditLog[];
  initialCount?: number;
};

export function AuditList({ initialData, initialCount }: AuditListProps) {
  const { data, total, loading, fetchList } = useEntity<AuditLog>({
    table: 'audit_logs',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({});

  const load = useCallback(() => {
    const eqFilters: Record<string, string> = {};
    if (filters.action) eqFilters.action = filters.action;
    if (filters.entityType) eqFilters.entity_type = filters.entityType;

    fetchList({
      page,
      eqFilters: Object.keys(eqFilters).length > 0 ? eqFilters : undefined,
    });
  }, [fetchList, page, filters]);

  useEffect(() => {
    if (initialData && page === 1 && !filters.action && !filters.entityType) return;
    load();
  }, [load, initialData, page, filters]);

  return (
    <>
      <AuditFilters filters={filters} onFilterChange={setFilters} />
      <AuditLogTable
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </>
  );
}
