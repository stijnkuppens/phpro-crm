'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ColumnDef } from '@tanstack/react-table';
import { useEntity } from '@/lib/hooks/use-entity';
import { PageHeader } from '@/components/admin/page-header';
import { RoleGuard } from '@/components/admin/role-guard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { Contact } from '@/features/contacts/types';
import { getContactColumns } from '@/features/contacts/components/contact-columns';

const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function ContactsPage() {
  const router = useRouter();
  const { data, total, loading, fetchList, remove, bulkDelete } = useEntity<Contact>({
    table: 'contacts',
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    fetchList({
      page,
      search: search ? { column: 'name', query: search } : undefined,
    });
  }, [page, search, fetchList]);

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await remove(id);
      if (ok) fetchList({ page });
    },
    [remove, fetchList, page],
  );

  const columns = useMemo(
    () => getContactColumns({ onDelete: handleDelete, onNavigate: router.push }),
    [handleDelete, router.push],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Contacts' }]}
        actions={
          <RoleGuard permission="contacts.write">
            <Link href="/admin/contacts/new">
              <Button>Add Contact</Button>
            </Link>
          </RoleGuard>
        }
      />
      <DataTable
        columns={columns as ColumnDef<Record<string, unknown>>[]}
        data={data}
        searchColumn="name"
        pagination={{ page, pageSize: 10, total }}
        onPageChange={setPage}
        onSearch={handleSearch}
        loading={loading}
        bulkActions={[
          {
            label: 'Delete',
            action: async (ids) => {
              const ok = await bulkDelete(ids);
              if (ok) fetchList({ page });
            },
            variant: 'destructive',
          },
        ]}
      />
    </div>
  );
}
