---
name: add-rls-policy
description: Create Row Level Security policies for Supabase tables or storage buckets. Use this skill whenever the user wants to add security policies, restrict access to a table, set up RLS, configure storage permissions, or mentions anything about who can read/write/delete data at the database level.
type: skill
---

# Add RLS Policy

Creates Row Level Security policies following the project's two distinct patterns — one for tables, one for storage.

## Pattern 1: Table Policies (inlined EXISTS)

Table policies use an inlined `EXISTS` subquery against `user_profiles` for performance. This avoids function call overhead per row.

### Standard CRUD set:

```sql
ALTER TABLE public.{{table}} ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated users
DROP POLICY IF EXISTS "authenticated_can_read_{{table}}" ON public.{{table}};
CREATE POLICY "authenticated_can_read_{{table}}" ON public.{{table}}
  FOR SELECT TO authenticated USING (true);

-- Insert: editors + admins
DROP POLICY IF EXISTS "editors_can_insert_{{table}}" ON public.{{table}};
CREATE POLICY "editors_can_insert_{{table}}" ON public.{{table}}
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Update: editors + admins
DROP POLICY IF EXISTS "editors_can_update_{{table}}" ON public.{{table}};
CREATE POLICY "editors_can_update_{{table}}" ON public.{{table}}
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Delete: admins only
DROP POLICY IF EXISTS "admins_can_delete_{{table}}" ON public.{{table}};
CREATE POLICY "admins_can_delete_{{table}}" ON public.{{table}}
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Naming convention:
`{who}_can_{verb}_{table}` — examples:
- `authenticated_can_read_contacts`
- `editors_can_insert_contacts`
- `admins_can_delete_contacts`

### Role checks:
- All authenticated: `USING (true)`
- Role-restricted read: `USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'viewer')))`
- Editors + admins: `role IN ('admin', 'editor')`
- Admins only: `role = 'admin'`

## Pattern 2: Storage Policies (get_user_role function)

Storage policies use the `public.get_user_role()` SQL function instead of the EXISTS subquery. This is because storage policies operate on `storage.objects` and the function approach works better there.

```sql
-- Read
DROP POLICY IF EXISTS "authenticated_can_read_{{bucket}}" ON storage.objects;
CREATE POLICY "authenticated_can_read_{{bucket}}" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = '{{bucket}}');

-- Upload
DROP POLICY IF EXISTS "editors_can_upload_{{bucket}}" ON storage.objects;
CREATE POLICY "editors_can_upload_{{bucket}}" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = '{{bucket}}' AND public.get_user_role() IN ('admin', 'editor')
  );

-- Update
DROP POLICY IF EXISTS "editors_can_update_{{bucket}}" ON storage.objects;
CREATE POLICY "editors_can_update_{{bucket}}" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = '{{bucket}}' AND public.get_user_role() IN ('admin', 'editor'))
  WITH CHECK (bucket_id = '{{bucket}}' AND public.get_user_role() IN ('admin', 'editor'));

-- Delete
DROP POLICY IF EXISTS "admins_can_delete_{{bucket}}" ON storage.objects;
CREATE POLICY "admins_can_delete_{{bucket}}" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = '{{bucket}}' AND public.get_user_role() = 'admin'
  );
```

**Key difference:** Storage UPDATE policies need both `USING` (which rows can be selected for update) and `WITH CHECK` (what values are allowed after update).

## Special Policy Patterns

### Owner-only access (user sees only their records):
```sql
CREATE POLICY "users_can_read_own_{{table}}" ON public.{{table}}
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_{{table}}" ON public.{{table}}
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
```

### Self-update only (e.g., user profiles):
```sql
CREATE POLICY "users_can_update_own_profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

### Block all writes (read-only table):
```sql
CREATE POLICY "insert_blocked" ON public.{{table}}
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "delete_blocked" ON public.{{table}}
  FOR DELETE TO authenticated USING (false);
```

## SQL Syntax Reference

- **FOR SELECT** — uses `USING (condition)` only
- **FOR INSERT** — uses `WITH CHECK (condition)` only (no USING)
- **FOR UPDATE** — uses `USING` (which rows) and optionally `WITH CHECK` (new values)
- **FOR DELETE** — uses `USING (condition)` only
- Always use `DROP POLICY IF EXISTS` before `CREATE POLICY` for idempotent migrations
- Always specify `TO authenticated` to scope to logged-in users

## The Role System

Three roles defined in `src/types/acl.ts`:
- `admin` — full access
- `editor` — read + write
- `viewer` — read only

The `prevent_role_change()` trigger at the database level blocks non-admin role escalation.
