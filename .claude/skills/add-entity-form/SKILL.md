---
name: add-entity-form
description: Create a form component using useActionState + native form action + FormData + SubmitButton with Zod validation. Use this skill whenever the user wants to add a create/edit form, input form, or any data entry UI for an entity — including when they say "add a form for products" or "I need to edit tasks".
type: skill
---

# Add Entity Form

Creates feature-specific form components using the project's React 19 pattern: `useActionState` + native `<form action={fn}>` + `FormData` parsing + client-side Zod pre-validation.

## Architecture

### Two files per form:

1. **Form fields** (`{{singular}}-form-fields.tsx`) — Pure layout component. Accepts `defaultValues` and `errors`, renders labeled inputs with `name` attributes. No state, no actions.
2. **Form modal** (`{{singular}}-form-modal.tsx`) — Orchestrates submission via `useActionState`. Parses `FormData`, validates with Zod client-side, calls server action, shows toast.

## Form Fields Component

`src/features/{{plural}}/components/{{singular}}-form-fields.tsx`

```tsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fieldErrorClass } from '@/lib/form-errors';
import type { {{Singular}}FormValues } from '../types';

type Props = {
  defaultValues?: Partial<{{Singular}}FormValues>;
  errors?: Record<string, boolean>;
};

export function {{Singular}}FormFields({ defaultValues, errors }: Props) {
  return (
    <div className="space-y-4">
      {/* Required field */}
      <div className="space-y-2">
        <Label htmlFor="name">Naam *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name ?? ''}
          required
          className={errors?.name ? fieldErrorClass : ''}
        />
      </div>

      {/* Optional field */}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ''}
          className={errors?.email ? fieldErrorClass : ''}
        />
      </div>

      {/* Textarea */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notities</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ''}
        />
      </div>
    </div>
  );
}
```

### Key conventions:
- Every field uses `name` attribute (for `FormData` extraction)
- `defaultValue` (not `value`) — uncontrolled inputs
- Required fields: add ` *` to the label text
- Error styling: conditionally apply `fieldErrorClass` from `@/lib/form-errors`
- All labels are in **Dutch**
- Use `Label` from `@/components/ui/label` (not plain `<label>`)

## Form Modal Component

`src/features/{{plural}}/components/{{singular}}-form-modal.tsx`

```tsx
'use client';

import { Save } from 'lucide-react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { Modal, ModalFooter } from '@/components/admin/modal';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { zodFieldErrors } from '@/lib/form-errors';
import { create{{Singular}} } from '../actions/create-{{singular}}';
import { update{{Singular}} } from '../actions/update-{{singular}}';
import { type {{Singular}}FormValues, {{singular}}FormSchema } from '../types';
import { {{Singular}}FormFields } from './{{singular}}-form-fields';

type Props = {
  {{singular}}Id: string | null; // null = create mode
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function {{Singular}}FormModal({ {{singular}}Id, open, onClose, onSaved }: Props) {
  const isEdit = !!{{singular}}Id;
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const [, formAction] = useActionState(async (_prev: null, fd: FormData) => {
    const values: {{Singular}}FormValues = {
      name: fd.get('name') as string,
      email: (fd.get('email') as string) || undefined,
      notes: (fd.get('notes') as string) || undefined,
    };

    // Client-side Zod pre-validation for instant field errors
    const parsed = {{singular}}FormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      toast.error('Controleer de gemarkeerde velden');
      return null;
    }
    setFieldErrors({});

    const result = isEdit
      ? await update{{Singular}}({{singular}}Id!, values)
      : await create{{Singular}}(values);

    if (!result.success) {
      toast.error(typeof result.error === 'string' ? result.error : 'Validatiefout');
      return null;
    }

    toast.success(isEdit ? '{{Singular}} bijgewerkt' : '{{Singular}} aangemaakt');
    onSaved?.();
    onClose();
    return null;
  }, null);

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? '{{Singular}} bewerken' : 'Nieuw {{singular}}'}>
      <form action={formAction}>
        <{{Singular}}FormFields
          defaultValues={/* pass existing entity data for edit */}
          errors={fieldErrors}
        />
        <ModalFooter>
          <Button variant="outline" type="button" onClick={onClose}>Annuleren</Button>
          <SubmitButton icon={<Save />}>Opslaan</SubmitButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
```

### Key conventions:
- `useActionState` from `react` (not `react-dom`)
- Signature: `[state, action, isPending]` — state is `null` (unused), action goes on `<form action={fn}>`
- Parse `FormData` manually with `fd.get('field') as string`
- Client-side Zod validation BEFORE calling the server action
- `zodFieldErrors()` from `@/lib/form-errors` converts `ZodError` → `Record<string, boolean>`
- Server action returns `ActionResult` — check `result.success`
- Error display: `toast.error()` from `sonner`
- Success display: `toast.success()` with Dutch message
- Submit button: `<SubmitButton>` uses `useFormStatus()` internally — auto-disables during submission
- Cancel button: `variant="outline"`, `type="button"` (prevents form submission)
- All button/toast text is in **Dutch**

## Edit Mode: Loading Existing Data

When the modal is for editing, fetch the entity client-side (the list only has summary data):

```tsx
const [{{singular}}, set{{Singular}}] = useState<{{Singular}}WithDetails | null>(null);

useEffect(() => {
  if (!{{singular}}Id || !open) return;
  let cancelled = false;
  const supabase = createBrowserClient();
  supabase
    .from('{{table}}')
    .select('name, email, notes')  // only form fields, not *
    .eq('id', {{singular}}Id)
    .single()
    .then(({ data }) => {
      if (!cancelled) set{{Singular}}(data as {{Singular}}WithDetails | null);
    });
  return () => { cancelled = true; };
}, [{{singular}}Id, open]);
```

Then pass to `{{Singular}}FormFields`:
```tsx
<{{Singular}}FormFields defaultValues={ {{singular}} ?? undefined} errors={fieldErrors} />
```

## Remounting on Entity Change

When switching between entities in a modal, force a clean remount:

```tsx
// In the parent list component:
{editId && (
  <{{Singular}}FormModal
    key={editId}
    {{singular}}Id={editId}
    open
    onClose={() => setEditId(null)}
    onSaved={() => { load(); router.refresh(); }}
  />
)}
```

The `key={editId}` ensures React unmounts and remounts the modal when switching entities, preventing stale `defaultValue` state.

## Select Fields

For select fields, use controlled state since `FormData` doesn't capture select values from shadcn's Select:

```tsx
const [role, setRole] = useState(defaultValues?.role ?? '');

// In the form fields:
<Select value={role} onValueChange={setRole} name="role">
  <SelectTrigger>
    {ROLE_OPTIONS.find((r) => r.value === role)?.label ?? 'Selecteer...'}
  </SelectTrigger>
  <SelectContent>
    {ROLE_OPTIONS.map((opt) => (
      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Important:** Always render the label explicitly in `SelectTrigger` — never rely on `SelectValue` for ID-based selects (it shows raw UUIDs before the dropdown is opened).

## Zod Schema (in types.ts)

```ts
export const {{singular}}FormSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type {{Singular}}FormValues = z.infer<typeof {{singular}}FormSchema>;
```

Common Zod patterns:
- Required string: `z.string().min(1, 'Veld is verplicht')`
- Optional string: `z.string().optional()`
- Optional email: `z.string().email('Ongeldig e-mailadres').optional().or(z.literal(''))`
- Number: `z.coerce.number().min(0)`
- Boolean: `z.boolean().default(false)`
- FK reference: `z.string().min(1, 'Selectie is verplicht')` (never `z.string().uuid()`)
