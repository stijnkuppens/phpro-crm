import * as fs from 'node:fs';
import * as path from 'node:path';

import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSingular(name: string): string {
  return name.endsWith('s') ? name.slice(0, -1) : name;
}

function toPlural(name: string): string {
  return name.endsWith('s') ? name : name + 's';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function writeFile(relPath: string, content: string): void {
  const absPath = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content);
}

function nextMigrationNumber(): string {
  const migrationsDir = path.join(ROOT, 'supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    return '00001';
  }
  const files = fs.readdirSync(migrationsDir).filter((f) => /^\d{5}_/.test(f));
  if (files.length === 0) return '00001';
  const highest = files.reduce((max, f) => {
    const n = parseInt(f.slice(0, 5), 10);
    return n > max ? n : max;
  }, 0);
  return String(highest + 1).padStart(5, '0');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const input = process.argv[2];
if (!input) {
  console.error('Usage: tsx scripts/generate-entity.ts <entity-name>');
  console.error('Example: tsx scripts/generate-entity.ts products');
  process.exit(1);
}

const plural = toPlural(input.toLowerCase());
const singular = toSingular(plural);
const Singular = capitalize(singular);
const migrationNum = nextMigrationNumber();

const createdFiles: string[] = [];

function emit(relPath: string, content: string): void {
  writeFile(relPath, content);
  createdFiles.push(relPath);
}

// ---------------------------------------------------------------------------
// Feature: types.ts
// ---------------------------------------------------------------------------

emit(
  `src/features/${plural}/types.ts`,
  `import type { Database } from '@/types/database';
import { z } from 'zod';

// TODO: Update table name after running migration
export type ${Singular} = Database['public']['Tables']['${plural}']['Row'];
export type ${Singular}Insert = Database['public']['Tables']['${plural}']['Insert'];

export const ${singular}Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  // TODO: Add your fields here
});

export type ${Singular}FormValues = z.infer<typeof ${singular}Schema>;
`,
);

// ---------------------------------------------------------------------------
// Feature: queries/get-<plural>.ts
// ---------------------------------------------------------------------------

emit(
  `src/features/${plural}/queries/get-${plural}.ts`,
  `import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ${Singular} } from '../types';

export const get${capitalize(plural)} = cache(
  async (params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const { page = 1, pageSize = 10, search } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = await createServerClient();

    let query = supabase
      .from('${plural}')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('name', \`%\${search}%\`);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return { data: (data ?? []) as ${Singular}[], count: count ?? 0 };
  },
);
`,
);

// ---------------------------------------------------------------------------
// Feature: queries/get-<singular>.ts
// ---------------------------------------------------------------------------

emit(
  `src/features/${plural}/queries/get-${singular}.ts`,
  `import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ${Singular} } from '../types';

export const get${Singular} = cache(async (id: string): Promise<${Singular} | null> => {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('${plural}')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  return data as ${Singular};
});
`,
);

// ---------------------------------------------------------------------------
// Feature: actions/create-<singular>.ts
// ---------------------------------------------------------------------------

emit(
  `src/features/${plural}/actions/create-${singular}.ts`,
  `'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { ${singular}Schema } from '../types';

export async function create${Singular}(values: unknown) {
  const { userId } = await requirePermission('${plural}.write');
  const parsed = ${singular}Schema.parse(values);
  const supabase = await createServerClient();

  const { error } = await supabase.from('${plural}').insert({
    name: parsed.name,
    // TODO: Map your fields here
    created_by: userId,
  });

  if (error) throw new Error(error.message);

  // TODO: logAction()
}
`,
);

// ---------------------------------------------------------------------------
// Feature: actions/update-<singular>.ts
// ---------------------------------------------------------------------------

emit(
  `src/features/${plural}/actions/update-${singular}.ts`,
  `'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { ${singular}Schema } from '../types';

export async function update${Singular}(id: string, values: unknown) {
  await requirePermission('${plural}.write');
  const parsed = ${singular}Schema.parse(values);
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('${plural}')
    .update({
      name: parsed.name,
      // TODO: Map your fields here
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // TODO: logAction()
}
`,
);

// ---------------------------------------------------------------------------
// Feature: actions/delete-<singular>.ts
// ---------------------------------------------------------------------------

emit(
  `src/features/${plural}/actions/delete-${singular}.ts`,
  `'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function delete${Singular}(id: string) {
  await requirePermission('${plural}.delete');
  const supabase = await createServerClient();

  const { error } = await supabase.from('${plural}').delete().eq('id', id);

  if (error) throw new Error(error.message);

  // TODO: logAction()
}
`,
);

// ---------------------------------------------------------------------------
// Feature: components/<singular>-columns.tsx
// ---------------------------------------------------------------------------

emit(
  `src/features/${plural}/components/${singular}-columns.tsx`,
  `'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import type { ${Singular} } from '../types';

export function get${Singular}Columns(options: {
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
}): ColumnDef<${Singular}>[] {
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
            <DropdownMenuItem onClick={() => options.onNavigate(\`/admin/${plural}/\${row.original.id}\`)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => options.onNavigate(\`/admin/${plural}/\${row.original.id}/edit\`)}>
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
`,
);

// ---------------------------------------------------------------------------
// Feature: components/<singular>-form.tsx
// ---------------------------------------------------------------------------

emit(
  `src/features/${plural}/components/${singular}-form.tsx`,
  `'use client';

import dynamic from 'next/dynamic';
import type { FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ${singular}Schema, type ${Singular}FormValues } from '../types';

const EntityForm = dynamic(() => import('@/components/admin/entity-form'), {
  loading: () => <Skeleton className="h-64 w-full" />,
});

type ${Singular}FormProps = {
  defaultValues?: ${Singular}FormValues;
  onSubmit: (data: ${Singular}FormValues) => Promise<void>;
  onSuccess?: () => void;
  submitLabel?: string;
};

export function ${Singular}Form({
  defaultValues,
  onSubmit,
  onSuccess,
  submitLabel = 'Save',
}: ${Singular}FormProps) {
  return (
    <EntityForm
      schema={${singular}Schema}
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
          {/* TODO: Add your form fields here */}
        </div>
      )}
    </EntityForm>
  );
}
`,
);

// ---------------------------------------------------------------------------
// Admin: page.tsx (list)
// ---------------------------------------------------------------------------

emit(
  `src/app/admin/${plural}/page.tsx`,
  `'use client';

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
import type { ${Singular} } from '@/features/${plural}/types';
import { get${Singular}Columns } from '@/features/${plural}/components/${singular}-columns';

const DataTable = dynamic(() => import('@/components/admin/data-table'), {
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function ${capitalize(plural)}Page() {
  const router = useRouter();
  const { data, total, loading, fetchList, remove, bulkDelete } = useEntity<${Singular}>({
    table: '${plural}',
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
    () => get${Singular}Columns({ onDelete: handleDelete, onNavigate: router.push }),
    [handleDelete, router.push],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="${capitalize(plural)}"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: '${capitalize(plural)}' }]}
        actions={
          <RoleGuard permission="${plural}.write">
            <Link href="/admin/${plural}/new">
              <Button>Add ${Singular}</Button>
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
`,
);

// ---------------------------------------------------------------------------
// Admin: new/page.tsx
// ---------------------------------------------------------------------------

emit(
  `src/app/admin/${plural}/new/page.tsx`,
  `'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { ${Singular}Form } from '@/features/${plural}/components/${singular}-form';
import { create${Singular} } from '@/features/${plural}/actions/create-${singular}';

export default function New${Singular}Page() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Add ${Singular}"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: '${capitalize(plural)}', href: '/admin/${plural}' },
          { label: 'New' },
        ]}
      />
      <${Singular}Form
        onSubmit={(data) => create${Singular}(data)}
        onSuccess={() => router.push('/admin/${plural}')}
        submitLabel="Create ${Singular}"
      />
    </div>
  );
}
`,
);

// ---------------------------------------------------------------------------
// Admin: [id]/page.tsx
// ---------------------------------------------------------------------------

emit(
  `src/app/admin/${plural}/[id]/page.tsx`,
  `import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { get${Singular} } from '@/features/${plural}/queries/get-${singular}';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ${Singular}DetailPage({ params }: Props) {
  const { id } = await params;
  const ${singular} = await get${Singular}(id);

  if (!${singular}) notFound();

  const fields = [
    { label: 'Name', value: ${singular}.name },
    { label: 'Created', value: new Date(${singular}.created_at).toLocaleDateString() },
    // TODO: Add your fields here
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={${singular}.name}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: '${capitalize(plural)}', href: '/admin/${plural}' },
          { label: ${singular}.name },
        ]}
        actions={
          <Link href={\`/admin/${plural}/\${id}/edit\`}>
            <Button>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>${Singular} Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 text-sm">{field.value ?? '\\u2014'}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
`,
);

// ---------------------------------------------------------------------------
// Admin: [id]/edit/page.tsx
// ---------------------------------------------------------------------------

emit(
  `src/app/admin/${plural}/[id]/edit/page.tsx`,
  `'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ${Singular}Form } from '@/features/${plural}/components/${singular}-form';
import { update${Singular} } from '@/features/${plural}/actions/update-${singular}';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ${Singular}FormValues } from '@/features/${plural}/types';

export default function Edit${Singular}Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [${singular}, set${Singular}] = useState<${Singular}FormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('${plural}')
        .select('name')
        .eq('id', id)
        .single();
      if (data) set${Singular}(data as ${Singular}FormValues);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!${singular}) return <p>${Singular} not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Edit ${Singular}"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: '${capitalize(plural)}', href: '/admin/${plural}' },
          { label: 'Edit' },
        ]}
      />
      <${Singular}Form
        defaultValues={${singular}}
        onSubmit={(data) => update${Singular}(id, data)}
        onSuccess={() => router.push('/admin/${plural}')}
        submitLabel="Save Changes"
      />
    </div>
  );
}
`,
);

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

emit(
  `supabase/migrations/${migrationNum}_${plural}.sql`,
  `-- Entity: ${plural}
CREATE TABLE IF NOT EXISTS public.${plural} (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  -- TODO: Add your columns here
  created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS ${plural}_created_at_idx ON public.${plural} (created_at DESC);
CREATE INDEX IF NOT EXISTS ${plural}_name_idx ON public.${plural} (name);
CREATE INDEX IF NOT EXISTS ${plural}_created_by_idx ON public.${plural} (created_by);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.${plural};
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.${plural}
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.${plural} ENABLE ROW LEVEL SECURITY;

-- TODO: Add your RLS policies here
-- Example:
-- CREATE POLICY "${plural}_select" ON public.${plural} FOR SELECT USING (true);
-- CREATE POLICY "${plural}_insert" ON public.${plural} FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- CREATE POLICY "${plural}_update" ON public.${plural} FOR UPDATE USING (auth.uid() IS NOT NULL);
-- CREATE POLICY "${plural}_delete" ON public.${plural} FOR DELETE USING (auth.uid() IS NOT NULL);

-- Enable Realtime (ignore if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.${plural};
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`,
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n\u2705 Generated feature: ${plural}\n`);
console.log('Files created:');
for (const f of createdFiles) {
  console.log(`  ${f}`);
}
console.log(`
Next steps:
  1. Edit supabase/migrations/${migrationNum}_${plural}.sql \u2014 add your columns
  2. Add RLS policies to the migration
  3. Add '${plural}.read', '${plural}.write', '${plural}.delete' to src/types/acl.ts
  4. Add permissions to the role matrix in src/lib/acl.ts
  5. Add sidebar entry in src/components/layout/admin-sidebar.tsx
  6. Run: supabase db reset (or supabase migration up)
  7. Regenerate types: supabase gen types typescript --local > src/types/database.ts`);
