---
name: add-entity-form
description: Create a form component using the EntityForm render-prop wrapper with Zod validation. Use this skill whenever the user wants to add a create/edit form, input form, or any data entry UI for an entity — including when they say "add a form for products" or "I need to edit tasks".
type: skill
---

# Add Entity Form

Creates feature-specific form components using the project's two-layer EntityForm pattern.

## Architecture

### Layer 1: EntityForm (shared, already exists)
`src/components/admin/entity-form.tsx` — wraps `react-hook-form` + `zodResolver`. Handles submit, success/error toasts, loading spinner. Uses render-prop `children(form)` pattern.

### Layer 2: Feature Form (what you create)
`src/features/<feature>/components/<singular>-form.tsx` — wraps EntityForm with feature-specific fields.

## The Pattern

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
          {/* Required field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name *</label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {String(form.formState.errors.name.message)}
              </p>
            )}
          </div>

          {/* Optional field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" {...form.register('email')} />
          </div>

          {/* Textarea field */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <Textarea id="notes" {...form.register('notes')} />
          </div>
        </div>
      )}
    </EntityForm>
  );
}
```

## Key Conventions

### EntityForm is dynamically imported
Prevents SSR and reduces initial bundle:
```tsx
const EntityForm = dynamic(() => import('@/components/admin/entity-form'), {
  loading: () => <Skeleton className="h-64 w-full" />,
});
```

### Field pattern
Every field follows the same structure — label + input + error:
```tsx
<div className="space-y-2">
  <label htmlFor="fieldName" className="text-sm font-medium">Label *</label>
  <Input id="fieldName" {...form.register('fieldName')} />
  {form.formState.errors.fieldName && (
    <p className="text-sm text-destructive">
      {String(form.formState.errors.fieldName.message)}
    </p>
  )}
</div>
```

- Required fields: add ` *` to the label text
- Error messages: wrap in `String()` for type safety
- Only show error `<p>` for fields with validation rules
- Use plain `label` + `Input`, NOT the shadcn `FormField` component

### onSubmit type cast
Cast is needed because EntityForm expects `FieldValues`:
```tsx
onSubmit={onSubmit as (data: FieldValues) => Promise<void>}
```

### Available input components
- `Input` from `@/components/ui/input` — text, email, number, tel, password
- `Textarea` from `@/components/ui/textarea` — multiline text
- `Select` from `@/components/ui/select` — dropdowns (use with `Controller` from react-hook-form)

## Usage in Pages

### New page (create):
```tsx
<{{Singular}}Form
  onSubmit={(data) => create{{Singular}}(data)}
  onSuccess={() => router.push('/admin/{{plural}}')}
  submitLabel="Create {{Singular}}"
/>
```

### Edit page (update):
```tsx
<{{Singular}}Form
  defaultValues={entity}
  onSubmit={(data) => update{{Singular}}(id, data)}
  onSuccess={() => router.push('/admin/{{plural}}')}
  submitLabel="Save Changes"
/>
```

### Edit page data loading pattern:
The edit page fetches via browser client (not server query) to pre-fill the form. Select only the form fields, not `*`:

```tsx
useEffect(() => {
  async function load() {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('{{table}}')
      .select('name, email, phone, notes')  // only form fields
      .eq('id', id)
      .single();
    if (data) setEntity(data as {{Singular}}FormValues);
    setLoading(false);
  }
  load();
}, [id]);
```

## Zod Schema (in types.ts)

The form's validation comes from the Zod schema in `src/features/<feature>/types.ts`:

```ts
export const {{singular}}Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type {{Singular}}FormValues = z.infer<typeof {{singular}}Schema>;
```

Common Zod patterns:
- Required string: `z.string().min(1, 'Field is required')`
- Optional string: `z.string().optional()`
- Optional email: `z.email('Invalid email').optional().or(z.literal(''))`
- Number: `z.coerce.number().min(0)`
- Boolean: `z.boolean().default(false)`
