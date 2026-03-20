# Fix-Before-Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical, high, and applicable medium issues in the 6 existing layer plan files so they can be executed without failures.

**Architecture:** This plan edits *plan markdown files only* — no code changes. Every task is a targeted search-and-replace or text insertion in a specific plan document. The fixes are ordered by dependency: migration blockers first, then cross-cutting patterns, then per-layer fixes.

**Tech Stack:** Markdown editing only. Reference files: `Taskfile.yml`, existing migrations, `src/app/layout.tsx`, `src/components/layout/admin-topbar.tsx`

**Review source:** `docs/superpowers/reviews/2026-03-13-flywheel-review-consolidated.md`

---

## File Inventory

All edits target these 6 files:
- `docs/superpowers/plans/2026-03-13-layer-1-foundation.md` (L1)
- `docs/superpowers/plans/2026-03-13-layer-2-core-crm.md` (L2)
- `docs/superpowers/plans/2026-03-13-layer-3-sales.md` (L3)
- `docs/superpowers/plans/2026-03-13-layer-4-consultancy.md` (L4)
- `docs/superpowers/plans/2026-03-13-layer-5-finance.md` (L5)
- `docs/superpowers/plans/2026-03-13-layer-6-hr.md` (L6)

Plus one codebase file:
- `Taskfile.yml` (fix types:generate output path)
- `supabase/seed.sql` (update for new role names)

---

## Chunk 1: Critical Migration Blockers (C1–C5)

### Task 1: Fix migration number collision — L1 `00010` vs L2 `00010` [C1]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-2-core-crm.md`

The collision: L1 uses `00010_indexation_indices.sql`. L2 also uses `00010_accounts.sql`. Supabase rejects duplicate numbers. Fix: renumber L2 migrations to `00011`–`00014`.

- [ ] **Step 1: Rename L2 migration `00010_accounts.sql` → `00011_accounts.sql`**

In `docs/superpowers/plans/2026-03-13-layer-2-core-crm.md`, find and replace ALL occurrences:
- `00010_accounts.sql` → `00011_accounts.sql`

- [ ] **Step 2: Rename L2 migration `00011_contacts.sql` → `00012_contacts.sql`**

Find and replace ALL occurrences:
- `00011_contacts.sql` → `00012_contacts.sql`

- [ ] **Step 3: Rename L2 migration `00012_communications.sql` → `00013_communications.sql`**

Find and replace ALL occurrences:
- `00012_communications.sql` → `00013_communications.sql`

- [ ] **Step 4: Rename L2 seed migration `00013_seed_core_crm.sql` → `00014_seed_core_crm.sql`**

Find and replace ALL occurrences:
- `00013_seed_core_crm.sql` → `00014_seed_core_crm.sql`

- [ ] **Step 5: Verify no `00010` references remain in L2**

```bash
grep -n "00010" docs/superpowers/plans/2026-03-13-layer-2-core-crm.md
```

Expected: no results.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-2-core-crm.md
git commit -m "fix(plans): renumber L2 migrations 00011-00014 to avoid collision with L1"
```

---

### Task 2: Add bridge migration to drop old contacts table [C2]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-1-foundation.md`

Existing migration `00002_contacts_example.sql` creates an old `contacts` table. L2 tries to `CREATE TABLE contacts` with a completely different schema. We need to add a cleanup step to L1 that drops the old table before L2 runs.

- [ ] **Step 1: Add new Task 6b after Task 6 (indexation_indices) in L1**

In L1 plan, after the Task 6 section (indexation_indices migration `00010`) and before the `## Chunk 4` heading, insert this new task:

```markdown
---

### Task 6b: Drop old contacts table and stale RLS policies

**Files:**
- Create: `supabase/migrations/00010b_drop_old_contacts.sql`

The old `contacts` table from `00002_contacts_example.sql` has an incompatible schema (single `name` column) that will block Layer 2's new `contacts` table. Drop it now.

- [ ] **Step 1: Create the bridge migration**

Create `supabase/migrations/00010b_drop_old_contacts.sql`:

```sql
-- Drop old contacts table from starter template (00002_contacts_example.sql)
-- Layer 2 will recreate this table with the CRM schema
DROP POLICY IF EXISTS "authenticated_can_read_contacts" ON public.contacts;
DROP POLICY IF EXISTS "editors_can_insert_contacts" ON public.contacts;
DROP POLICY IF EXISTS "editors_can_update_contacts" ON public.contacts;
DROP POLICY IF EXISTS "admins_can_delete_contacts" ON public.contacts;
DROP TABLE IF EXISTS public.contacts CASCADE;
```

- [ ] **Step 2: Run the migration**

```bash
task db:migrate
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00010b_drop_old_contacts.sql
git commit -m "chore: drop old contacts table to prepare for CRM schema"
```
```

- [ ] **Step 2: Verify the task was inserted correctly**

```bash
grep -n "00010b_drop_old_contacts" docs/superpowers/plans/2026-03-13-layer-1-foundation.md
```

Expected: at least 3 matches (file reference, step 1, step 3).

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-1-foundation.md
git commit -m "fix(plans): add bridge migration to drop old contacts table in L1"
```

---

### Task 3: Remove duplicate `indexation_indices` from L4 [C3]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-4-consultancy.md`

L1 already creates `indexation_indices` in `00010_indexation_indices.sql`. L4's `00033_indexation.sql` duplicates the CREATE TABLE and seed. Remove the duplicate.

- [ ] **Step 1: In L4, find the `indexation_indices` section in migration `00033_indexation.sql`**

Look for this block (around lines 404-422):
```sql
-- ── indexation_indices ───────────────────────────────────────────────────────
CREATE TABLE indexation_indices (
```

And the seed block (around line 645):
```sql
INSERT INTO indexation_indices (name, value) VALUES
```

- [ ] **Step 2: Replace the CREATE TABLE block with a comment**

Replace the entire `indexation_indices` CREATE TABLE block (from `-- ── indexation_indices` through the `CREATE POLICY "indexation_indices_write"` closing line) with:

```sql
-- ── indexation_indices ───────────────────────────────────────────────────────
-- Already created in Layer 1 (00010_indexation_indices.sql) — do not recreate
```

- [ ] **Step 3: Replace the seed INSERT with a comment**

Replace `INSERT INTO indexation_indices (name, value) VALUES` and its data lines with:

```sql
-- indexation_indices seed already in Layer 1 (00010_indexation_indices.sql)
```

- [ ] **Step 4: Verify no CREATE TABLE indexation_indices remains**

```bash
grep -n "CREATE TABLE indexation_indices" docs/superpowers/plans/2026-03-13-layer-4-consultancy.md
```

Expected: no results.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-4-consultancy.md
git commit -m "fix(plans): remove duplicate indexation_indices from L4"
```

---

### Task 4: Fix role migration to handle existing data [C4]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-1-foundation.md`

The current L1 migration `00008_update_roles.sql` only changes the CHECK constraint. It will fail if any `user_profiles` row has role `editor` or `viewer`. Also, `handle_new_user()` inserts with no role (defaults to `viewer` which will be invalid).

- [ ] **Step 1: Find the 00008 migration SQL in L1**

Search for `ALTER TABLE user_profiles DROP CONSTRAINT` in L1 plan. This is in Task 3 Step 3.

- [ ] **Step 2: Add data migration BEFORE the constraint change**

Insert these lines immediately BEFORE the `ALTER TABLE user_profiles DROP CONSTRAINT` line:

```sql
-- Migrate existing users from old roles to new roles
UPDATE user_profiles SET role = 'sales_rep' WHERE role = 'editor';
UPDATE user_profiles SET role = 'marketing' WHERE role = 'viewer';

-- Update default role for new user trigger
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'sales_rep';
```

- [ ] **Step 3: Add `SET search_path = public` to the `get_user_role` function**

Find the `CREATE OR REPLACE FUNCTION get_user_role()` in the migration SQL. After the `SECURITY DEFINER` line, ensure it includes:
```sql
SET search_path = public
```

So the full function reads:
```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;
```

- [ ] **Step 4: Add handle_new_user() update to the migration**

After the `get_user_role` function, add:

```sql
-- Update handle_new_user to use valid default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'sales_rep'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-1-foundation.md
git commit -m "fix(plans): add data migration for role change in L1"
```

---

### Task 5: Add storage policy update migration [C5]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-1-foundation.md`

After `00008_update_roles.sql` changes roles, existing storage policies in `00004_storage_buckets.sql` reference `'editor'` — a role that no longer exists. Non-admin users get locked out of file uploads.

- [ ] **Step 1: Add storage policy update to the 00008 migration SQL in L1**

At the end of the `00008_update_roles.sql` SQL block, append:

```sql
-- ── Update storage policies to use new role names ─────────────────────
-- Old policies reference 'editor' which no longer exists

DROP POLICY IF EXISTS "editors_can_upload_avatars" ON storage.objects;
CREATE POLICY "crm_users_can_upload_avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success')
  );

DROP POLICY IF EXISTS "editors_can_update_avatars" ON storage.objects;
CREATE POLICY "crm_users_can_update_avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (bucket_id = 'avatars' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

DROP POLICY IF EXISTS "editors_can_upload_documents" ON storage.objects;
CREATE POLICY "crm_users_can_upload_documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success')
  );

DROP POLICY IF EXISTS "editors_can_update_documents" ON storage.objects;
CREATE POLICY "crm_users_can_update_documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (bucket_id = 'documents' AND public.get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

-- ── Update app_settings policy to use new roles ──────────────────────
DROP POLICY IF EXISTS "authenticated_can_read_settings" ON public.app_settings;
CREATE POLICY "authenticated_can_read_settings" ON public.app_settings
  FOR SELECT TO authenticated USING (true);
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-1-foundation.md
git commit -m "fix(plans): add storage + settings policy updates for new roles in L1"
```

---

## Chunk 2: High-Priority Cross-Cutting Fixes (H1–H3, H9, H13)

### Task 6: Replace all `npx supabase` commands with Docker Compose equivalents [H1]

**Files:**
- Modify: ALL 6 plan files

The project uses self-hosted Supabase via Docker Compose. `npx supabase db push` and `npx supabase migration up` don't work. The Taskfile defines `task db:migrate` (runs all .sql files via `docker compose exec -T db psql`).

- [ ] **Step 1: Replace in L1**

In `docs/superpowers/plans/2026-03-13-layer-1-foundation.md`, find and replace:
- `npx supabase migration up` → `task db:migrate`
- `npx supabase db reset` → `task db:reset`
- `npx supabase gen types typescript --local > src/types/database.ts` → `task types:generate`
- `If you need a clean slate (will wipe all local data): \`npx supabase db reset\`` → `If you need a clean slate (will wipe all local data): \`task db:reset\``

- [ ] **Step 2: Replace in L2**

In `docs/superpowers/plans/2026-03-13-layer-2-core-crm.md`, find and replace ALL occurrences:
- `npx supabase db push` → `task db:migrate`
- `npx supabase db push && task types:generate` → `task db:migrate && task types:generate`

- [ ] **Step 3: Replace in L3**

In `docs/superpowers/plans/2026-03-13-layer-3-sales.md`, find and replace ALL occurrences:
- `npx supabase db push` → `task db:migrate`
- `npx supabase db push && task types:generate` → `task db:migrate && task types:generate`

- [ ] **Step 4: Replace in L4**

In `docs/superpowers/plans/2026-03-13-layer-4-consultancy.md`, find and replace ALL occurrences:
- `npx supabase db push` → `task db:migrate`
- `npx supabase db push && task types:generate` → `task db:migrate && task types:generate`

- [ ] **Step 5: Replace in L5**

In `docs/superpowers/plans/2026-03-13-layer-5-finance.md`, find and replace ALL occurrences:
- `npx supabase db push` → `task db:migrate`
- `npx supabase db push && task types:generate` → `task db:migrate && task types:generate`

- [ ] **Step 6: Replace in L6**

In `docs/superpowers/plans/2026-03-13-layer-6-hr.md`, find and replace ALL occurrences:
- `npx supabase db push` → `task db:migrate`
- `npx supabase db push && task types:generate` → `task db:migrate && task types:generate`

- [ ] **Step 7: Verify no `npx supabase` references remain**

```bash
grep -rn "npx supabase" docs/superpowers/plans/
```

Expected: no results.

- [ ] **Step 8: Commit**

```bash
git add docs/superpowers/plans/
git commit -m "fix(plans): replace npx supabase commands with task db:migrate"
```

---

### Task 7: Fix `types:generate` output file path [H2]

**Files:**
- Modify: `Taskfile.yml`

The Taskfile outputs to `src/types/database.types.ts` but all codebase imports use `@/types/database` (= `src/types/database.ts`). Generated types go to the wrong file.

- [ ] **Step 1: Fix the output path in Taskfile.yml**

In `Taskfile.yml`, find:
```
> src/types/database.types.ts
```

Replace with:
```
> src/types/database.ts
```

- [ ] **Step 2: Commit**

```bash
git add Taskfile.yml
git commit -m "fix: types:generate output to database.ts to match imports"
```

---

### Task 8: Replace all `npx next build` verification with `task typecheck` [M13]

**Files:**
- Modify: ALL 6 plan files

`npx next build` takes 30-60s per iteration. `task typecheck` (= `npx tsc --noEmit`) takes 5-10s. For compile-fix loops, the faster command prevents agent time waste.

- [ ] **Step 1: Replace in all 6 plans**

In ALL plan files, find and replace:
- `npx next build` → `task typecheck`

Exception: keep ONE `npx next build` at the very last verification step of each layer plan (the final "verify everything compiles" step) as a full build sanity check.

For each file:
- L1: replace lines 77, 359, 1534 with `task typecheck`. Keep line 1578 as `task build` (final verification).
- L2: replace line 2380 — this IS the final step, change to `task build`.
- L3: replace line 2526 — final step, change to `task build`.
- L4: replace line 2322 — final step, change to `task build`.
- L5: replace line 1680 — final step, change to `task build`.
- L6: replace line 1650 — final step, change to `task build`.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/
git commit -m "fix(plans): use task typecheck for faster compile verification"
```

---

### Task 9: Fix L1 layout.tsx snippet to preserve existing wrappers [H9]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-1-foundation.md`

Task 4 Step 5 shows a bare layout that would destroy ThemeProvider, Toaster, Geist font, metadata, and suppressHydrationWarning. Replace with the complete merged layout.

- [ ] **Step 1: Find Task 4 Step 5 in L1**

Search for `NextIntlClientProvider` in L1 plan. Find the code block that shows the layout.tsx modification.

- [ ] **Step 2: Replace the entire code snippet**

Replace the layout.tsx code block with:

````markdown
```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'PHPro CRM',
  description: 'PHPro CRM application',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={cn('font-sans', geist.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```
````

Also update the step text to remove "Preserve any existing wrapping" and replace with: "Replace the entire `src/app/layout.tsx` with the merged version below (preserves ThemeProvider, Toaster, Geist font, metadata):"

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-1-foundation.md
git commit -m "fix(plans): complete merged layout.tsx preserving existing wrappers"
```

---

### Task 10: Add `revalidatePath` instruction to all plans [H3]

**Files:**
- Modify: ALL 6 plan files

No server action across any plan calls `revalidatePath`. Since all queries use `cache()`, stale data is served after every mutation. Add a cross-cutting instruction at the top of each plan AND fix the specific action code snippets.

- [ ] **Step 1: Add revalidatePath note to L1 plan header**

After the `**Spec:**` line in L1, add:

```markdown
**IMPORTANT — Cross-cutting pattern:** Every server action that performs a write (create/update/delete) MUST call `revalidatePath('/admin/<entity>')` before returning. Import: `import { revalidatePath } from 'next/cache';`
```

- [ ] **Step 2: Add the same note to L2–L6 plan headers**

Add the identical note after the `**Spec:**` or `**Tech Stack:**` line in each plan.

- [ ] **Step 3: In L2, add revalidatePath to all server action code snippets**

For each server action code block in L2, add after the `logAction` call and before the `return`:
- `createAccount`: add `revalidatePath('/admin/accounts');`
- `updateAccount`: add `revalidatePath('/admin/accounts');`
- `deleteAccount`: add `revalidatePath('/admin/accounts');`
- `createContact`: add `revalidatePath('/admin/contacts');`
- `updateContact`: add `revalidatePath('/admin/contacts');`
- `deleteContact`: add `revalidatePath('/admin/contacts');`
- `createCommunication`: add `revalidatePath('/admin/accounts');`
- `updateCommunication`: add `revalidatePath('/admin/accounts');`
- `deleteCommunication`: add `revalidatePath('/admin/accounts');`

Each action needs `import { revalidatePath } from 'next/cache';` added to its imports.

- [ ] **Step 4: In L3, add revalidatePath to all server action code snippets**

- `createDeal` / `updateDeal` / `deleteDeal`: add `revalidatePath('/admin/deals');`
- `closeDeal`: add `revalidatePath('/admin/deals');`
- `createActivity` / `updateActivity` / `deleteActivity`: add `revalidatePath('/admin/activities');`
- `createTask` / `updateTask` / `deleteTask`: add `revalidatePath('/admin/tasks');`

- [ ] **Step 5: In L4, add revalidatePath to all server action code snippets**

- Bench actions: add `revalidatePath('/admin/bench');`
- Consultant actions: add `revalidatePath('/admin/consultants');`
- Contract/rate actions: add `revalidatePath('/admin/accounts');`
- Indexation actions: add `revalidatePath('/admin/accounts');`

- [ ] **Step 6: In L5, add revalidatePath to all server action code snippets**

- `upsertRevenueEntry`: add `revalidatePath('/admin/revenue');`
- `savePrognose`: add `revalidatePath('/admin/prognose');`
- Pipeline entry actions: add `revalidatePath('/admin/pipeline');`
- Account revenue actions: add `revalidatePath('/admin/accounts');`

- [ ] **Step 7: In L6, add revalidatePath to all server action code snippets**

- All HR record actions: add `revalidatePath('/admin/people');`
- Equipment actions: add `revalidatePath('/admin/materials');`

- [ ] **Step 8: Commit**

```bash
git add docs/superpowers/plans/
git commit -m "fix(plans): add revalidatePath to all server actions across all layers"
```

---

## Chunk 3: High-Priority Per-Layer Fixes (H4–H8, H10–H11)

### Task 11: Fix L1 topbar LocaleSwitcher placement [M-L1]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-1-foundation.md`

Task 7 Step 2 says "add LocaleSwitcher next to the theme toggle" without showing exact placement.

- [ ] **Step 1: Replace the vague instruction with explicit placement**

Find the Step 2 text about LocaleSwitcher in L1 Task 7. Replace it with:

```markdown
In `src/components/layout/admin-topbar.tsx`:
1. Add `import { useLocale } from 'next-intl';` to the imports
2. Add this function INSIDE the file, before `AdminTopbar`:

```tsx
function LocaleSwitcher() {
  const locale = useLocale();

  const switchLocale = (newLocale: string) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <button
      onClick={() => switchLocale(locale === 'nl' ? 'en' : 'nl')}
      className="rounded-lg border px-2 py-1.5 text-xs font-medium hover:bg-accent"
      type="button"
    >
      {locale === 'nl' ? 'EN' : 'NL'}
    </button>
  );
}
```

3. In the `AdminTopbar` JSX, add `<LocaleSwitcher />` immediately BEFORE the `<ThemeToggle />` element on line 48:

```tsx
      <LocaleSwitcher />
      <ThemeToggle />
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-1-foundation.md
git commit -m "fix(plans): explicit LocaleSwitcher placement in topbar"
```

---

### Task 12: Add L1 seed.sql update for new roles

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-1-foundation.md`

`supabase/seed.sql` creates users with roles `editor` and `viewer` — but after the migration those roles don't exist. On `task db:reset`, the seed will try to set role `editor` which violates the new CHECK constraint.

- [ ] **Step 1: Add a step to L1 Task 3 to update seed.sql**

After the migration steps in Task 3, add a step:

```markdown
- [ ] **Step N: Update `supabase/seed.sql` for new roles**

In `supabase/seed.sql`:
1. Replace `SET role = 'editor'` with `SET role = 'sales_manager'`
2. Replace `SET role = 'viewer'` with `SET role = 'marketing'`
3. Replace `'editor@example.com'` with `'manager@example.com'` and `'Editor User'` with `'Sales Manager'`
4. Replace `'viewer@example.com'` with `'marketing@example.com'` and `'Viewer User'` with `'Marketing User'`
5. Remove the old contacts INSERT block (lines 81-103) — the contacts table is being dropped
6. Rename variable `editor_id` → `manager_id` and `viewer_id` → `marketing_id`
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-1-foundation.md
git commit -m "fix(plans): add seed.sql role update to L1"
```

---

### Task 13: Add missing `/admin/accounts/new` page to L2 [H11]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-2-core-crm.md`

Spec lists this route but no plan creates it. The `createAccount` action exists.

- [ ] **Step 1: Add a task to L2 for the accounts/new page**

After L2's account list page task, add:

```markdown
### Task N: Account create page

**Files:**
- Create: `src/app/admin/accounts/new/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/admin/accounts/new/page.tsx`:

```tsx
import { requirePermission } from '@/lib/require-permission';
import { AccountForm } from '@/features/accounts/components/account-form';

export default async function NewAccountPage() {
  await requirePermission('accounts.write');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nieuw Account</h1>
      <AccountForm />
    </div>
  );
}
```

Note: `AccountForm` is created in the form/modal task (see Task N+1).

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/accounts/new/
git commit -m "feat(accounts): add create account page"
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-2-core-crm.md
git commit -m "fix(plans): add /admin/accounts/new page to L2"
```

---

### Task 14: Add form/modal tasks to L2 [H6-partial]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-2-core-crm.md`

L2 creates server actions for accounts, contacts, and communications but has no form components.

- [ ] **Step 1: Add a UI forms task to L2**

After the last L2 task (before the final verification), insert:

```markdown
### Task N: Account, Contact, and Communication form components

**Files:**
- Create: `src/features/accounts/components/account-form.tsx`
- Create: `src/features/contacts/components/contact-form.tsx`
- Create: `src/features/communications/components/communication-modal.tsx`

Each form component should:
1. Use the existing Zod schema from the feature's `types.ts`
2. Use the `Modal` component from `@/components/shared/modal`
3. Call the existing server action (create or update) on submit
4. Accept an optional `defaultValues` prop for edit mode
5. Use `useTranslations` for field labels

- [ ] **Step 1: Create `account-form.tsx`**

Build a form with fields matching `accountFormSchema`:
- `name` (text, required)
- `sector` (text)
- `status` (select: prospect/actief/inactief/ex-klant)
- `account_manager_id` (user select)
- `notes` (textarea)
- `phpro_contract` (text)

Use `createAccount` / `updateAccount` server actions. After submit: close modal, toast success.

- [ ] **Step 2: Create `contact-form.tsx`**

Fields matching `contactFormSchema`:
- `first_name`, `last_name` (text, required)
- `email`, `phone`, `mobile` (text)
- `role` (select from CONTACT_ROLES)
- `is_steerco` (checkbox)
- `account_id` (hidden or account select)

- [ ] **Step 3: Create `communication-modal.tsx`**

Fields matching `communicationFormSchema`:
- `type` (select: email/note/meeting/call)
- `subject` (text)
- `body` (rich text via Plate editor placeholder — textarea for now)
- `to` (text)
- `account_id` (hidden)
- `deal_id` (optional deal select)

- [ ] **Step 4: Wire forms into list/detail pages**

- Add "Nieuw Account" button to accounts list page header, linking to `/admin/accounts/new`
- Add "Nieuw Contact" button to contacts list page header, opening ContactForm modal
- Add "Nieuwe Communicatie" button to AccountCommunicationsTab, opening CommunicationModal
- Add edit buttons to account detail, contact rows, communication rows

- [ ] **Step 5: Commit**

```bash
git add src/features/accounts/components/ src/features/contacts/components/ src/features/communications/components/
git commit -m "feat: add account, contact, and communication form components"
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-2-core-crm.md
git commit -m "fix(plans): add form/modal tasks to L2"
```

---

### Task 15: Add form/modal tasks to L3 [H6-partial]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-3-sales.md`

- [ ] **Step 1: Add a UI forms task to L3**

Insert a task covering:
- `src/features/deals/components/deal-form.tsx` — create/edit deal modal
- `src/features/deals/components/close-deal-modal.tsx` — won/lost/longterm close flow
- `src/features/activities/components/activity-form.tsx` — create/edit activity modal
- `src/features/tasks/components/task-form.tsx` — create/edit task modal

Each form should use existing Zod schemas and server actions. Wire into list pages with "Nieuw" buttons and row edit/delete actions.

- [ ] **Step 2: Add account detail stub replacement task to L3**

Insert a task: "Replace account detail Deals tab stub with `AccountDealsTab` showing deals filtered by account_id, using `getDealsByAccount` query."

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-3-sales.md
git commit -m "fix(plans): add form/modal and stub replacement tasks to L3"
```

---

### Task 16: Add form/modal and stub replacement tasks to L4 [H6-partial, H8-partial]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-4-consultancy.md`

- [ ] **Step 1: Add UI tasks to L4**

Insert tasks covering:
- `src/features/bench/components/bench-detail-modal.tsx` — view/edit bench consultant
- `src/features/bench/components/bench-form.tsx` — create/edit bench consultant
- `src/features/consultants/components/consultant-detail-modal.tsx`
- `src/features/consultants/components/stop-consultant-modal.tsx`
- `src/features/consultants/components/extend-consultant-modal.tsx`
- `src/features/consultants/components/rate-change-modal.tsx`
- `src/features/indexation/components/indexation-wizard.tsx` — 4-step modal wizard (configure → simulate → negotiate → approve)
- `src/features/contracts/components/contracts-tab.tsx` — account detail Contracten tab content

- [ ] **Step 2: Add stub replacement tasks**

- Replace account detail "Contracten & Tarieven" stub with `ContractsTab`
- Replace account detail "Consultants" stub with `AccountConsultantsTab`

- [ ] **Step 3: Add missing `update-active-consultant.ts` implementation step [M14]**

In L4 Task 6 file inventory, there's a listed file `update-active-consultant.ts` with no step to create it. Add a step:

```markdown
- [ ] **Step N: Create `src/features/consultants/actions/update-active-consultant.ts`**

Standard update pattern: `requirePermission('consultants.write')` → Zod parse → `supabase.from('active_consultants').update(parsed).eq('id', id)` → `logAction` → `revalidatePath('/admin/consultants')`.
```

- [ ] **Step 4: Add `indexation_config` types/query/action [M15]**

Add steps to create:
- `IndexationConfig` type in `src/features/indexation/types.ts`
- `getIndexationConfig(accountId)` query
- `upsertIndexationConfig` action

- [ ] **Step 5: Fix verification step referencing `/admin/accounts/[id]` [M-L4]**

Find the verification step in Task 11 that says to visit `/admin/accounts/[id]` Contracten tab. Replace with:

```markdown
Verify contract queries work by running in Supabase Studio:
`SELECT * FROM contracts WHERE account_id = 'a0000000-0000-0000-0000-000000000001';`
Full Contracten tab UI verification deferred to account detail integration.
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-4-consultancy.md
git commit -m "fix(plans): add form/modal, stub replacement, and missing action tasks to L4"
```

---

### Task 17: Add form/modal, stub replacement, and nav tasks to L5 [H6-partial, H8-partial, M19]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-5-finance.md`

- [ ] **Step 1: Add sidebar navigation task [M19]**

Insert a task to modify `src/components/layout/admin-sidebar.tsx` adding nav entries for `/admin/revenue`, `/admin/prognose`, `/admin/pipeline` under the "Analyse" section. (Note: L1 already creates the Analyse section — verify the links match.)

- [ ] **Step 2: Add OmzetTab task and account detail stub replacement [H8]**

Add task: Create `src/features/revenue/components/omzet-tab.tsx` — editable table showing `account_revenue` rows grouped by year with add/edit/delete. Replace account detail "Omzet" stub.

- [ ] **Step 3: Fix `account_revenue` permission [M-L5]**

Search for `requirePermission('accounts.write')` in L5's account revenue action code. Replace with `requirePermission('revenue.write')`.

- [ ] **Step 4: Add `logAction` to `upsertRevenueEntry` [M24]**

Find the `upsertRevenueEntry` action code. Add `await logAction(...)` after the upsert.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-5-finance.md
git commit -m "fix(plans): add nav, OmzetTab, permission fix, and audit logging to L5"
```

---

### Task 18: Add CRUD modals to L6 HR tabs [H10]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-6-hr.md`

All 5 tab components (salary, equipment, documents, leave, evaluations) are read-only. Server actions exist but are unreachable.

- [ ] **Step 1: Add a UI forms task to L6**

Insert a task covering CRUD modals for each tab:
- `src/features/people/components/salary-form.tsx` — add/edit salary record
- `src/features/people/components/equipment-form.tsx` — add/edit equipment
- `src/features/people/components/hr-document-form.tsx` — upload HR document
- `src/features/people/components/leave-form.tsx` — add/edit leave balance
- `src/features/people/components/evaluation-form.tsx` — add/edit evaluation
- `src/features/people/components/employee-form.tsx` — create/edit employee
- `src/features/people/components/children-form.tsx` — manage employee children

Each tab component needs:
1. An "Toevoegen" button in the card header
2. A modal form using the existing Zod schema
3. Edit/delete buttons per row
4. Calls to `createHrRecord` / `updateHrRecord` / `deleteHrRecord`

Also add "Medewerker toevoegen" button on the people list page using `EmployeeForm`.

- [ ] **Step 2: Add `requirePermission` guards to pages [M20]**

Add to the people page and materials page server components:
```tsx
await requirePermission('hr.read');  // people page
await requirePermission('equipment.read');  // materials page
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-6-hr.md
git commit -m "fix(plans): add CRUD modals, employee form, and permission guards to L6"
```

---

## Chunk 4: Medium Fixes (Simple Plan Edits)

### Task 19: Add business logic utility tasks [H7]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-2-core-crm.md`
- Modify: `docs/superpowers/plans/2026-03-13-layer-4-consultancy.md`

- [ ] **Step 1: Add shared formatting utilities task to L2**

Insert a task to create `src/lib/format.ts`:

```markdown
### Task N: Shared formatting utilities

**Files:**
- Create: `src/lib/format.ts`

- [ ] **Step 1: Create `src/lib/format.ts`**

```ts
import { useFormatter } from 'next-intl';

/** Format a number as EUR currency */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(value);
}

/** Format a date as DD/MM/YYYY */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-BE').format(new Date(date));
}

/** Format a datetime as DD/MM/YYYY HH:mm */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date));
}

/** Days between now and a target date (negative = past) */
export function daysUntilDate(date: string | Date): number {
  const target = new Date(date);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
```
```

- [ ] **Step 2: Add business logic utilities task to L4**

Insert a task to create `src/lib/business-logic.ts`:

```markdown
### Task N: Business logic utilities

**Files:**
- Create: `src/lib/business-logic.ts`

Port these functions from `demo_crm/src/utils.ts`:

- `werkdagenTussen(start, end)` — count working days between two dates
- `calcContactDatum(einddatum, opzegtermijn)` — end_date minus notice minus 30 days
- `getEffectiveServices(manualServices, hasActiveConsultants)` — manual services + auto "Consultancy" if consultants active
- `calcSlaTotal(slaRates)` — sum of (rate * quantity) for SLA items
- `calcTarief(rate, startDate, endDate)` — rate * working days
- `eindVanJaar(date)` — December 31 of the given date's year
```
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-2-core-crm.md docs/superpowers/plans/2026-03-13-layer-4-consultancy.md
git commit -m "fix(plans): add business logic and formatting utility tasks"
```

---

### Task 20: Fix L3 specific issues [M4–M6, L3-seeds]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-3-sales.md`

- [ ] **Step 1: Fix closeDeal longterm probability [M5]**

Find the line in L3's `close-deal.ts` action code:
```
probability: parsed.data.closed_type === 'won' ? 100 : 0
```

Replace with:
```
probability: parsed.data.closed_type === 'won' ? 100 : parsed.data.closed_type === 'longterm' ? stage.probability : 0
```

Also ensure the `stage` variable SELECT includes `probability`:
```sql
.select('id, probability')
```

- [ ] **Step 2: Fix longterm_date conditional validation [M6]**

Find the `closeDealSchema` definition. After the schema, add:
```ts
.refine(
  (data) => data.closed_type !== 'longterm' || !!data.longterm_date,
  { message: 'Follow-up datum is verplicht voor longterm deals', path: ['longterm_date'] }
)
```

- [ ] **Step 3: Fix seed data contact UUID [L3-seed]**

Search for `c0000000-0000-0000-0000-000000000005` in L3. Replace with `c0000000-0000-0000-0000-000000000004` (an existing contact UUID from L2 seed).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-3-sales.md
git commit -m "fix(plans): fix longterm probability, date validation, seed UUID in L3"
```

---

### Task 21: Fix L4 bench priority sort [M4]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-4-consultancy.md`

- [ ] **Step 1: Find the bench query sort**

Search for `.order('priority'` in L4.

- [ ] **Step 2: Replace with application-side sort**

After the Supabase query, add a sort step:

```ts
const priorityOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 };
const sorted = data?.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)) ?? [];
return sorted;
```

Remove the `.order('priority', { ascending: true })` from the Supabase query.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-03-13-layer-4-consultancy.md
git commit -m "fix(plans): fix bench priority sort order in L4"
```

---

### Task 22: Add ON CONFLICT to non-idempotent seeds [M2]

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-1-foundation.md`
- Modify: `docs/superpowers/plans/2026-03-13-layer-4-consultancy.md`
- Modify: `docs/superpowers/plans/2026-03-13-layer-5-finance.md`

- [ ] **Step 1: In L1, add ON CONFLICT to pipeline seeds**

Find the `INSERT INTO pipelines` and `INSERT INTO pipeline_stages` statements. Add `ON CONFLICT (id) DO NOTHING` to each.

- [ ] **Step 2: In L4, add ON CONFLICT to consultancy seeds**

Find all INSERT statements in the L4 seed migration. Add `ON CONFLICT (id) DO NOTHING` or `ON CONFLICT DO NOTHING` to each.

- [ ] **Step 3: In L5, add ON CONFLICT to finance seeds**

Find all INSERT statements in the L5 seed migration. Add `ON CONFLICT (id) DO NOTHING` or `ON CONFLICT DO NOTHING` to each.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/
git commit -m "fix(plans): make all seed data idempotent with ON CONFLICT"
```

---

### Task 23: Fix L5 and L6 remaining medium issues

**Files:**
- Modify: `docs/superpowers/plans/2026-03-13-layer-5-finance.md`
- Modify: `docs/superpowers/plans/2026-03-13-layer-6-hr.md`

- [ ] **Step 1: Fix L5 hardcoded years [M9]**

In L5, find `years={[2023, 2024, 2025, 2026]}` and `FORECAST_YEAR = 2026`. Add a note:

```markdown
> **Note:** Replace hardcoded years with dynamic derivation. Add a query `getRevenueYears()` that runs `SELECT DISTINCT year FROM revenue_entries ORDER BY year`. Derive `FORECAST_YEAR` from `new Date().getFullYear()`.
```

- [ ] **Step 2: Fix L6 salary auto-update date ordering [M18]**

In L6, find the salary history create handler. Add a note to the plan:

```markdown
> **Note:** After inserting a salary record, update `employees.gross_salary` from the LATEST record by date, not the just-inserted one:
> `SELECT gross_salary FROM salary_history WHERE employee_id = $1 ORDER BY date DESC LIMIT 1`
```

- [ ] **Step 3: Fix L6 employee_children RLS overlap**

Find the `employee_children` policies. Replace `FOR ALL` policy with separate `FOR INSERT`, `FOR UPDATE`, `FOR DELETE` policies matching the pattern used on other L6 tables.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/
git commit -m "fix(plans): fix hardcoded years, salary ordering, and RLS overlap"
```

---

### Task 24: Final verification

- [ ] **Step 1: Verify no `npx supabase` references remain**

```bash
grep -rn "npx supabase" docs/superpowers/plans/
```

Expected: no results.

- [ ] **Step 2: Verify no `00010_accounts` collision remains**

```bash
grep -rn "00010_accounts" docs/superpowers/plans/
```

Expected: no results.

- [ ] **Step 3: Verify `revalidatePath` pattern note exists in all plans**

```bash
grep -l "revalidatePath" docs/superpowers/plans/2026-03-13-layer-*.md | wc -l
```

Expected: 6.

- [ ] **Step 4: Verify no duplicate indexation_indices CREATE**

```bash
grep -rn "CREATE TABLE indexation_indices" docs/superpowers/plans/
```

Expected: only 1 result (in L1).

- [ ] **Step 5: Final commit**

```bash
git add docs/superpowers/plans/ Taskfile.yml
git commit -m "fix(plans): complete fix-before-implementation pass — all review items addressed"
```
