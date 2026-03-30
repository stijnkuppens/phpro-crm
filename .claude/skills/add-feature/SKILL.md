---
name: add-feature
description: Scaffold a complete feature slice with types, queries, actions, form, columns, and admin pages. Use this skill whenever the user wants to add a new entity, resource, or CRUD feature to the admin panel — even if they just say "add products" or "I need a tasks page".
type: skill
---

# Add Feature

Orchestrates the creation of a complete feature slice by composing the project's individual skills. This creates ~12 files across `src/features/<name>/` and `src/app/admin/<plural>/`.

## Gather Requirements First

Before writing any code, clarify:
1. **Entity name** (singular + plural, e.g., "product" / "products")
2. **Table name** (usually the plural, snake_case)
3. **Fields** — name, type, required?, which are searchable/filterable
4. **Category field** — for pills filter (e.g., type with ≤5 options)
5. **Permissions** — who can read/write/delete? (default: viewers read, editors write, admins delete)
6. **Detail page** — simple (no tabs) or tabbed (with sub-nav)?

## File Structure

```
src/features/{{plural}}/
├── types.ts                                  ← Zod schemas, DB types, badge styles
├── columns.tsx                               ← TanStack Table column defs with filter meta
├── queries/
│   ├── get-{{plural}}.ts                     ← List query (React.cache)
│   └── get-{{singular}}.ts                   ← Single query (React.cache)
├── actions/
│   ├── create-{{singular}}.ts                ← ActionResult pattern
│   ├── update-{{singular}}.ts
│   └── delete-{{singular}}.ts
└── components/
    ├── {{singular}}-list.tsx                  ← Client list with DataTable
    ├── {{singular}}-form-fields.tsx           ← Pure form layout
    └── {{singular}}-form-modal.tsx            ← Form modal with useActionState

src/app/admin/{{plural}}/
├── page.tsx                                  ← Server component, passes initialData
├── loading.tsx                               ← Skeleton
├── error.tsx                                 ← RouteErrorCard
└── [id]/
    ├── page.tsx                              ← Detail view (or layout.tsx for tabs)
    └── loading.tsx
```

## Execution Order

Create files in this order, using the referenced skills:

### Step 1: Database (if table doesn't exist)
Use **`add-supabase-migration`** skill to create the table, then run `task db:reset && task types:generate`.

### Step 2: Types
```ts
// src/features/{{plural}}/types.ts
import type { Database } from '@/lib/supabase/database.types';
import { z } from 'zod';

export type {{Singular}} = Database['public']['Tables']['{{table}}']['Row'];

// List item type — may include joined fields
export type {{Singular}}ListItem = {{Singular}};

export const {{singular}}FormSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  // add fields...
});

export type {{Singular}}FormValues = z.infer<typeof {{singular}}FormSchema>;

// ID validation — never use z.string().uuid()
export const entityIdSchema = z.string().min(1);

// Badge style map (if entity has a category field)
export const {{SINGULAR}}_TYPE_STYLES: Record<string, string> = {
  // 'Value': 'bg-color-100 text-color-700',
};
```

### Step 3: Queries
```ts
// src/features/{{plural}}/queries/get-{{plural}}.ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const get{{Plural}} = cache(async () => {
  const supabase = await createServerClient();
  const { data, count } = await supabase
    .from('{{table}}')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 24);
  return { data: data ?? [], count: count ?? 0 };
});
```

```ts
// src/features/{{plural}}/queries/get-{{singular}}.ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const get{{Singular}} = cache(async (id: string) => {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('{{table}}')
    .select('*')
    .eq('id', id)
    .single();
  return data;
});
```

### Step 4: Server Actions
Use **`add-server-action`** skill for create, update, and delete actions.

### Step 5: Columns
Use **`add-data-table-page`** skill for the column definitions with filter meta.

### Step 6: Form
Use **`add-entity-form`** skill for form fields + form modal.

### Step 7: List Component
Use **`add-data-table-page`** skill for the list component.

### Step 8: Admin Pages
Use **`add-admin-page`** skill for:
- `page.tsx` (server component with initialData)
- `loading.tsx` (skeleton)

Use **`add-error-page`** skill for `error.tsx`.

### Step 9: Detail Page
Use **`add-detail-page`** skill for tabbed detail, or **`add-admin-page`** for simple detail.

## Wiring Checklist

After creating all feature files, update these existing files:

1. **Permissions** — Add to `src/types/acl.ts`:
   ```ts
   | '{{plural}}.read'
   | '{{plural}}.write'
   | '{{plural}}.delete'
   ```

2. **Role mappings** — Add to `src/lib/acl.ts` `rolePermissions`:
   - `admin`: add all three
   - `editor`: add `'{{plural}}.read', '{{plural}}.write'`
   - `viewer`: add `'{{plural}}.read'`

3. **Middleware** — Add to `src/middleware.ts` `routePermissions`:
   ```ts
   ['/admin/{{plural}}', '{{plural}}.read'],
   ```

4. **Sidebar** — Add to `src/components/layout/admin-sidebar.tsx` `navSections`:
   ```ts
   { label: '{{Plural}}', href: '/admin/{{plural}}', icon: SomeIcon },
   ```
   Choose an icon from `lucide-react`.

## Key Principles

- **Server-first data flow** — pages fetch data, pass as `initialData` props
- **ActionResult everywhere** — never throw from server actions
- **Dutch UI text** — all labels, toasts, errors, buttons
- **Declarative columns** — filter config in column meta, not in separate filter components
- **No barrel files** — import directly from file paths
