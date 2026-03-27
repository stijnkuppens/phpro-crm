'use client';

import { useState, useCallback, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { taskColumns } from '../columns';
import type { Task, TaskFilters } from '../types';
import { deleteTask } from '../actions/delete-task';

const PAGE_SIZE = 25;

type Props = {
  initialData: Task[];
  initialCount: number;
};

export function TaskList({ initialData, initialCount }: Props) {
  const { data, total, loading, refreshing, fetchList } = useEntity<Task>({
    table: 'tasks',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TaskFilters>({});

  const load = useCallback(() => {
    const eqFilters: Record<string, string> = {};
    if (filters.status) eqFilters.status = filters.status;
    if (filters.priority) eqFilters.priority = filters.priority;

    fetchList({
      page,
      eqFilters: Object.keys(eqFilters).length > 0 ? eqFilters : undefined,
    });
  }, [fetchList, page, filters]);

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
    if (initialData && page === 1 && !filters.status && !filters.priority) return;
    load();
  }, [load, initialData, page, filters]);

  return (
    <div className="space-y-4">
      <FilterBar>
        <div className="flex flex-wrap gap-4">
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(v) => setFilters({ ...filters, status: !v || v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.priority ?? 'all'}
            onValueChange={(v) => setFilters({ ...filters, priority: !v || v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Prioriteit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>
      <DataTable
        tableId="tasks"
        columns={taskColumns as any}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
        refreshing={refreshing}
        rowActions={(row) => [
          { icon: Pencil, label: 'Bewerken', onClick: () => { /* TODO: open edit modal when available */ } },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Taak verwijderen?', description: 'Dit verwijdert de taak permanent.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Taken verwijderen?', description: 'Dit verwijdert de geselecteerde taken permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
      />
    </div>
  );
}
