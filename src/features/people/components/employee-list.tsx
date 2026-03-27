'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { employeeColumns } from '../columns';
import { deleteEmployee } from '../actions/delete-employee';
import type { Employee } from '../types';
import { escapeSearch } from '@/lib/utils/escape-search';

const PAGE_SIZE = 25;

type Props = {
  initialData: Employee[];
  initialCount: number;
};

export function EmployeeList({ initialData, initialCount }: Props) {
  const router = useRouter();
  const { data, total, loading, refreshing, fetchList } = useEntity<Employee>({
    table: 'employees',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  const load = useCallback(() => {
    fetchList({
      page,
      orFilter: search ? `first_name.ilike.%${escapeSearch(search)}%,last_name.ilike.%${escapeSearch(search)}%,email.ilike.%${escapeSearch(search)}%` : undefined,
      eqFilters: status !== 'all' ? { status } : undefined,
    });
  }, [fetchList, page, search, status]);

  useEffect(() => {
    // Skip initial load — we have initialData
    if (page === 1 && !search && status === 'all') return;
    load();
  }, [load, page, search, status]);

  const handleDelete = async (id: string) => {
    const result = await deleteEmployee(id);
    if (result.success) {
      toast.success('Medewerker verwijderd');
      load();
    } else {
      toast.error('Verwijderen mislukt');
    }
  };

  return (
    <div className="space-y-4">
      <FilterBar>
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Zoeken op naam..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-64"
          />
          <Select value={status} onValueChange={(v) => { if (v) { setStatus(v); setPage(1); } }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="actief">Actief</SelectItem>
              <SelectItem value="inactief">Inactief</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>
      <DataTable
        columns={employeeColumns as any}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        rowActions={(row) => [
          { icon: Eye, label: 'Bekijken', onClick: () => router.push(`/admin/people/${row.id}`) },
          { icon: Pencil, label: 'Bewerken', onClick: () => router.push(`/admin/people/${row.id}`) },
          { icon: Trash2, label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Medewerker verwijderen?', description: 'Dit verwijdert de medewerker permanent.' }, onClick: () => handleDelete(row.id) },
        ]}
        bulkActions={[
          { label: 'Verwijderen', variant: 'destructive' as const, confirm: { title: 'Medewerkers verwijderen?', description: 'Dit verwijdert de geselecteerde medewerkers permanent.' }, action: (ids) => ids.forEach((id) => handleDelete(id)) },
        ]}
        loading={loading}
        refreshing={refreshing}
      />
    </div>
  );
}
