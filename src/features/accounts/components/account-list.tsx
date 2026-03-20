'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { AccountFiltersBar } from './account-filters';
import { accountColumns } from '../columns';
import type { Account, AccountFilters } from '../types';

const PAGE_SIZE = 25;

type AccountListProps = {
  initialData?: Account[];
  initialCount?: number;
};

export function AccountList({ initialData, initialCount }: AccountListProps) {
  const router = useRouter();
  const { data, total, loading, fetchList } = useEntity<Account>({
    table: 'accounts',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AccountFilters>({});

  const load = useCallback(() => {
    const orFilter = filters.search
      ? `name.ilike.%${filters.search}%,domain.ilike.%${filters.search}%`
      : undefined;
    const eqFilters: Record<string, string> = {};
    if (filters.type) eqFilters.type = filters.type;
    if (filters.status) eqFilters.status = filters.status;
    if (filters.owner_id) eqFilters.owner_id = filters.owner_id;
    if (filters.country) eqFilters.country = filters.country;

    fetchList({
      page,
      orFilter,
      eqFilters: Object.keys(eqFilters).length > 0 ? eqFilters : undefined,
    });
  }, [fetchList, page, filters]);

  useEffect(() => {
    // Skip initial fetch when server provided data and no filters/pagination change
    if (initialData && page === 1 && !filters.search && !filters.type && !filters.status && !filters.owner_id && !filters.country) return;
    load();
  }, [load, initialData, page, filters]);

  return (
    <div className="space-y-4">
      <AccountFiltersBar filters={filters} onFilterChange={setFilters} />
      <DataTable
        columns={accountColumns}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
