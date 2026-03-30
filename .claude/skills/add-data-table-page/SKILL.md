---
name: add-data-table-page
description: Create an admin list page with DataTable, search, pagination, bulk actions, and row actions. Use this skill whenever the user wants a data grid, table view, list page, or any paginated CRUD listing in the admin panel.
type: skill
---

# Add Data Table Page

Creates an admin list page with the project's DataTable component, including debounced search, pagination, row-level delete with confirmation, and bulk actions.

## Two Files Required

### 1. Column Definitions — `src/features/<feature>/components/<singular>-columns.tsx`

Factory function that receives `onDelete` and `onNavigate` callbacks:

```tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import type { {{Singular}} } from '../types';

export function get{{Singular}}Columns(options: {
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
}): ColumnDef<{{Singular}}>[] {
  return [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
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
            <DropdownMenuItem onClick={() => options.onNavigate(`/admin/{{plural}}/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => options.onNavigate(`/admin/{{plural}}/${row.original.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => options.onDelete(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
```

**IMPORTANT:** `DropdownMenuTrigger` uses `render` prop (Base UI), NOT `asChild` (Radix).

### 2. List Page — `src/app/admin/<plural>/page.tsx`

```tsx
'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ColumnDef } from '@tanstack/react-table';
import { useEntity } from '@/lib/hooks/use-entity';
import { PageHeader } from '@/components/admin/page-header';
import { RoleGuard } from '@/components/admin/role-guard';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { {{Singular}} } from '@/features/{{plural}}/types';
import { get{{Singular}}Columns } from '@/features/{{plural}}/components/{{singular}}-columns';

const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function {{Plural}}Page() {
  const router = useRouter();
  const { data, total, loading, fetchList, remove, bulkDelete } = useEntity<{{Singular}}>({
    table: '{{table}}',
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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

  const confirmDelete = useCallback(
    async () => {
      if (!pendingDeleteId) return;
      const ok = await remove(pendingDeleteId);
      setPendingDeleteId(null);
      if (ok) fetchList({ page });
    },
    [remove, fetchList, page, pendingDeleteId],
  );

  const columns = useMemo(
    () => get{{Singular}}Columns({ onDelete: setPendingDeleteId, onNavigate: router.push }),
    [router.push],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="{{Plural}}"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: '{{Plural}}' }]}
        actions={
          <RoleGuard permission="{{plural}}.write">
            <Link href="/admin/{{plural}}/new">
              <Button>Add {{Singular}}</Button>
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
            confirm: {
              title: 'Delete {{plural}}?',
              description: 'This will permanently delete the selected {{plural}}. This action cannot be undone.',
            },
          },
        ]}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        title="Delete {{singular}}?"
        description="This will permanently delete this {{singular}}. This action cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
```

## Key Conventions

### DataTable Props
- `columns` — cast to `ColumnDef<Record<string, unknown>>[]` when passing
- `data` — the array from `useEntity`
- `searchColumn` — which column to show in the search placeholder
- `pagination` — `{ page, pageSize, total }`
- `onPageChange`, `onSearch` — callbacks
- `loading` — shows skeleton rows
- `bulkActions` — array of `{ label, action, variant?, confirm? }`

### useEntity Hook
`useEntity<T>({ table, pageSize? })` from `@/lib/hooks/use-entity` provides:
- `data: T[]`, `total: number`, `loading: boolean`
- `fetchList({ page?, sort?, search? })` — paginated fetch
- `remove(id)` — single delete, returns boolean
- `bulkDelete(ids)` — multi-delete, returns boolean

### Delete Pattern
Single-row delete uses a `pendingDeleteId` state + controlled `ConfirmDialog`:
1. Column action sets `setPendingDeleteId(row.original.id)`
2. `ConfirmDialog` opens when `pendingDeleteId !== null`
3. On confirm: `remove(id)` then `fetchList` to refresh
4. On cancel: `setPendingDeleteId(null)`

### Search Debouncing
300ms debounce using `useRef<ReturnType<typeof setTimeout>>`:
```ts
const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
const handleSearch = useCallback((query: string) => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setSearch(query);
    setPage(1);  // reset to first page on search
  }, 300);
}, []);
```

### Loading Skeleton
Add `loading.tsx` as a sibling to `page.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
```
