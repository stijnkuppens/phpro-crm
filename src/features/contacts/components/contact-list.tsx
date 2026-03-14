'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { DataTable } from '@/components/admin/data-table';
import { Input } from '@/components/ui/input';
import { contactColumns } from '../columns';
import type { Contact } from '../types';

const PAGE_SIZE = 25;

export function ContactList() {
  const { data, total, loading, fetchList } = useEntity<Contact>({
    table: 'contacts',
    pageSize: PAGE_SIZE,
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    fetchList({ page });
  }, [fetchList, page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = data.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(s) ||
      c.last_name.toLowerCase().includes(s) ||
      (c.email ?? '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Zoeken op naam of e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64"
      />
      <DataTable
        columns={contactColumns as any}
        data={filtered}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
