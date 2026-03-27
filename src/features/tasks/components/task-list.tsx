'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SquarePen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { buildFilterQuery, type FilterOption } from '@/components/admin/data-table-filters';
import { taskColumns } from '../columns';
import type { Task } from '../types';
import { deleteTask } from '../actions/delete-task';

const PAGE_SIZE = 25;

type Props = {
  initialData: Task[];
  initialCount: number;
  filterOptions?: Record<string, FilterOption[]>;
};

export function TaskList({ initialData, initialCount, filterOptions }: Props) {
  const { data, total, loading, refreshing, fetchList } = useEntity<Task>({
    table: 'tasks',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const isInitialMount = useRef(true);

  const load = useCallback(() => {
    const { orFilter, eqFilters } = buildFilterQuery(taskColumns, filters);
    fetchList({ page, orFilter, eqFilters });
  }, [fetchList, page, filters]);

  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | undefined>) => {
      setFilters(newFilters);
      setPage(1);
    },
    [],
  );

  const handleDelete = async (id: string) => {
    const result = await deleteTask(id);
    if (result.success) {
      toast.success('Taak verwijderd');
      load();
    } else {
      toast.error('Verwijderen mislukt');
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialData && page === 1) return;
    }
    load();
  }, [load, initialData, page, filters]);

  return (
    <div className="space-y-4">
      <DataTable
        tableId="tasks"
        columns={taskColumns as any}
        data={data}
        filters={filters}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        refreshing={refreshing}
        rowActions={(row) => [
          { icon: SquarePen, label: 'Bewerken', onClick: () => { /* TODO: open edit modal when available */ } },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Taak verwijderen?', description: 'Dit verwijdert de taak permanent.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Taken verwijderen?', description: 'Dit verwijdert de geselecteerde taken permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
      />
    </div>
  );
}
