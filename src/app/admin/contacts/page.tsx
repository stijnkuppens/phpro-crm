'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ColumnDef } from '@tanstack/react-table';
import { useEntity } from '@/lib/hooks/use-entity';
import { PageHeader } from '@/components/admin/page-header';
import { RoleGuard } from '@/components/admin/role-guard';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Database } from '@/types/database';

// Lazy-load DataTable (bundle-dynamic-imports best practice)
const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  loading: () => <Skeleton className="h-96 w-full" />,
});

type Contact = Database['public']['Tables']['contacts']['Row'];

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

  const columns: ColumnDef<Contact>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'company', header: 'Company' },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/admin/contacts/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/contacts/${row.original.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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
