'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { AccountFiltersBar, type OwnerOption } from './account-filters';
import { accountColumns } from '../columns';
import { deleteAccount } from '../actions/delete-account';
import { escapeSearch } from '@/lib/utils/escape-search';
import type { Account, AccountFilters } from '../types';

const PAGE_SIZE = 25;

type AccountListProps = {
  initialData?: Account[];
  initialCount?: number;
  owners?: OwnerOption[];
  countries?: string[];
};

export function AccountList({ initialData, initialCount, owners, countries }: AccountListProps) {
  const router = useRouter();
  const { data, total, loading, refreshing, fetchList } = useEntity<Account>({
    table: 'accounts',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AccountFilters>({});

  const load = useCallback(() => {
    const orFilter = filters.search
      ? `name.ilike.%${escapeSearch(filters.search)}%,domain.ilike.%${escapeSearch(filters.search)}%`
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

  const handleDelete = async (id: string) => {
    const result = await deleteAccount(id);
    if (result.success) {
      toast.success('Account verwijderd');
      load();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Verwijderen mislukt');
    }
  };

  return (
    <div className="space-y-4">
      <FilterBar>
        <AccountFiltersBar filters={filters} onFilterChange={setFilters} owners={owners} countries={countries} />
      </FilterBar>
      <DataTable
        tableId="accounts"
        columns={accountColumns}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        refreshing={refreshing}
        rowActions={(row) => [
          { icon: Eye, label: 'Bekijken', onClick: () => router.push(`/admin/accounts/${row.id}`) },
          { icon: Pencil, label: 'Bewerken', onClick: () => router.push(`/admin/accounts/${row.id}/edit`) },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Account verwijderen?', description: 'Dit verwijdert het account en alle gekoppelde gegevens.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Accounts verwijderen?', description: 'Dit verwijdert de geselecteerde accounts permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
      />
    </div>
  );
}
