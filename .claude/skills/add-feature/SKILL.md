---
name: add-feature
description: Scaffold a complete feature slice with types, queries, actions, form, columns, and admin pages. Use this skill whenever the user wants to add a new entity, resource, or CRUD feature to the admin panel — even if they just say "add products" or "I need a tasks page".
type: skill
---

# Add Feature

Scaffolds a complete feature slice following the project's established patterns. This creates ~10 files across `src/features/<name>/` and `src/app/admin/<plural>/`.

## Gather Requirements

Before writing code, clarify:
1. **Entity name** (singular + plural, e.g., "product" / "products")
2. **Table name** (usually the plural, snake_case)
3. **Fields** — name, type, required?, and which are searchable/displayed in the table
4. **Permissions** — who can read/write/delete? (default: viewers read, editors write, admins delete)

## File Structure

Create these files in order:

```
src/features/<plural>/
  types.ts
  queries/get-<plural>.ts
  queries/get-<singular>.ts
  actions/create-<singular>.ts
  actions/update-<singular>.ts
  actions/delete-<singular>.ts
  components/<singular>-form.tsx
  components/<singular>-columns.tsx

src/app/admin/<plural>/
  page.tsx
  loading.tsx
  new/page.tsx
  [id]/page.tsx
  [id]/edit/page.tsx
```

## Exact Patterns

### types.ts

```ts
import type { Database } from '@/types/database';
import { z } from 'zod';

export type {{Singular}} = Database['public']['Tables']['{{table}}']['Row'];
export type {{Singular}}Insert = Database['public']['Tables']['{{table}}']['Insert'];

export const {{singular}}Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  // add fields — use .optional() for non-required, .or(z.literal('')) for optional emails
});

export type {{Singular}}FormValues = z.infer<typeof {{singular}}Schema>;
```

### queries/get-{{plural}}.ts

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { {{Singular}} } from '../types';

export const get{{Plural}} = cache(
  async (params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const { page = 1, pageSize = 10, search } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = await createServerClient();

    let query = supabase
      .from('{{table}}')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return { data: (data ?? []) as {{Singular}}[], count: count ?? 0 };
  },
);
```

### queries/get-{{singular}}.ts

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { {{Singular}} } from '../types';

export const get{{Singular}} = cache(async (id: string): Promise<{{Singular}} | null> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('{{table}}')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  return data as {{Singular}};
});
```

### actions/create-{{singular}}.ts

```ts
'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { {{singular}}Schema } from '../types';
import { logAction } from '@/features/audit/actions/log-action';

export async function create{{Singular}}(values: unknown) {
  const { userId } = await requirePermission('{{plural}}.write');
  const parsed = {{singular}}Schema.parse(values);
  const supabase = await createServerClient();

  const { data, error } = await supabase.from('{{table}}').insert({
    ...parsed,
    created_by: userId,
  }).select('id').single();

  if (error) throw new Error(error.message);

  await logAction({
    action: '{{singular}}.created',
    entityType: '{{singular}}',
    entityId: data.id,
    metadata: { name: parsed.name },
  });
}
```

### actions/update-{{singular}}.ts

```ts
'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { {{singular}}Schema } from '../types';
import { logAction } from '@/features/audit/actions/log-action';

export async function update{{Singular}}(id: string, values: unknown) {
  await requirePermission('{{plural}}.write');
  const parsed = {{singular}}Schema.parse(values);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('{{table}}')
    .update(parsed)
    .eq('id', id);

  if (error) throw new Error(error.message);

  await logAction({
    action: '{{singular}}.updated',
    entityType: '{{singular}}',
    entityId: id,
    metadata: { name: parsed.name },
  });
}
```

### actions/delete-{{singular}}.ts

```ts
'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { logAction } from '@/features/audit/actions/log-action';

export async function delete{{Singular}}(id: string) {
  await requirePermission('{{plural}}.delete');
  const supabase = await createServerClient();

  const { error } = await supabase.from('{{table}}').delete().eq('id', id);

  if (error) throw new Error(error.message);

  await logAction({
    action: '{{singular}}.deleted',
    entityType: '{{singular}}',
    entityId: id,
  });
}
```

### components/{{singular}}-form.tsx

```tsx
'use client';

import dynamic from 'next/dynamic';
import type { FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { {{singular}}Schema, type {{Singular}}FormValues } from '../types';

const EntityForm = dynamic(() => import('@/components/admin/entity-form'), {
  loading: () => <Skeleton className="h-64 w-full" />,
});

type {{Singular}}FormProps = {
  defaultValues?: {{Singular}}FormValues;
  onSubmit: (data: {{Singular}}FormValues) => Promise<void>;
  onSuccess?: () => void;
  submitLabel?: string;
};

export function {{Singular}}Form({
  defaultValues,
  onSubmit,
  onSuccess,
  submitLabel = 'Save',
}: {{Singular}}FormProps) {
  return (
    <EntityForm
      schema={ {{singular}}Schema}
      defaultValues={defaultValues}
      onSubmit={onSubmit as (data: FieldValues) => Promise<void>}
      onSuccess={onSuccess}
      submitLabel={submitLabel}
    >
      {(form) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name *</label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{String(form.formState.errors.name.message)}</p>
            )}
          </div>
          {/* Add more fields following same pattern */}
        </div>
      )}
    </EntityForm>
  );
}
```

### components/{{singular}}-columns.tsx

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

**IMPORTANT:** `DropdownMenuTrigger` uses the `render` prop (Base UI pattern), NOT `asChild` (Radix pattern).

### List page — src/app/admin/{{plural}}/page.tsx

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

### Detail page — src/app/admin/{{plural}}/[id]/page.tsx

Server Component with `params: Promise<{ id: string }>`, `await params`, `notFound()`, Card with dt/dd fields grid. See the `add-admin-page` skill for the full pattern.

### New page — src/app/admin/{{plural}}/new/page.tsx

Client Component: `useRouter`, `PageHeader` with breadcrumbs, `{{Singular}}Form` with `createAction` + `onSuccess` redirect.

### Edit page — src/app/admin/{{plural}}/[id]/edit/page.tsx

Client Component: `useParams`, `useRouter`, browser client fetch to pre-fill, loading/not-found states. Select only form fields (not `*`).

### loading.tsx

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

## Wiring Checklist

After creating all feature files, update these existing files:

1. **Permissions** — Add to `src/types/acl.ts`:
   ```ts
   | '{{plural}}.read'
   | '{{plural}}.write'
   | '{{plural}}.delete'
   ```

2. **Role mappings** — Add to `src/lib/acl.ts` `rolePermissions`:
   - `editor`: add `'{{plural}}.read', '{{plural}}.write', '{{plural}}.delete'`
   - `viewer`: add `'{{plural}}.read'`

3. **Middleware** — Add to `src/middleware.ts` `routePermissions`:
   ```ts
   ['/admin/{{plural}}', '{{plural}}.read'],
   ```

4. **Sidebar** — Add to `src/components/layout/admin-sidebar.tsx` `navSections`:
   ```ts
   { label: '{{Plural}}', href: '/admin/{{plural}}', icon: SomeIcon },
   ```

5. **Database** — If the table doesn't exist yet, create a migration using the `add-supabase-migration` skill, then run `npm run types:generate`.
