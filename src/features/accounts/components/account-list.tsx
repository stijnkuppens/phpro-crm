'use client';

import { SquarePen, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/admin/avatar';
import DataTable from '@/components/admin/data-table';
import { buildFilterQuery, type FilterOption } from '@/components/admin/data-table-filters';
import { StatusBadge } from '@/components/admin/status-badge';
import { useEntity } from '@/lib/hooks/use-entity';
import { deleteAccount } from '../actions/delete-account';
import { accountColumns } from '../columns';
import { ACCOUNT_TYPE_STYLES, type AccountListItem } from '../types';

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
      return;
    }
    load();
  }, [load]);

  const handleFilterChange = useCallback((newFilters: Record<string, string | undefined>) => {
    setFilters(newFilters);
    setPage(1);
  }, [setPage]);

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
          {
            icon: SquarePen,
            label: 'Bewerken',
            onClick: () => router.push(`/admin/accounts/${row.id}/edit`),
          },
          {
            icon: Trash2,
            label: 'Verwijderen',
            variant: 'destructive' as const,
            confirm: {
              title: 'Account verwijderen?',
              description: 'Dit verwijdert het account en alle gekoppelde gegevens.',
            },
            onClick: () => handleDelete(row.id),
          },
        ]}
        renderMobileCard={(row: AccountListItem) => {
          const initials = row.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <Avatar path={row.logo_url} fallback={initials} round={false} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{row.name}</div>
                {row.domain && <div className="text-xs text-muted-foreground">{row.domain}</div>}
                {row.owner?.full_name && (
                  <div className="text-xs text-muted-foreground">{row.owner.full_name}</div>
                )}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <StatusBadge colorMap={ACCOUNT_TYPE_STYLES} value={row.type}>
                    {row.type}
                  </StatusBadge>
                  <StatusBadge positive={row.status === 'Actief'}>{row.status}</StatusBadge>
                </div>
              </div>
            </div>
          );
        }}
        bulkActions={[
          {
            label: 'Verwijderen',
            variant: 'destructive' as const,
            confirm: {
              title: 'Accounts verwijderen?',
              description: 'Dit verwijdert de geselecteerde accounts permanent.',
            },
            action: async (ids) => {
              const results = await Promise.allSettled(ids.map((id) => deleteAccount(id)));
              const failed = results.filter(
                (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success),
              );
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
