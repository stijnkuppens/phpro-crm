'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import DataTable from '@/components/admin/data-table';
import { Input } from '@/components/ui/input';
import { contactColumns } from '../columns';
import type { Contact } from '../types';

const PAGE_SIZE = 25;

type ContactListProps = {
  initialData?: Contact[];
  initialCount?: number;
};

export function ContactList({ initialData, initialCount }: ContactListProps) {
  const { data, total, loading, fetchList } = useEntity<Contact>({
    table: 'contacts',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    const orFilter = search
      ? `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      : undefined;

    fetchList({ page, orFilter });
  }, [fetchList, page, search]);

  useEffect(() => {
    if (initialData && page === 1 && !search) return;
    load();
  }, [load, initialData, page, search]);

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
        data={data}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
