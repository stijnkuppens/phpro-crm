---
name: add-server-action
description: Create a Next.js Server Action with permission checks, Zod validation, Supabase query, and audit logging. Use this skill whenever the user wants to add a server action, API mutation, or backend operation for any entity — including create, update, delete, or custom actions like "approve", "archive", "bulk update".
type: skill
---

# Add Server Action

Creates Server Actions following the project's pattern: permission check → Zod safeParse → Supabase query → error handling → audit log → revalidate → return ActionResult.

**Location:** `src/features/<feature>/actions/<verb>-<entity>.ts`

## The Pattern

Every server action MUST:
1. Return `ActionResult<T>` (never `throw`)
2. Wrap `requirePermission` in try/catch → `return err('Onvoldoende rechten')`
3. Use `safeParse` (not `parse`) → return `err(fieldErrors)` on failure
4. Log DB errors with `logger.error` → return `err('Er is een fout opgetreden')`
5. Call `revalidatePath` before returning `ok()`
6. Audit-log the action

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { type {{Singular}}FormValues, {{singular}}FormSchema } from '../types';

export async function create{{Singular}}(
  values: {{Singular}}FormValues,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission('{{plural}}.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsed = {{singular}}FormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('{{table}}')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    logger.error({ err: error }, '[create{{Singular}}] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: '{{singular}}.created',
    entityType: '{{singular}}',
    entityId: data.id,
    metadata: { name: parsed.data.name, body: parsed.data },
  });

  revalidatePath('/admin/{{plural}}');
  return ok(data);
}
```

## Variants

### Create Action

See above. Key points:
- Returns `ActionResult<{ id: string }>`
- `.insert(parsed.data).select('id').single()` to get the new ID
- `metadata` includes the name + full body for audit trail

### Update Action

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { type {{Singular}}FormValues, {{singular}}FormSchema, entityIdSchema } from '../types';

export async function update{{Singular}}(
  id: string,
  values: {{Singular}}FormValues,
): Promise<ActionResult> {
  try {
    await requirePermission('{{plural}}.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const parsed = {{singular}}FormSchema.safeParse(values);
  if (!parsed.success) {
    return err(z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('{{table}}')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    logger.error({ err: error }, '[update{{Singular}}] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: '{{singular}}.updated',
    entityType: '{{singular}}',
    entityId: id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath('/admin/{{plural}}');
  return ok();
}
```

### Delete Action

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { entityIdSchema } from '../types';

export async function delete{{Singular}}(id: string): Promise<ActionResult> {
  try {
    await requirePermission('{{plural}}.delete');
  } catch {
    return err('Onvoldoende rechten');
  }

  const parsedId = entityIdSchema.safeParse(id);
  if (!parsedId.success) return err('Ongeldig ID');

  const supabase = await createServerClient();

  // Snapshot before delete for audit trail
  const { data: snapshot } = await supabase.from('{{table}}').select('*').eq('id', id).single();
  const { error } = await supabase.from('{{table}}').delete().eq('id', id);

  if (error) {
    logger.error({ err: error }, '[delete{{Singular}}] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: '{{singular}}.deleted',
    entityType: '{{singular}}',
    entityId: id,
    metadata: { snapshot },
  });

  revalidatePath('/admin/{{plural}}');
  return ok();
}
```

### Custom Action (e.g., approve, archive)

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { logAction } from '@/features/audit/actions/log-action';
import { type ActionResult, err, ok } from '@/lib/action-result';
import { logger } from '@/lib/logger';
import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';

export async function approve{{Singular}}(id: string): Promise<ActionResult> {
  try {
    await requirePermission('{{plural}}.write');
  } catch {
    return err('Onvoldoende rechten');
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('{{table}}')
    .update({ status: 'approved' })
    .eq('id', id);

  if (error) {
    logger.error({ err: error }, '[approve{{Singular}}] database error');
    return err('Er is een fout opgetreden');
  }

  await logAction({
    action: '{{singular}}.approved',
    entityType: '{{singular}}',
    entityId: id,
  });

  revalidatePath('/admin/{{plural}}');
  return ok();
}
```

## Types (in types.ts)

Every feature's `types.ts` should include an `entityIdSchema` for ID validation:

```ts
// Never use z.string().uuid() — fixture data uses non-RFC UUIDs
export const entityIdSchema = z.string().min(1);
```

## Important Details

### ActionResult
- Import `ok`, `err`, `type ActionResult` from `@/lib/action-result`
- `ok()` for void, `ok(data)` for data
- `err('message')` for generic errors, `err(fieldErrors)` for validation errors
- **NEVER throw** — callers can't distinguish action errors from framework errors

### requirePermission
- Located at `src/lib/require-permission.ts`
- Returns `{ userId: string, role: Role }`
- **Always wrap in try/catch** — return `err('Onvoldoende rechten')` on failure

### Permission Strings
Format: `entity.verb` — defined in `src/types/acl.ts`
- Read: `{{plural}}.read`
- Write: `{{plural}}.write`
- Delete: `{{plural}}.delete`

### logAction
- Located at `src/features/audit/actions/log-action.ts`
- Uses service role client internally (bypasses RLS)
- Action names use past tense: `contact.created`, `contact.updated`, `contact.deleted`

### Supabase Clients
- `createServerClient` from `@/lib/supabase/server` — cookie-based, respects RLS
- `createServiceRoleClient` from `@/lib/supabase/admin` — bypasses RLS (only for audit logs)

### Error Messages
All user-facing error messages are in **Dutch**:
- `'Onvoldoende rechten'` — insufficient permissions
- `'Ongeldig ID'` — invalid ID
- `'Er is een fout opgetreden'` — generic error
