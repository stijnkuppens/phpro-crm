'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SquarePen, Trash2 } from 'lucide-react';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { buildFilterQuery, type FilterOption } from '@/components/admin/data-table-filters';
import { accountColumns } from '../columns';
import { deleteAccount } from '../actions/delete-account';
import type { AccountListItem } from '../types';

const PAGE_SIZE = 25;

type AccountListProps = {
  initialData?: AccountListItem[];
  initialCount?: number;
  filterOptions?: Record<string, FilterOption[]>;
};

export function AccountList({ initialData, initialCount, filterOptions }: AccountListProps) {
  const router = useRouter();
  const { data, total, loading, refreshing, fetchList } = useEntity<AccountListItem>({
    table: 'accounts',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const isInitialMount = useRef(true);

  const load = useCallback(() => {
    const { orFilter, eqFilters } = buildFilterQuery(accountColumns, filters);
    fetchList({ page, orFilter, eqFilters });
  }, [fetchList, page, filters]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialData && page === 1) return;
    }
    load();
  }, [load, initialData, page, filters]);

  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | undefined>) => {
      setFilters(newFilters);
      setPage(1);
    },
    [],
  );

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
      <DataTable
        tableId="accounts"
        columns={accountColumns}
        data={data}
        filters={filters}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        onRowClick={(row) => router.push(`/admin/accounts/${row.id}`)}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        refreshing={refreshing}
        rowActions={(row) => [
          { icon: SquarePen, label: 'Bewerken', onClick: () => router.push(`/admin/accounts/${row.id}/edit`) },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Account verwijderen?', description: 'Dit verwijdert het account en alle gekoppelde gegevens.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          {
            label: 'Verwijderen',
            variant: 'destructive' as const,
            confirm: { title: 'Accounts verwijderen?', description: 'Dit verwijdert de geselecteerde accounts permanent.' },
            action: async (ids) => {
              const results = await Promise.allSettled(ids.map((id) => deleteAccount(id)));
              const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
              if (failed.length === 0) {
                toast.success(`${ids.length} account(s) verwijderd`);
              } else if (failed.length < ids.length) {
                toast.warning(`${ids.length - failed.length} verwijderd, ${failed.length} mislukt`);
              } else {
                toast.error('Verwijderen mislukt');
              }
              load();
            },
          },
        ]}
      />
    </div>
  );
}
