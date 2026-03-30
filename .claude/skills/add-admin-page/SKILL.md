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
| List with search/pagination | Server Component (page) + Client (list) | Server fetches initial data, client handles interactions |
| Create/edit form | Server Component (page) + Client (form) | Server fetches reference data, client handles form state |

**Rule:** `page.tsx` files should always be async Server Components that fetch data and pass it as props. Client interactivity lives in feature components.

## Server Component Page (List View)

```tsx
// src/app/admin/{{plural}}/page.tsx
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
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/admin/{{plural}}/new" />}>
            <Plus /> Nieuw {{Singular}}
          </Button>
        }
      />
      <{{Singular}}List initialData={data} initialCount={count} />
    </div>
  );
}
```

**Key:** Page is a Server Component that fetches data, then passes `initialData`/`initialCount` to the client list component.

## Server Component Page (Detail View)

```tsx
// src/app/admin/{{plural}}/[id]/page.tsx
import { notFound } from 'next/navigation';
import { get{{Singular}} } from '@/features/{{plural}}/queries/get-{{singular}}';
import { {{Singular}}OverviewTab } from '@/features/{{plural}}/components/{{singular}}-overview-tab';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function {{Singular}}DetailPage({ params }: Props) {
  const { id } = await params;
  const {{singular}} = await get{{Singular}}(id);
  if (!{{singular}}) notFound();

  return <{{Singular}}OverviewTab {{singular}}={ {{singular}}} />;
}
```

**Next.js 16 note:** `params` is `Promise<{ id: string }>` and must be `await`ed.

## Server Component Page (Create Form)

```tsx
// src/app/admin/{{plural}}/new/page.tsx
import { PageHeader } from '@/components/admin/page-header';
import { {{Singular}}CreateForm } from '@/features/{{plural}}/components/{{singular}}-create-form';
import { getReferenceOptions } from '@/features/reference-data/queries/get-reference-options';

export default async function New{{Singular}}Page() {
  // Load any reference data the form needs
  const options = await getReferenceOptions('{{plural}}');
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nieuw {{Singular}}"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: '{{Plural}}', href: '/admin/{{plural}}' },
          { label: 'Nieuw' },
        ]}
      />
      <div className="max-w-2xl">
        <{{Singular}}CreateForm options={options} />
      </div>
    </div>
  );
}
```

## Loading Skeleton

Every route gets a `loading.tsx` matching its page structure:

```tsx
// src/app/admin/{{plural}}/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function {{Plural}}Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
```

## Error Boundary

Every route gets an `error.tsx`:

```tsx
// src/app/admin/{{plural}}/error.tsx
'use client';

import { RouteErrorCard } from '@/components/admin/route-error-card';

export default function {{Plural}}Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorCard
      title="Fout bij laden van {{plural}}"
      description="Er is een onverwachte fout opgetreden bij het laden van {{plural}}."
      error={error}
      reset={reset}
    />
  );
}
```

## Button + Link Pattern

Page header buttons that navigate MUST use the `render` prop (base-ui pattern, NOT `asChild`):

```tsx
// Correct
<Button size="sm" nativeButton={false} render={<Link href="/admin/{{plural}}/new" />}>
  <Plus /> Nieuw {{Singular}}
</Button>

// Wrong — does not work with base-ui Button
<Button asChild><Link href="...">Label</Link></Button>

// Wrong — wrapping Button in Link
<Link href="..."><Button>Label</Button></Link>
```

## Every Route Must Have

```
src/app/admin/{{plural}}/
├── page.tsx     — async server component, calls queries, passes data as props
├── loading.tsx  — Skeleton UI, no logic
└── error.tsx    — 'use client', uses RouteErrorCard with Dutch text
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

- Form pages: `max-w-2xl space-y-6`
- List pages: full width `space-y-6`
- Detail pages: depend on layout (see `add-detail-page` skill for tabbed layout)
- PageHeader always starts breadcrumbs with `{ label: 'Admin', href: '/admin' }`
- Null/missing values display as `'—'` (em dash)
- All text is in **Dutch**
