'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import type { AuditLog, AuditLogFilters } from '../types';
import { AuditFilters } from './audit-filters';
import { AuditLogTable } from './audit-log-table';

const PAGE_SIZE = 20;

type AuditListProps = {
  initialData?: AuditLog[];
  initialCount?: number;
};

export function AuditList({ initialData, initialCount }: AuditListProps) {
  const { data, total, loading, refreshing, fetchList } = useEntity<AuditLog>({
    table: 'audit_logs',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const isInitialMount = useRef(true);

  const load = useCallback(() => {
    const eqFilters: Record<string, string> = {};
    if (filters.action) eqFilters.action = filters.action;
    if (filters.entityType) eqFilters.entity = filters.entityType;

    fetchList({
      page,
      eqFilters: Object.keys(eqFilters).length > 0 ? eqFilters : undefined,
    });
  }, [fetchList, page, filters]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialData && page === 1) return;
    }
    load();
  }, [load, initialData, page]);

  return (
    <div className="space-y-4">
      <AuditLogTable
        filterBar={<AuditFilters filters={filters} onFilterChange={setFilters} />}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        refreshing={refreshing}
      />
    </div>
  );
}
