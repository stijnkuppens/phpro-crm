# Best Practices Audit Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all findings from the Supabase/Postgres and Next.js best practices audit.

**Architecture:** Independent fix groups executed in parallel. Database changes in a new migration. Next.js fixes are file-level edits. Settings page requires a server-first refactor.

**Tech Stack:** Postgres (Supabase migrations), Next.js 16, React 19, TypeScript

---

### Task 1: Supabase — Fix `get_user_role()` RLS performance (CRITICAL)

**Files:**
- Create: `supabase/migrations/00074_best_practices_fixes.sql`

The single most impactful fix. Alter `get_user_role()` to use `(select auth.uid())` so all 229 policy calls benefit without touching any policy definitions. Also adds trigram indexes for ILIKE search and a unique constraint on `pipeline_stages` for idempotent seeding.

- [ ] **Step 1: Create migration file with all DB fixes**

```sql
-- Fix get_user_role() — wrap auth.uid() in (select ...) for per-query evaluation
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.user_profiles WHERE id = (select auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Trigram indexes for ILIKE search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_accounts_name_trgm ON accounts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_accounts_domain_trgm ON accounts USING gin (domain gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_trgm ON contacts USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name_trgm ON contacts USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm ON contacts USING gin (email gin_trgm_ops);

-- Unique constraint on pipeline_stages for idempotent seeding
ALTER TABLE pipeline_stages ADD CONSTRAINT pipeline_stages_pipeline_name_unique UNIQUE (pipeline_id, name);

-- Dashboard RPC: compute open deal value in Postgres instead of fetching 10k rows
CREATE OR REPLACE FUNCTION public.get_open_deal_value()
RETURNS numeric LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE(SUM(amount * probability::numeric / 100), 0)
  FROM deals WHERE closed_at IS NULL;
$$;
GRANT EXECUTE ON FUNCTION public.get_open_deal_value() TO authenticated;
```

- [ ] **Step 2: Verify migration applies cleanly**

Run: `cd /Users/stijnkuppens/phpro/ai-projects/phpro_crm && npx supabase db reset`
Expected: No errors

---

### Task 2: Fix pipeline_stages data idempotency

**Files:**
- Modify: `supabase/data/002_pipelines.sql`

Change `ON CONFLICT (id) DO NOTHING` to `ON CONFLICT (pipeline_id, name) DO NOTHING` for pipeline_stages inserts, since they don't have stable IDs.

- [ ] **Step 1: Update conflict targets**

Replace all three `ON CONFLICT (id) DO NOTHING` for pipeline_stages with `ON CONFLICT (pipeline_id, name) DO NOTHING`.

---

### Task 3: Move division seed data from migration to data layer

**Files:**
- Modify: `supabase/migrations/00040_divisions.sql` — remove INSERT statements
- Create: `supabase/data/005_divisions.sql` — division + division_services seed data
- Modify: `supabase/seed.sql` — add `\ir data/005_divisions.sql`

- [ ] **Step 1: Create data/005_divisions.sql with the seed data**
- [ ] **Step 2: Remove INSERT blocks from 00040_divisions.sql**
- [ ] **Step 3: Remove redundant GRANT SELECT lines from 00040_divisions.sql**
- [ ] **Step 4: Add `\ir data/005_divisions.sql` to seed.sql**

---

### Task 4: Dashboard RPC — replace JS aggregation

**Files:**
- Modify: `src/features/dashboard/queries/get-dashboard-stats.ts`

Replace the 10k-row fetch + JS reduce with a single `supabase.rpc('get_open_deal_value')` call.

- [ ] **Step 1: Update getDashboardStats to use RPC**

Replace the deals query + JS reduce with:
```ts
supabase.rpc('get_open_deal_value')
```

---

### Task 5: Fix `notFound()` swallowed by catch (CRITICAL)

**Files:**
- Modify: `src/app/admin/users/[id]/page.tsx`

- [ ] **Step 1: Replace try/catch with null-check pattern**

```tsx
const profile = await getUser(id).catch(() => null);
if (!profile) notFound();
```

Also fix `generateMetadata` to use the same pattern.

---

### Task 6: Rename `config` → `proxyConfig` in proxy.ts

**Files:**
- Modify: `src/proxy.ts:89`

- [ ] **Step 1: Rename export**

```ts
export const proxyConfig = {
```

---

### Task 7: Fix module-scope date constants

**Files:**
- Modify: `src/app/admin/pipeline/page.tsx`
- Modify: `src/app/admin/prognose/page.tsx`
- Modify: `src/app/admin/revenue/page.tsx`

- [ ] **Step 1: Move date calculations inside function bodies**

Pipeline: move `PIPELINE_YEAR` into function body.
Prognose: move `FORECAST_YEAR` and `LAST_KNOWN_YEAR` into function body.
Revenue: derive year array dynamically from `currentYear`.

---

### Task 8: Add `global-error.tsx`

**Files:**
- Create: `src/app/global-error.tsx`

- [ ] **Step 1: Create global error boundary**

Must be `'use client'` and include `<html>` and `<body>` tags.

---

### Task 9: Fix Button/Link pattern in users/page.tsx

**Files:**
- Modify: `src/app/admin/users/page.tsx:17-19`

- [ ] **Step 1: Use render prop pattern**

```tsx
<Button render={<Link href="/admin/users/invite" />}>Gebruiker uitnodigen</Button>
```

---

### Task 10: Rename DashboardClient → DashboardView

**Files:**
- Modify: `src/features/dashboard/components/dashboard-client.tsx`

- [ ] **Step 1: Rename component and file**

Rename export to `DashboardView`, rename file to `dashboard-view.tsx`, update imports.

---

### Task 11: Fix SelectValue in revenue-page-client.tsx

**Files:**
- Modify: `src/features/revenue/components/revenue-page-client.tsx:57-59`

- [ ] **Step 1: Replace SelectValue with explicit label**

```tsx
<SelectTrigger className="w-28">
  {selectedYear}
</SelectTrigger>
```

---

### Task 12: Add `images.remotePatterns` to next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add Supabase hostname to remotePatterns**

---

### Task 13: Settings page — server-first refactor

**Files:**
- Create: `src/features/settings/queries/get-settings.ts`
- Create: `src/features/settings/actions/update-settings.ts`
- Create: `src/features/settings/types.ts`
- Create: `src/features/settings/components/settings-form.tsx` (client component)
- Modify: `src/app/admin/settings/page.tsx` (server component wrapper)

- [ ] **Step 1: Create settings feature module with query, action, types**
- [ ] **Step 2: Create SettingsForm client component**
- [ ] **Step 3: Convert page.tsx to server component**

---

### Task 14: Notifications page — add server prefetch

**Files:**
- Modify: `src/app/admin/notifications/page.tsx`
- Modify: `src/features/notifications/components/notification-list.tsx`

- [ ] **Step 1: Make page async, fetch notifications server-side**
- [ ] **Step 2: Add initialData prop to NotificationList**
