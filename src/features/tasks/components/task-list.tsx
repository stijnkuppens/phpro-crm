'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { taskColumns } from '../columns';
import type { Task, TaskFilters } from '../types';

const PAGE_SIZE = 25;

type Props = {
  initialData: Task[];
  initialCount: number;
};

export function TaskList({ initialData, initialCount }: Props) {
  const { data, total, loading, fetchList } = useEntity<Task>({
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

  useEffect(() => {
    if (initialData && page === 1 && !filters.status && !filters.priority) return;
    load();
  }, [load, initialData, page, filters]);

  return (
    <div className="space-y-4">
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
      <DataTable
        columns={taskColumns as any}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
