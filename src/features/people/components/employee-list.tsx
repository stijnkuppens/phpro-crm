'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { employeeColumns } from '../columns';
import type { Employee } from '../types';

const PAGE_SIZE = 25;

type Props = {
  initialData: Employee[];
  initialCount: number;
};

export function EmployeeList({ initialData, initialCount }: Props) {
  const router = useRouter();
  const { data, total, loading, fetchList } = useEntity<Employee>({
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
      orFilter: search ? `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%` : undefined,
      eqFilters: status !== 'all' ? { status } : undefined,
    });
  }, [fetchList, page, search, status]);

  useEffect(() => {
    // Skip initial load — we have initialData
    if (page === 1 && !search && status === 'all') return;
    load();
  }, [load, page, search, status]);

  const columns = [
    ...employeeColumns,
    {
      id: 'actions',
      cell: ({ row }: { row: { original: Employee } }) => (
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={() => router.push(`/admin/people/${row.original.id}`)}
        >
          Bekijk
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Zoeken op naam..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-64"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
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
      <DataTable
        columns={columns as any}
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
