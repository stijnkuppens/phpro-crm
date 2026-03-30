---
name: add-data-table-page
description: Create an admin list page with DataTable, search, pagination, bulk actions, and row actions. Use this skill whenever the user wants a data grid, table view, list page, or any paginated CRUD listing in the admin panel.
type: skill
---

# Add Data Table Page

Creates an admin list page with the project's DataTable component, including server-first data flow, declarative column definitions with filter meta, row actions, and bulk actions.

## Three Files Required

### 1. Column Definitions — `src/features/{{plural}}/columns.tsx`

Declarative column array (not a factory function). Filter configuration lives in column `meta`:

```tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Avatar } from '@/components/admin/avatar';
import { StatusBadge } from '@/components/admin/status-badge';
import type { {{Singular}}ListItem } from './types';
import { {{SINGULAR}}_TYPE_STYLES } from './types';

export const {{singular}}Columns: ColumnDef<{{Singular}}ListItem>[] = [
  {
    accessorKey: 'name',
    id: 'name',
    meta: {
      label: 'Naam',
      filter: { type: 'search', placeholder: 'Zoek {{plural}}...' },
    },
    header: 'Naam',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar path={row.original.avatar_path} fallback={row.original.name?.[0] ?? '?'} size="xs" />
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    id: 'type',
    meta: {
      label: 'Type',
      filter: {
        type: 'pills',
        options: [
          { value: 'Klant', label: 'Klant' },
          { value: 'Prospect', label: 'Prospect' },
          { value: 'Partner', label: 'Partner' },
        ],
        allLabel: 'Alle',
      },
    },
    header: 'Type',
    cell: ({ row }) => (
      <StatusBadge colorMap={ {{SINGULAR}}_TYPE_STYLES} value={row.original.type}>
        {row.original.type}
      </StatusBadge>
    ),
  },
  {
    accessorKey: 'status',
    id: 'status',
    meta: { label: 'Status' },
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge positive={row.original.status === 'Actief'}>
        {row.original.status}
      </StatusBadge>
    ),
  },
];
```

### Column filter meta types:

| Filter type | Meta config | Renders as |
|-------------|-------------|------------|
| Search | `{ type: 'search', placeholder: '...' }` | Text input |
| Pills | `{ type: 'pills', options: [...], allLabel: 'Alle' }` | Exclusive pill row below search |
| Select | `{ type: 'select', options: [...], placeholder: '...' }` | Dropdown |

**Rules:**
- Columns file is `columns.tsx` (not `.ts`) — cells render JSX
- Export a `const` array, not a factory function
- Every status-like value MUST use `StatusBadge`
- Every DataTable must have at minimum a search filter and pills for the primary category

### 2. List Component — `src/features/{{plural}}/components/{{singular}}-list.tsx`

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ListPageToolbar } from '@/components/admin/list-page-toolbar';
import DataTable from '@/components/admin/data-table';
import { useEntity } from '@/lib/hooks/use-entity';
import { buildFilterQuery } from '@/components/admin/data-table-filters';
import { {{singular}}Columns } from '../columns';
import { delete{{Singular}} } from '../actions/delete-{{singular}}';
import type { {{Singular}}ListItem } from '../types';
import { escapeSearch } from '@/lib/utils/escape-search';
import dynamic from 'next/dynamic';

const {{Singular}}FormModal = dynamic(
  () => import('./{{singular}}-form-modal').then((m) => ({ default: m.{{Singular}}FormModal })),
);

type Props = {
  initialData: {{Singular}}ListItem[];
  initialCount: number;
};

const PAGE_SIZE = 25;

export function {{Singular}}List({ initialData, initialCount }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, total, fetchList, refreshing } = useEntity<{{Singular}}ListItem>({
    table: '{{table}}',
    pageSize: PAGE_SIZE,
    initialData,
    initialCount,
  });

  const load = useCallback(() => {
    const { orFilter, eqFilters } = buildFilterQuery({{singular}}Columns, filters);
    fetchList({
      page,
      sort: { column: 'name', direction: 'asc' },
      orFilter: orFilter || undefined,
      eqFilters,
    });
  }, [fetchList, page, filters]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    load();
  }, [load]);

  useEffect(() => { setPage(1); }, [filters]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await delete{{Singular}}(id);
    if (result.success) {
      toast.success('{{Singular}} verwijderd');
      load();
      router.refresh();
    } else {
      toast.error(typeof result.error === 'string' ? result.error : 'Er is een fout opgetreden');
    }
  }, [load, router]);

  return (
    <>
      <div className="space-y-6">
        <ListPageToolbar
          actions={
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus /> Nieuw
            </Button>
          }
        />

        <DataTable
          tableId="{{plural}}"
          columns={ {{singular}}Columns}
          data={data}
          filters={filters}
          onFilterChange={setFilters}
          refreshing={refreshing}
          pagination={{ page, pageSize: PAGE_SIZE, total }}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/admin/{{plural}}/${row.id}`)}
          rowActions={(row) => [
            { icon: Pencil, label: 'Bewerken', onClick: () => setEditId(row.id) },
            {
              icon: Trash2,
              label: 'Verwijderen',
              onClick: () => handleDelete(row.id),
              variant: 'destructive' as const,
              confirm: {
                title: '{{Singular}} verwijderen?',
                description: 'Dit kan niet ongedaan worden gemaakt.',
              },
            },
          ]}
        />
      </div>

      {showNew && (
        <{{Singular}}FormModal
          key="new"
          {{singular}}Id={null}
          open
          onClose={() => setShowNew(false)}
          onSaved={() => { load(); router.refresh(); }}
        />
      )}

      {editId && (
        <{{Singular}}FormModal
          key={editId}
          {{singular}}Id={editId}
          open
          onClose={() => setEditId(null)}
          onSaved={() => { load(); router.refresh(); }}
        />
      )}
    </>
  );
}
```

### 3. Server Page — `src/app/admin/{{plural}}/page.tsx`

```tsx
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { get{{Plural}} } from '@/features/{{plural}}/queries/get-{{plural}}';
import { {{Singular}}List } from '@/features/{{plural}}/components/{{singular}}-list';

export default async function {{Plural}}Page() {
  const { data, count } = await get{{Plural}}();
  return (
    <div className="space-y-6">
      <PageHeader
        title="{{Plural}}"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: '{{Plural}}' },
        ]}
      />
      <{{Singular}}List initialData={data} initialCount={count} />
    </div>
  );
}
```

**Also create `loading.tsx` and `error.tsx`** — see `add-admin-page` skill.

## Key Conventions

### Server-First Data Flow
The page (server component) fetches initial data and passes it to the client list component via `initialData`/`initialCount`. The client component only re-fetches when the user changes page/filters.

### Skip Initial Fetch
```tsx
const isInitialMount = useRef(true);
useEffect(() => {
  if (isInitialMount.current) { isInitialMount.current = false; return; }
  load();
}, [load]);
```
This prevents double-fetching on mount since `initialData` is already loaded by the server.

### DataTable Props (real interface)
- `tableId` — enables column visibility persistence via localStorage
- `columns` — `ColumnDef<T>[]` with filter meta
- `data` — row data array
- `filters` / `onFilterChange` — auto-filter state driven by column meta
- `pagination` — `{ page, pageSize, total }`
- `onPageChange` — page change callback
- `onRowClick` — makes rows clickable
- `rowActions` — `(row: T) => RowAction<T>[]` — per-row icon buttons
- `bulkActions` — `BulkAction[]` — shown when rows are selected
- `loading` / `refreshing` — skeleton vs dim states

### Row Actions (not DropdownMenu)
```tsx
rowActions={(row) => [
  { icon: Pencil, label: 'Bewerken', onClick: () => setEditId(row.id) },
  {
    icon: Trash2,
    label: 'Verwijderen',
    onClick: () => handleDelete(row.id),
    variant: 'destructive',
    confirm: { title: '...?', description: '...' },
  },
]}
```
When `confirm` is set, clicking the action opens a `ConfirmDialog` before `onClick` fires.

### Delete Pattern
Call the server action directly, check `result.success`, show toast:
```tsx
const result = await delete{{Singular}}(id);
if (result.success) {
  toast.success('{{Singular}} verwijderd');
  load();
  router.refresh();
} else {
  toast.error(typeof result.error === 'string' ? result.error : 'Er is een fout opgetreden');
}
```

### Modal Remounting
Always use conditional render + `key` to force clean remount when switching entities:
```tsx
{editId && (
  <{{Singular}}FormModal key={editId} {{singular}}Id={editId} open onClose={() => setEditId(null)} />
)}
```
