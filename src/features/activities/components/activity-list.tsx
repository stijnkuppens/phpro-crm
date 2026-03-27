'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { buildFilterQuery, type FilterOption } from '@/components/admin/data-table-filters';
import { activityColumns } from '../columns';
import type { Activity } from '../types';
import { deleteActivity } from '../actions/delete-activity';

const PAGE_SIZE = 25;

type Props = {
  initialData: Activity[];
  initialCount: number;
  filterOptions?: Record<string, FilterOption[]>;
};

export function ActivityList({ initialData, initialCount, filterOptions }: Props) {
  const { data, total, loading, refreshing, fetchList } = useEntity<Activity>({
    table: 'activities',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const isInitialMount = useRef(true);

  const load = useCallback(() => {
    const { orFilter, eqFilters } = buildFilterQuery(activityColumns, filters);
    fetchList({ page, orFilter, eqFilters });
  }, [fetchList, page, filters]);

  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | undefined>) => {
      setFilters(newFilters);
      setPage(1);
    },
    [],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialData && page === 1) return;
    }
    load();
  }, [load, initialData, page, filters]);

  const handleDelete = async (id: string) => {
    const result = await deleteActivity(id);
    if (result.success) {
      toast.success('Activiteit verwijderd');
      load();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
    }
  };

  return (
    <div className="space-y-4">
      <DataTable
        tableId="activities"
        columns={activityColumns as any}
        data={data}
        filters={filters}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        refreshing={refreshing}
        rowActions={(row) => [
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Activiteit verwijderen?', description: 'Dit verwijdert de activiteit permanent.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Activiteiten verwijderen?', description: 'Dit verwijdert de geselecteerde activiteiten permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
      />
    </div>
  );
}
