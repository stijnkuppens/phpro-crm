'use client';

import { useState, useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { activityColumns } from '../columns';
import { escapeSearch } from '@/lib/utils/escape-search';
import type { Activity, ActivityFilters } from '../types';
import { deleteActivity } from '../actions/delete-activity';

const PAGE_SIZE = 25;

type Props = {
  initialData: Activity[];
  initialCount: number;
};

export function ActivityList({ initialData, initialCount }: Props) {
  const { data, total, loading, refreshing, fetchList } = useEntity<Activity>({
    table: 'activities',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ActivityFilters>({});

  const load = useCallback(() => {
    const orFilter = filters.search
      ? `subject.ilike.%${escapeSearch(filters.search)}%`
      : undefined;
    const eqFilters: Record<string, string> = {};
    if (filters.type) eqFilters.type = filters.type;

    fetchList({
      page,
      orFilter,
      eqFilters: Object.keys(eqFilters).length > 0 ? eqFilters : undefined,
    });
  }, [fetchList, page, filters]);

  useEffect(() => {
    if (initialData && page === 1 && !filters.search && !filters.type) return;
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
      <FilterBar>
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Zoeken..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-64"
          />
          <Select
            value={filters.type ?? 'all'}
            onValueChange={(v) => setFilters({ ...filters, type: !v || v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="Meeting">Meeting</SelectItem>
              <SelectItem value="Demo">Demo</SelectItem>
              <SelectItem value="Call">Call</SelectItem>
              <SelectItem value="E-mail">E-mail</SelectItem>
              <SelectItem value="Lunch">Lunch</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>
      <DataTable
        columns={activityColumns as any}
        data={data}
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
