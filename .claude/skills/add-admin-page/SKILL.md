---
name: add-admin-page
description: Create a new admin route page (Server or Client Component) with proper layout, breadcrumbs, and loading skeleton. Use this skill whenever the user wants to add a new page, route, view, or screen to the admin panel — including detail pages, form pages, dashboard sections, or custom views.
type: skill
---

# Add Admin Page

Creates admin route pages following the project's conventions. The key decision is **Server vs Client Component** — this determines the entire page structure.

## When to Use Which

| Page Type | Component | Why |
|-----------|-----------|-----|
| Detail/read-only | Server Component | Static data, SEO, no interactivity needed |
| Dashboard with stats | Server Component | Parallel data fetching, no client state |
| List with search/pagination | Client Component | Interactive state, `useEntity` hook |
| Create/edit form | Client Component | Form state, client-side validation |
| Custom interactive | Client Component | Any page needing hooks or event handlers |

## Server Component Page (Detail View)

```tsx
// src/app/admin/{{plural}}/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { get{{Singular}} } from '@/features/{{plural}}/queries/get-{{singular}}';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function {{Singular}}DetailPage({ params }: Props) {
  const { id } = await params;
  const {{singular}} = await get{{Singular}}(id);

  if (!{{singular}}) notFound();

  const fields = [
    { label: 'Email', value: {{singular}}.email },
    { label: 'Phone', value: {{singular}}.phone },
    { label: 'Created', value: new Date({{singular}}.created_at).toLocaleDateString() },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={ {{singular}}.name}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: '{{Plural}}', href: '/admin/{{plural}}' },
          { label: {{singular}}.name },
        ]}
        actions={
          <Link href={`/admin/{{plural}}/${id}/edit`}>
            <Button>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{{Singular}} Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 text-sm">{field.value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Next.js 16 note:** `params` is `Promise<{ id: string }>` and must be `await`ed.

## Client Component Page — New (Create Form)

```tsx
// src/app/admin/{{plural}}/new/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { {{Singular}}Form } from '@/features/{{plural}}/components/{{singular}}-form';
import { create{{Singular}} } from '@/features/{{plural}}/actions/create-{{singular}}';

export default function New{{Singular}}Page() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Add {{Singular}}"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: '{{Plural}}', href: '/admin/{{plural}}' },
          { label: 'New' },
        ]}
      />
      <{{Singular}}Form
        onSubmit={(data) => create{{Singular}}(data)}
        onSuccess={() => router.push('/admin/{{plural}}')}
        submitLabel="Create {{Singular}}"
      />
    </div>
  );
}
```

## Client Component Page — Edit

```tsx
// src/app/admin/{{plural}}/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { {{Singular}}Form } from '@/features/{{plural}}/components/{{singular}}-form';
import { update{{Singular}} } from '@/features/{{plural}}/actions/update-{{singular}}';
import { createBrowserClient } from '@/lib/supabase/client';
import type { {{Singular}}FormValues } from '@/features/{{plural}}/types';

export default function Edit{{Singular}}Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [{{singular}}, set{{Singular}}] = useState<{{Singular}}FormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('{{table}}')
        .select('name, email, phone, notes')  // only form fields, not *
        .eq('id', id)
        .single();
      if (data) set{{Singular}}(data as {{Singular}}FormValues);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!{{singular}}) return <p>{{Singular}} not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Edit {{Singular}}"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: '{{Plural}}', href: '/admin/{{plural}}' },
          { label: 'Edit' },
        ]}
      />
      <{{Singular}}Form
        defaultValues={ {{singular}}}
        onSubmit={(data) => update{{Singular}}(id, data)}
        onSuccess={() => router.push('/admin/{{plural}}')}
        submitLabel="Save Changes"
      />
    </div>
  );
}
```

**Key:** Edit pages fetch via `createBrowserClient()`, selecting only form fields. NOT via server queries.

## Loading Skeleton

Every route gets a `loading.tsx` matching its page structure:

```tsx
// src/app/admin/{{plural}}/loading.tsx
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

After creating the page files:

1. **Route permission** — Add to `src/middleware.ts` `routePermissions`:
   ```ts
   ['/admin/{{plural}}', '{{plural}}.read'],
   ```

2. **Sidebar entry** — Add to `src/components/layout/admin-sidebar.tsx` `navSections`:
   ```ts
   { label: '{{Plural}}', href: '/admin/{{plural}}', icon: SomeIcon },
   ```
   Choose an icon from `lucide-react`.

3. **Permission** — Ensure `{{plural}}.read` exists in `src/types/acl.ts` and is mapped in `src/lib/acl.ts`.

## Layout Conventions

- Form pages: `mx-auto max-w-2xl space-y-6`
- List pages: full width `space-y-6`
- Detail pages: `mx-auto max-w-2xl space-y-6`
- PageHeader always starts breadcrumbs with `{ label: 'Admin', href: '/admin' }`
- Null/missing values display as `'—'` (em dash)
