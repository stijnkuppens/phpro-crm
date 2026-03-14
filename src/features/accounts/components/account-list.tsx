'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEntity } from '@/lib/hooks/use-entity';
import { DataTable } from '@/components/admin/data-table';
import { AccountFiltersBar } from './account-filters';
import { accountColumns } from '../columns';
import type { Account, AccountFilters } from '../types';

const PAGE_SIZE = 25;

export function AccountList() {
  const router = useRouter();
  const { data, total, loading, fetchList } = useEntity<Account>({
    table: 'accounts',
    pageSize: PAGE_SIZE,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AccountFilters>({});

  const load = useCallback(() => {
    fetchList({ page });
  }, [fetchList, page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = data.filter((a) => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!a.name.toLowerCase().includes(s) && !(a.domain ?? '').toLowerCase().includes(s)) return false;
    }
    if (filters.type && a.type !== filters.type) return false;
    if (filters.status && a.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <AccountFiltersBar filters={filters} onFilterChange={setFilters} />
      <DataTable
        columns={accountColumns}
        data={filtered}
        onRowClick={(row) => router.push(`/admin/accounts/${row.id}`)}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
