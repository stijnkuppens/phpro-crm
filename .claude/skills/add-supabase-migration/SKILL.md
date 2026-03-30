---
name: add-supabase-migration
description: Create a Supabase database migration with table, indexes, triggers, RLS policies, and realtime. Use this skill whenever the user wants to add a new database table, modify schema, add columns, create indexes, or set up storage buckets — even if they just say "I need a products table".
type: skill
---

# Add Supabase Migration

Creates numbered migration files following the project's conventions for tables, RLS, storage, and realtime.

## File Convention

- Location: `supabase/migrations/NNNNN_name.sql`
- 5-digit zero-padded, sequential numbering
- Check existing migrations to determine the next number

## Table Migration Template

```sql
-- {{Description}}
CREATE TABLE IF NOT EXISTS public.{{table}} (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- entity-specific fields
  name text NOT NULL,
  created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS {{table}}_created_at_idx ON public.{{table}} (created_at DESC);
CREATE INDEX IF NOT EXISTS {{table}}_name_idx ON public.{{table}} (name);
CREATE INDEX IF NOT EXISTS {{table}}_created_by_idx ON public.{{table}} (created_by);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.{{table}};
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.{{table}}
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.{{table}};
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

### Standard columns every table gets:
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### Common field types:
- `text` — strings (NOT varchar, this is Postgres best practice)
- `text NOT NULL` — required strings
- `integer` / `bigint` — numbers
- `numeric(10,2)` — money/decimal
- `boolean NOT NULL DEFAULT false` — flags
- `timestamptz` — dates/times
- `jsonb DEFAULT '{}'::jsonb` — flexible metadata
- `uuid REFERENCES public.other_table(id)` — foreign keys

### Unique constraints:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS {{table}}_email_unique ON public.{{table}} (email) WHERE email IS NOT NULL;
```

## RLS Policies

Always include in the same migration or a dedicated RLS migration. Use the `add-rls-policy` skill for the full pattern, but the standard set is:

```sql
ALTER TABLE public.{{table}} ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated
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

**Table policies** use `EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role ...)` — inlined for performance.

## Storage Bucket Migration

For file storage, create a bucket with policies. Storage policies differ — they use `public.get_user_role()` function instead of the EXISTS pattern:

```sql
INSERT INTO storage.buckets (id, name)
VALUES ('{{bucket}}', '{{bucket}}')
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authenticated_can_read_{{bucket}}" ON storage.objects;
CREATE POLICY "authenticated_can_read_{{bucket}}" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = '{{bucket}}');

DROP POLICY IF EXISTS "editors_can_upload_{{bucket}}" ON storage.objects;
CREATE POLICY "editors_can_upload_{{bucket}}" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = '{{bucket}}' AND public.get_user_role() IN ('admin', 'editor')
  );

DROP POLICY IF EXISTS "editors_can_update_{{bucket}}" ON storage.objects;
CREATE POLICY "editors_can_update_{{bucket}}" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = '{{bucket}}' AND public.get_user_role() IN ('admin', 'editor'))
  WITH CHECK (bucket_id = '{{bucket}}' AND public.get_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "admins_can_delete_{{bucket}}" ON storage.objects;
CREATE POLICY "admins_can_delete_{{bucket}}" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = '{{bucket}}' AND public.get_user_role() = 'admin'
  );
```

## After Migration Checklist

1. **Apply migration**: restart Docker Compose or run `npx supabase db push`
2. **Regenerate types**: `npm run types:generate` — updates `src/types/database.ts`
3. **Add permissions** to `src/types/acl.ts`: `'{{plural}}.read' | '{{plural}}.write' | '{{plural}}.delete'`
4. **Add role mappings** in `src/lib/acl.ts`
5. **Add route permission** in `src/middleware.ts`
