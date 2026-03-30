---
name: add-detail-page
description: Create a tabbed detail page with layout.tsx, generateMetadata, sub-nav, and tab pages. Use this skill whenever the user wants a detail view with tabs for an entity — including account detail, deal detail, user profile, or any entity with sub-sections.
type: skill
---

# Add Detail Page

Creates a tabbed detail page following the project's layout pattern: shared `layout.tsx` with header + sub-nav, each tab as a separate `page.tsx`.

## File Structure

```
src/app/admin/{{plural}}/[id]/
├── layout.tsx          — Shared header, banner, sub-nav
├── page.tsx            — Default tab (overview)
├── loading.tsx         — Skeleton
├── contacts/page.tsx   — Tab page (example)
├── contracts/page.tsx  — Tab page (example)
└── ...

src/features/{{plural}}/
├── components/
│   ├── {{singular}}-sub-nav.tsx      — Tab navigation
│   ├── {{singular}}-overview-tab.tsx — Default tab content
│   └── tab-config.ts                — Tab definitions
```

## Layout

`src/app/admin/{{plural}}/[id]/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { {{Singular}}SubNav } from '@/features/{{plural}}/components/{{singular}}-sub-nav';
import { get{{Singular}} } from '@/features/{{plural}}/queries/get-{{singular}}';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const {{singular}} = await get{{Singular}}(id);
  return { title: {{singular}}?.name ?? '{{Singular}}' };
}

export default async function {{Singular}}DetailLayout({ params, children }: Props) {
  const { id } = await params;
  const {{singular}} = await get{{Singular}}(id);
  if (!{{singular}}) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={ {{singular}}.name}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: '{{Plural}}', href: '/admin/{{plural}}' },
          { label: {{singular}}.name },
        ]}
      />
      <{{Singular}}SubNav {{singular}}Id={id} />
      {children}
    </div>
  );
}
```

**Key points:**
- `generateMetadata` provides dynamic titles (appended with " — PHPro CRM" by root layout template)
- `params` is `Promise<{ id: string }>` and must be `await`ed (Next.js 16)
- `notFound()` for missing entities — never render empty page
- Parallel fetches with `Promise.all()` if multiple data sources needed

## Tab Config

`src/features/{{plural}}/components/tab-config.ts`

```ts
import { Building, FileText, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TabMeta = {
  key: string;
  label: string;
  icon: LucideIcon;
  countKey?: string; // optional — maps to a stats field for badge count
};

export const tabMeta: TabMeta[] = [
  { key: 'overview', label: 'Overzicht', icon: Building },
  { key: 'contacts', label: 'Contacten', icon: Users, countKey: 'contactCount' },
  { key: 'contracts', label: 'Contracten', icon: FileText },
];
```

## Sub-Nav

`src/features/{{plural}}/components/{{singular}}-sub-nav.tsx`

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { SubNav, type SubNavItem } from '@/components/admin/sub-nav';
import { tabMeta } from './tab-config';

type Props = {
  {{singular}}Id: string;
};

export function {{Singular}}SubNav({ {{singular}}Id }: Props) {
  const pathname = usePathname();
  const basePath = `/admin/{{plural}}/${ {{singular}}Id}`;

  const items: SubNavItem[] = tabMeta.map((tab) => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
  }));

  const activeKey =
    tabMeta.find((tab) => {
      const href = tab.key === 'overview' ? basePath : `${basePath}/${tab.key}`;
      return pathname === href;
    })?.key ?? 'overview';

  return (
    <SubNav
      items={items}
      activeKey={activeKey}
      getHref={(key) => (key === 'overview' ? basePath : `${basePath}/${key}`)}
    />
  );
}
```

**Key:** Uses `getHref` (not `onSelect`) for URL-based navigation — tabs are bookmarkable.

## Default Tab (Overview)

`src/app/admin/{{plural}}/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { get{{Singular}} } from '@/features/{{plural}}/queries/get-{{singular}}';
import { {{Singular}}OverviewTab } from '@/features/{{plural}}/components/{{singular}}-overview-tab';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function {{Singular}}OverviewPage({ params }: Props) {
  const { id } = await params;
  const {{singular}} = await get{{Singular}}(id);
  if (!{{singular}}) notFound();

  return <{{Singular}}OverviewTab {{singular}}={ {{singular}}} />;
}
```

## Additional Tab Pages

```tsx
// src/app/admin/{{plural}}/[id]/contacts/page.tsx
import { notFound } from 'next/navigation';
import { get{{Singular}} } from '@/features/{{plural}}/queries/get-{{singular}}';
import { getContactsBy{{Singular}} } from '@/features/contacts/queries/get-contacts-by-{{singular}}';
import { {{Singular}}ContactsTab } from '@/features/{{plural}}/components/{{singular}}-contacts-tab';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function {{Singular}}ContactsPage({ params }: Props) {
  const { id } = await params;
  const [{{singular}}, contacts] = await Promise.all([
    get{{Singular}}(id),
    getContactsBy{{Singular}}(id),
  ]);
  if (!{{singular}}) notFound();

  return <{{Singular}}ContactsTab contacts={contacts} />;
}
```

**Each tab must be its own `page.tsx`** — the sub-nav uses URL-based navigation.

## Loading Skeleton

`src/app/admin/{{plural}}/[id]/loading.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function {{Singular}}DetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-2">
        {Array.from({ length: tabMeta.length }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28" />
        ))}
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
```

## Adding Edit Actions

For a "Bewerken" button on the overview tab:

```tsx
// In the overview tab page.tsx:
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

<div className="flex justify-end">
  <Button nativeButton={false} render={<Link href={`/admin/{{plural}}/${id}/edit`} />}>
    <Pencil /> Bewerken
  </Button>
</div>
```

Always use the `render` prop for Button + Link (base-ui pattern, not `asChild`).
