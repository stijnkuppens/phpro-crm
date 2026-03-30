---
name: add-server-action
description: Create a Next.js Server Action with permission checks, Zod validation, Supabase query, and audit logging. Use this skill whenever the user wants to add a server action, API mutation, or backend operation for any entity — including create, update, delete, or custom actions like "approve", "archive", "bulk update".
type: skill
---

# Add Server Action

Creates Server Actions following the project's 5-step pattern: permission check, Zod parse, Supabase query, error handling, audit log.

## The Pattern

Every Server Action in this project lives at `src/features/<feature>/actions/<verb>-<entity>.ts` and follows this structure:

```ts
'use server';

import { requirePermission } from '@/lib/require-permission';
import { createServerClient } from '@/lib/supabase/server';
import { entitySchema } from '../types';
import { logAction } from '@/features/audit/actions/log-action';

export async function createEntity(values: unknown) {
  // 1. Permission check — throws on failure, returns { userId, role }
  const { userId } = await requirePermission('entities.write');

  // 2. Zod validation — throws ZodError on invalid input
  const parsed = entitySchema.parse(values);

  // 3. Supabase query
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('entities').insert({
    ...parsed,
    created_by: userId,
  }).select('id').single();

  // 4. Error handling — EntityForm catches and shows toast
  if (error) throw new Error(error.message);

  // 5. Audit log
  await logAction({
    action: 'entity.created',
    entityType: 'entity',
    entityId: data.id,
    metadata: { name: parsed.name },
  });
}
```

## Variants

### Create Action

```ts
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

Key: `insert()` + `.select('id').single()` to get the new ID for the audit log.

### Update Action

```ts
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

Key: First param is `id: string`. No need to destructure `userId` since we're not setting `created_by`.

### Delete Action

```ts
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

Key: No Zod validation needed. Permission is `.delete` (not `.write`). No metadata in audit log.

### Custom Action (e.g., approve, archive)

```ts
export async function approve{{Singular}}(id: string) {
  await requirePermission('{{plural}}.write');
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('{{table}}')
    .update({ status: 'approved' })
    .eq('id', id);

  if (error) throw new Error(error.message);

  await logAction({
    action: '{{singular}}.approved',
    entityType: '{{singular}}',
    entityId: id,
  });
}
```

## Important Details

### requirePermission
- Located at `src/lib/require-permission.ts`
- Checks auth (getUser), fetches role from user_profiles, checks ACL
- Returns `{ userId: string, role: Role }`
- Throws `'Unauthorized: not authenticated'`, `'Unauthorized: no role assigned'`, or `'Forbidden: missing permission ...'`

### Permission Strings
Format: `entity.verb` — defined in `src/types/acl.ts`
- `contacts.read`, `contacts.write`, `contacts.delete`
- `files.read`, `files.write`, `files.delete`

### logAction
- Located at `src/features/audit/actions/log-action.ts`
- Uses service role client internally (bypasses RLS)
- Captures IP from `x-forwarded-for` header
- Parameters: `{ action, entityType?, entityId?, metadata? }`
- Action names use past tense: `contact.created`, `contact.updated`, `contact.deleted`

### Supabase Clients
- `createServerClient` from `@/lib/supabase/server` — cookie-based, respects RLS
- `createServiceRoleClient` from `@/lib/supabase/admin` — bypasses RLS (only use for audit logs, admin operations)

### Error Handling
- Throw `new Error(error.message)` — the `EntityForm` component catches errors and displays them as toast notifications via sonner
- Zod `.parse()` throws `ZodError` on validation failure — also caught by EntityForm
