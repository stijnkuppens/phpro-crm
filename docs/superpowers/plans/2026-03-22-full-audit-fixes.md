# Full Codebase Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 40+ findings from the 4-agent codebase audit — security, performance, architecture, SOLID, and conventions.

**Architecture:** Eight waves ordered by dependency and risk. Security first (SQL migrations), then foundational performance (JWT role claims), then progressively lower-severity fixes. Each wave is independently committable.

**Tech Stack:** Next.js 16, React 19, Supabase (Postgres), TypeScript, Tailwind CSS v4

**Deployment note:** Wave 2 (JWT role claims) requires a sequential deploy: run the migration first to backfill `raw_app_meta_data`, then deploy code changes. During transition, the proxy falls back to a DB query if `app_metadata.role` is absent (see Task 3).

---

## Wave 1: Security — SECURITY DEFINER RPC Auth Guards

### Task 1: Add auth guards to SECURITY DEFINER RPCs

**Files:**
- Create: `supabase/migrations/00075_rpc_auth_guards.sql`

**Context:** `save_prognose`, `approve_indexation`, and `link_consultant_to_account` are SECURITY DEFINER (bypass RLS) but have no internal authorization check. Any authenticated user can call them directly via `supabase.rpc()` from the browser console, bypassing server action permission guards.

- [ ] **Step 1: Create migration with auth guards**

```sql
-- Add internal authorization checks to SECURITY DEFINER functions.
-- These functions bypass RLS entirely, so they must verify caller permissions themselves.

-- 1. save_prognose: requires admin or sales_manager role
CREATE OR REPLACE FUNCTION save_prognose(
  p_year    integer,
  p_rows    jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_ids uuid[];
  v_role text;
BEGIN
  -- Auth guard: verify caller has permission
  SELECT role INTO v_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_role IS NULL OR v_role NOT IN ('admin', 'sales_manager') THEN
    RAISE EXCEPTION 'Forbidden: insufficient permissions for save_prognose';
  END IF;

  SELECT ARRAY(
    SELECT DISTINCT (elem->>'revenue_client_id')::uuid
    FROM jsonb_array_elements(p_rows) AS elem
    WHERE elem->>'revenue_client_id' IS NOT NULL
  )
  INTO v_client_ids;

  IF array_length(v_client_ids, 1) > 0 THEN
    DELETE FROM revenue_entries
    WHERE revenue_client_id = ANY(v_client_ids)
      AND year = p_year;
  END IF;

  IF jsonb_array_length(p_rows) > 0 THEN
    INSERT INTO revenue_entries (
      revenue_client_id, division_id, service_name, year, month, amount
    )
    SELECT
      (elem->>'revenue_client_id')::uuid,
      (elem->>'division_id')::uuid,
      elem->>'service_name',
      (elem->>'year')::integer,
      (elem->>'month')::integer,
      (elem->>'amount')::numeric
    FROM jsonb_array_elements(p_rows) AS elem;
  END IF;
END;
$$;

-- 2. approve_indexation: requires admin or sales_manager role
CREATE OR REPLACE FUNCTION public.approve_indexation(
  p_draft_id   UUID,
  p_approved_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draft          indexation_drafts%ROWTYPE;
  v_account_id     UUID;
  v_target_year    INTEGER;
  v_sla_rate_id    UUID;
  v_history_id     UUID;
  v_role           text;
BEGIN
  -- Auth guard: verify caller has permission
  SELECT role INTO v_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_role IS NULL OR v_role NOT IN ('admin', 'sales_manager') THEN
    RAISE EXCEPTION 'Forbidden: insufficient permissions for approve_indexation';
  END IF;

  SELECT * INTO v_draft
  FROM indexation_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Indexation draft not found: %', p_draft_id;
  END IF;

  IF v_draft.status <> 'draft' THEN
    RAISE EXCEPTION 'Draft is not in draft status (current: %)', v_draft.status;
  END IF;

  v_account_id  := v_draft.account_id;
  v_target_year := v_draft.target_year;

  UPDATE indexation_drafts
  SET status = 'approved', approved_by = p_approved_by
  WHERE id = p_draft_id;

  DELETE FROM hourly_rates
  WHERE account_id = v_account_id AND year = v_target_year;

  INSERT INTO hourly_rates (account_id, year, role, rate)
  SELECT v_account_id, v_target_year, r.role, r.proposed_rate
  FROM indexation_draft_rates r
  WHERE r.draft_id = p_draft_id;

  IF EXISTS (SELECT 1 FROM indexation_draft_sla WHERE draft_id = p_draft_id) THEN
    INSERT INTO sla_rates (account_id, year, fixed_monthly_rate, support_hourly_rate)
    SELECT v_account_id, v_target_year, s.fixed_monthly_rate, s.support_hourly_rate
    FROM indexation_draft_sla s
    WHERE s.draft_id = p_draft_id
    ON CONFLICT (account_id, year) DO UPDATE
      SET fixed_monthly_rate  = EXCLUDED.fixed_monthly_rate,
          support_hourly_rate = EXCLUDED.support_hourly_rate
    RETURNING id INTO v_sla_rate_id;

    DELETE FROM sla_tools WHERE sla_rate_id = v_sla_rate_id;

    INSERT INTO sla_tools (sla_rate_id, tool_name, monthly_price)
    SELECT v_sla_rate_id, t.tool_name, t.proposed_price
    FROM indexation_draft_sla_tools t
    WHERE t.draft_id = p_draft_id;
  END IF;

  INSERT INTO indexation_history (
    account_id, target_year, percentage, info,
    adjustment_pct_hourly, adjustment_pct_sla
  )
  VALUES (
    v_account_id, v_draft.target_year, v_draft.percentage, v_draft.info,
    v_draft.adjustment_pct_hourly, v_draft.adjustment_pct_sla
  )
  RETURNING id INTO v_history_id;

  INSERT INTO indexation_history_rates (history_id, role, rate)
  SELECT v_history_id, r.role, r.proposed_rate
  FROM indexation_draft_rates r
  WHERE r.draft_id = p_draft_id;

  IF EXISTS (SELECT 1 FROM indexation_draft_sla WHERE draft_id = p_draft_id) THEN
    INSERT INTO indexation_history_sla (history_id, fixed_monthly_rate, support_hourly_rate)
    SELECT v_history_id, s.fixed_monthly_rate, s.support_hourly_rate
    FROM indexation_draft_sla s
    WHERE s.draft_id = p_draft_id;

    INSERT INTO indexation_history_sla_tools (history_id, tool_name, price)
    SELECT v_history_id, t.tool_name, t.proposed_price
    FROM indexation_draft_sla_tools t
    WHERE t.draft_id = p_draft_id;
  END IF;

  DELETE FROM indexation_drafts WHERE id = p_draft_id;
END;
$$;

-- 3. get_open_deal_value: drop SECURITY DEFINER — RLS policy is USING(true) so all
-- authenticated users already see all deals. No auth guard needed, just remove the
-- elevated privilege. Keep search_path to satisfy Supabase linter.
CREATE OR REPLACE FUNCTION get_open_deal_value()
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount * probability::numeric / 100), 0)
  FROM deals
  WHERE closed_at IS NULL;
$$;

-- 4. Remove dangerous GRANT INSERT on notifications and audit_logs.
-- These tables should only be writable via service role (bypass RLS).
-- The GRANT is misleading and dangerous if a future INSERT policy is added.
REVOKE INSERT ON public.notifications FROM authenticated;
REVOKE INSERT ON public.audit_logs FROM authenticated;
```

- [ ] **Step 2: Verify migration applies cleanly**

Run: `cd supabase && supabase db reset`
Expected: Migration applies without errors. Existing functionality unaffected.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00075_rpc_auth_guards.sql
git commit -m "fix(security): add auth guards to SECURITY DEFINER RPCs, revoke dangerous GRANTs"
```

**Important:** The `link_consultant_to_account` function's latest version is in `supabase/migrations/00070_fix_link_consultant_fn.sql` (NOT `00069`). Add the auth guard to `00075` by re-creating the function with the role check at the top:

```sql
-- 5. link_consultant_to_account: requires admin, sales_manager, or customer_success role
CREATE OR REPLACE FUNCTION public.link_consultant_to_account(
  p_consultant_id UUID,
  p_account_id UUID,
  p_role TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_is_indefinite BOOLEAN DEFAULT FALSE,
  p_hourly_rate NUMERIC DEFAULT 0,
  p_notice_period_days INTEGER DEFAULT 30,
  p_sow_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consultant consultants%ROWTYPE;
  v_account_name TEXT;
  v_effective_role TEXT;
  v_caller_role text;
BEGIN
  -- Auth guard: verify caller has permission
  SELECT role INTO v_caller_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'sales_manager', 'customer_success') THEN
    RAISE EXCEPTION 'Forbidden: insufficient permissions for link_consultant_to_account';
  END IF;

  IF p_hourly_rate IS NULL OR p_hourly_rate <= 0 THEN
    RAISE EXCEPTION 'Uurtarief moet groter zijn dan 0';
  END IF;

  SELECT * INTO v_consultant
  FROM consultants
  WHERE id = p_consultant_id AND status = 'bench' AND is_archived = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultant niet gevonden of niet beschikbaar';
  END IF;

  SELECT name INTO v_account_name
  FROM accounts
  WHERE id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account niet gevonden';
  END IF;

  v_effective_role := COALESCE(p_role, v_consultant.roles[1]);

  UPDATE consultants SET
    status             = 'actief',
    account_id         = p_account_id,
    role               = v_effective_role,
    client_name        = v_account_name,
    start_date         = p_start_date,
    end_date           = CASE WHEN p_is_indefinite THEN NULL ELSE p_end_date END,
    is_indefinite      = p_is_indefinite,
    hourly_rate        = p_hourly_rate,
    sow_url            = p_sow_url,
    notice_period_days = p_notice_period_days,
    notes              = p_notes
  WHERE id = p_consultant_id;

  INSERT INTO consultant_rate_history (consultant_id, date, rate, reason)
  VALUES (p_consultant_id, p_start_date, p_hourly_rate, 'Initieel tarief');

  RETURN p_consultant_id;
END;
$$;
```

---

## Wave 2: JWT Role Claims — Eliminate Auth DB Queries

### Task 2: Create Postgres trigger for JWT role sync

**Files:**
- Create: `supabase/migrations/00076_jwt_role_claims.sql`

**Context:** Currently `proxy.ts` and `requirePermission()` each do `auth.getUser()` + `user_profiles.select('role')` — 2 DB queries per request/action. Moving the role into `raw_app_meta_data` on `auth.users` makes it available in the JWT, eliminating these queries entirely.

- [ ] **Step 1: Create migration**

```sql
-- Sync user role from user_profiles to auth.users.raw_app_meta_data.
-- This makes the role available in the JWT token, eliminating DB queries
-- in middleware and server actions for permission checks.

-- Function: sync role to auth.users on user_profiles INSERT or UPDATE
CREATE OR REPLACE FUNCTION sync_role_to_jwt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger: fire after INSERT or UPDATE of role on user_profiles
DROP TRIGGER IF EXISTS on_role_change_sync_jwt ON user_profiles;
CREATE TRIGGER on_role_change_sync_jwt
  AFTER INSERT OR UPDATE OF role ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_jwt();

-- Backfill: sync existing roles for all current users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, role FROM user_profiles WHERE role IS NOT NULL LOOP
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', r.role)
    WHERE id = r.id;
  END LOOP;
END;
$$;
```

- [ ] **Step 2: Verify migration applies and roles are synced**

Run: `cd supabase && supabase db reset`
Then verify: `psql -c "SELECT id, raw_app_meta_data->>'role' FROM auth.users LIMIT 5;"`
Expected: Each user has their role in `raw_app_meta_data`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00076_jwt_role_claims.sql
git commit -m "feat(auth): sync user role to JWT app_metadata via trigger"
```

### Task 3: Update proxy.ts to read role from JWT

**Files:**
- Modify: `src/proxy.ts:63-69`

**Context:** Replace the `user_profiles` DB query with a JWT metadata read. The role is now available in `user.app_metadata.role` after the trigger syncs it.

- [ ] **Step 1: Remove DB query, read from app_metadata**

Replace lines 63-69 in `src/proxy.ts`:

```ts
// OLD:
const { data } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('id', user.id)
  .single();
const role = data?.role as Role | undefined;

// NEW — transition-safe: prefer JWT claim, fall back to DB during re-login window
let role = user.app_metadata?.role as Role | undefined;
if (!role) {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  role = data?.role as Role | undefined;
}
```

- [ ] **Step 2: Verify proxy works**

Run: `npm run dev`, navigate to admin routes.
Expected: Routes load correctly, role-based redirects work as before.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "perf(auth): read role from JWT instead of DB query in proxy"
```

### Task 4: Update requirePermission to read role from JWT

**Files:**
- Modify: `src/lib/require-permission.ts`

**Context:** Same optimization — read role from JWT instead of querying `user_profiles`.

- [ ] **Step 1: Remove DB query, read from app_metadata**

Replace the entire `requirePermission` function body:

```ts
export async function requirePermission(
  permission: Permission,
): Promise<{ userId: string; role: Role }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: not authenticated');
  }

  const role = user.app_metadata?.role as Role | undefined;
  if (!role) {
    throw new Error('Unauthorized: no role assigned');
  }

  if (!can(role, permission)) {
    throw new Error(`Forbidden: missing permission '${permission}'`);
  }

  return { userId: user.id, role };
}
```

- [ ] **Step 2: Verify server actions work**

Run: `npm run dev`, test a mutation (e.g. create/edit an account).
Expected: Actions succeed for authorized users, fail for unauthorized.

- [ ] **Step 3: Commit**

```bash
git add src/lib/require-permission.ts
git commit -m "perf(auth): read role from JWT instead of DB query in requirePermission"
```

---

## Wave 3: Module-Level Formatters

### Task 5: Enhance `src/lib/format.ts` with shared formatters

**Files:**
- Modify: `src/lib/format.ts`

**Context:** `new Intl.NumberFormat(...)` is constructed inside render functions across ~20 files. Each construction is expensive. The fix is to define module-level formatter instances once.

- [ ] **Step 1: Add cached formatter instances to `format.ts`**

Add to `src/lib/format.ts`:

```ts
// Module-level formatter instances — constructed once, reused everywhere.
// Never construct Intl.NumberFormat inside component render functions.

const eurFormatter = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const eurPreciseFormatter = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('nl-BE');

const percentFormatter = new Intl.NumberFormat('nl-BE', {
  style: 'percent',
  maximumFractionDigits: 0,
});

/** Format as EUR without decimals: € 1.234 */
export function formatEUR(value: number): string {
  return eurFormatter.format(value);
}

/** Format as EUR with 2 decimals: € 1.234,56 */
export function formatEURPrecise(value: number): string {
  return eurPreciseFormatter.format(value);
}

/** Format a plain number with locale grouping: 1.234 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Format as percentage: 42% */
export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100);
}
```

Keep existing `formatCurrency` unchanged — it uses `Intl.NumberFormat` with default decimal behavior. The existing callers expect this. Only update it to use a cached instance:

```ts
const currencyFormatter = new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' });

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}
```

- [ ] **Step 2: Commit format.ts changes**

```bash
git add src/lib/format.ts
git commit -m "feat(format): add module-level cached formatters for EUR, numbers, percentages"
```

### Task 6: Replace inline Intl.NumberFormat across components

**Files to modify** (grep for `new Intl.NumberFormat` and replace with imports from `@/lib/format`):
- `src/features/dashboard/components/dashboard-client.tsx`
- `src/features/revenue/components/revenue-page-client.tsx`
- `src/features/indexation/components/indexation-wizard.tsx`
- `src/features/accounts/components/account-detail.tsx`
- `src/features/accounts/components/account-form.tsx`
- `src/features/consultants/components/consultant-detail-modal.tsx`
- `src/features/consultants/components/account-consultants-tab.tsx`
- `src/features/consultants/columns.tsx`
- `src/features/consultants/components/link-consultant-wizard.tsx`
- `src/features/prognose/components/prognose-editor.tsx`
- `src/features/contracts/components/hourly-rates-sub-tab.tsx`
- `src/features/contracts/components/sla-rates-sub-tab.tsx`
- `src/features/deals/components/deal-detail.tsx`
- `src/features/deals/components/deal-kanban.tsx`
- `src/features/deals/columns.tsx`
- `src/features/revenue/components/omzet-tab.tsx`
- `src/features/pipeline/components/pipeline-page-client.tsx`
- `src/features/people/components/employee-salary-tab.tsx`
- `src/features/people/columns.ts`

**Pattern:** For each file:
1. Remove inline `const fmt = (n: number) => new Intl.NumberFormat(...).format(n)` or similar
2. Remove module-level `const eurFmt = new Intl.NumberFormat(...)` (e.g. `consultant-list.tsx:57`)
3. Add `import { formatEUR } from '@/lib/format'` (or `formatEURPrecise`, `formatNumber` as appropriate)
4. Replace `fmt(value)` / `eurFmt.format(value)` calls with `formatEUR(value)`

- [ ] **Step 1: Replace in all files** (batch — same mechanical change)

For `consultant-list.tsx`: Remove lines 57-61 (`const eurFmt = ...`), add import, replace `eurFmt.format(...)` with `formatEUR(...)`.

For `deal-kanban.tsx`: Remove the `fmt` function inside `DraggableDealCard`, add import, replace `fmt(...)` calls.

For all other files: same pattern — remove local formatter, add import, replace calls.

- [ ] **Step 2: Verify the app compiles**

Run: `npx next build` (or `npm run dev` and check for errors)
Expected: No compilation errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/
git commit -m "refactor(format): replace inline Intl.NumberFormat with shared formatters"
```

---

## Wave 4: Query Layer — Architecture Fixes

### Task 7: Extract dashboard page queries

**Files:**
- Create: `src/features/activities/queries/get-recent-activities.ts`
- Create: `src/features/tasks/queries/get-upcoming-tasks.ts`
- Modify: `src/app/admin/dashboard/page.tsx`

**Context:** Dashboard page queries Supabase directly instead of using feature queries with `React.cache()`.

- [ ] **Step 1: Create `get-recent-activities.ts`**

Match the exact query shape from the current `dashboard/page.tsx`:

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getRecentActivities = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('activities')
    .select('id, type, subject, date')
    .order('date', { ascending: false })
    .limit(10);

  if (error) {
    console.error('getRecentActivities error:', error.message);
    return [];
  }
  return data;
});
```

- [ ] **Step 2: Create `get-upcoming-tasks.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getUpcomingTasks = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, priority, due_date')
    .neq('status', 'Done')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10);

  if (error) {
    console.error('getUpcomingTasks error:', error.message);
    return [];
  }
  return data;
});
```

- [ ] **Step 3: Update dashboard/page.tsx to use extracted queries**

Replace the inline Supabase calls with imports from the new query files. Use `Promise.all()` for parallel fetching.

- [ ] **Step 4: Commit**

```bash
git add src/features/activities/queries/get-recent-activities.ts src/features/tasks/queries/get-upcoming-tasks.ts src/app/admin/dashboard/page.tsx
git commit -m "refactor(dashboard): extract inline queries to feature query layer"
```

### Task 8: Extract deals page pipeline query

**Files:**
- Create: `src/features/deals/queries/get-pipelines.ts`
- Modify: `src/app/admin/deals/page.tsx`

- [ ] **Step 1: Create `get-pipelines.ts`**

Read `src/app/admin/deals/page.tsx` for the exact SELECT string, then extract to:

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getPipelines = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('pipelines')
    .select(`id, name, type, stages:pipeline_stages(id, name, color, sort_order, is_closed, is_won, is_longterm, probability)`)
    .order('name')
    .order('sort_order', { referencedTable: 'pipeline_stages' });

  if (error) {
    console.error('getPipelines error:', error.message);
    return [];
  }
  return data;
});
```

- [ ] **Step 2: Update deals/page.tsx to use the extracted query**

Replace inline Supabase call with `import { getPipelines } from '@/features/deals/queries/get-pipelines'`.

- [ ] **Step 3: Commit**

```bash
git add src/features/deals/queries/get-pipelines.ts src/app/admin/deals/page.tsx
git commit -m "refactor(deals): extract pipeline query to feature query layer"
```

### Task 9: Fix getUser and getFiles to return null instead of throwing

**Files:**
- Modify: `src/features/users/queries/get-user.ts`
- Modify: `src/features/files/queries/get-files.ts`

**Context:** These are the only two queries that throw on error. Every other query returns null/[] and logs to console. This inconsistency breaks the error contract.

- [ ] **Step 1: Fix getUser**

Replace `throw new Error(error.message)` with:
```ts
if (error) {
  console.error('getUser error:', error.message);
  return null;
}
```

Also update `src/app/admin/users/[id]/page.tsx` to remove the `.catch(() => null)` workaround — it's no longer needed.

- [ ] **Step 2: Fix getFiles**

Same pattern: replace `throw` with `console.error` + return `[]`.

- [ ] **Step 3: Commit**

```bash
git add src/features/users/queries/get-user.ts src/features/files/queries/get-files.ts src/app/admin/users/\[id\]/page.tsx
git commit -m "fix(queries): return null on error instead of throwing in getUser and getFiles"
```

---

## Wave 5: Performance — Database Queries

### Task 10: Add limits and column restrictions to unbounded queries

**Files to modify:**
- `src/features/accounts/queries/get-account-names.ts` — add `.limit(500)`
- `src/features/revenue/queries/get-revenue-clients.ts` — restrict `*` to needed columns
- `src/features/consultants/queries/get-consultants-by-account.ts` — create a summary select, add `.limit(50)`
- `src/features/deals/queries/get-deals-by-account.ts` — add `.limit(50).order('created_at', { ascending: false })`
- `src/features/users/queries/get-users.ts` — restrict `select('*')` to needed columns
- `src/features/equipment/queries/get-all-equipment.ts` — add `.limit(200)` or pagination
- `src/features/indexation/queries/get-indexation-history.ts` — add `.limit(20)`
- `src/features/pipeline/queries/get-pipeline-entries.ts` — restrict `*` to needed columns

For each file:
1. Read the current query
2. Identify which columns are actually used by the consuming component
3. Replace `select('*')` with explicit column list
4. Add `.limit()` where missing

- [ ] **Step 1: Fix each query** (read file first, then apply minimal change)
- [ ] **Step 2: Verify app compiles**: `npx next build`
- [ ] **Step 3: Commit**

```bash
git add src/features/*/queries/*.ts
git commit -m "perf(queries): add limits and column restrictions to unbounded queries"
```

### Task 11: Create get_consultant_stats() RPC

**Files:**
- Create: `supabase/migrations/00077_consultant_stats_rpc.sql`
- Modify: `src/features/consultants/queries/get-consultant-stats.ts`

**Context:** Currently loads all rate history for all consultants into JS memory for aggregation. Should be a single SQL aggregation.

- [ ] **Step 1: Create migration**

```sql
CREATE OR REPLACE FUNCTION get_consultant_stats()
RETURNS TABLE(bench_count bigint, active_count bigint, stopped_count bigint, max_revenue numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'bench'),
    COUNT(*) FILTER (WHERE status = 'actief'),
    COUNT(*) FILTER (WHERE status = 'stopgezet'),
    COALESCE(SUM(
      COALESCE(
        (SELECT rate FROM consultant_rate_history WHERE consultant_id = consultants.id ORDER BY date DESC LIMIT 1),
        hourly_rate
      ) * 8 * 21
    ) FILTER (WHERE status = 'actief'), 0)
  FROM consultants
  WHERE is_archived = false;
$$;

GRANT EXECUTE ON FUNCTION get_consultant_stats() TO authenticated;
```

- [ ] **Step 2: Update get-consultant-stats.ts**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getConsultantStats = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_consultant_stats').single();

  if (error) {
    console.error('getConsultantStats error:', error.message);
    return { bench_count: 0, active_count: 0, stopped_count: 0, max_revenue: 0 };
  }
  return data;
});
```

Map snake_case DB fields to camelCase to preserve the existing `ConsultantStats` type contract:

```ts
export type ConsultantStats = {
  benchCount: number;
  activeCount: number;
  stoppedCount: number;
  maxRevenue: number;
};

export const getConsultantStats = cache(async (): Promise<ConsultantStats> => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_consultant_stats').single();

  if (error || !data) {
    console.error('getConsultantStats error:', error?.message);
    return { benchCount: 0, activeCount: 0, stoppedCount: 0, maxRevenue: 0 };
  }
  return {
    benchCount: Number(data.bench_count),
    activeCount: Number(data.active_count),
    stoppedCount: Number(data.stopped_count),
    maxRevenue: Number(data.max_revenue),
  };
});
```

No changes needed in the consuming page — the type contract is preserved.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00077_consultant_stats_rpc.sql src/features/consultants/queries/get-consultant-stats.ts
git commit -m "perf(consultants): replace JS aggregation with get_consultant_stats() RPC"
```

### Task 12: Add trigram indexes and fix getAccountFilterOptions

**Files:**
- Create: `supabase/migrations/00078_additional_indexes.sql`
- Modify: `src/features/accounts/queries/get-account-filter-options.ts`

- [ ] **Step 1: Create migration with trigram indexes**

```sql
-- Trigram indexes for consultant and deal search (accounts/contacts already covered in 00074)
CREATE INDEX IF NOT EXISTS idx_consultants_first_name_trgm ON consultants USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_consultants_last_name_trgm ON consultants USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_consultants_client_name_trgm ON consultants USING gin (client_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_deals_title_trgm ON deals USING gin (title gin_trgm_ops);
```

- [ ] **Step 2: Fix getAccountFilterOptions to use RPC or distinct**

Read the current file. Replace the JS-side `new Set()` dedup with a Supabase query that returns distinct values. PostgREST doesn't support `DISTINCT` directly, so use an RPC:

Add to migration:
```sql
CREATE OR REPLACE FUNCTION get_distinct_account_countries()
RETURNS TABLE(country text)
LANGUAGE sql
STABLE
AS $$
  SELECT DISTINCT a.country
  FROM accounts a
  WHERE a.country IS NOT NULL
  ORDER BY a.country;
$$;

GRANT EXECUTE ON FUNCTION get_distinct_account_countries() TO authenticated;
```

Update the query file to call the RPC instead.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00078_additional_indexes.sql src/features/accounts/queries/get-account-filter-options.ts
git commit -m "perf(db): add trigram indexes for consultants/deals, use DISTINCT for filter options"
```

---

## Wave 6: Performance — React Components

### Task 13: Avatar signed URL caching

**Files:**
- Modify: `src/components/admin/avatar.tsx`

**Context:** Every Avatar mount triggers `createSignedUrl` — 25+ API calls per list page. Signed URLs are valid for 3600 seconds. Add a module-level cache.

- [ ] **Step 1: Add URL cache to avatar.tsx**

```ts
// Module-level cache for signed URLs — avoids re-signing on every mount
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL_MS = 3500 * 1000; // slightly less than the 3600s signed URL TTL

function getCachedUrl(path: string): string | null {
  const entry = urlCache.get(path);
  if (entry && Date.now() < entry.expiresAt) return entry.url;
  urlCache.delete(path);
  return null;
}

function setCachedUrl(path: string, url: string): void {
  urlCache.set(path, { url, expiresAt: Date.now() + CACHE_TTL_MS });
}
```

Update the `useEffect` to check cache first:

```ts
useEffect(() => {
  if (!path) { setUrl(null); return; }

  const cached = getCachedUrl(path);
  if (cached) { setUrl(cached); return; }

  let cancelled = false;
  const supabase = createBrowserClient();
  supabase.storage
    .from('avatars')
    .createSignedUrl(path, 3600)
    .then(({ data }) => {
      if (cancelled) return;
      if (data?.signedUrl) {
        const finalUrl = withApiKey(data.signedUrl);
        setCachedUrl(path, finalUrl);
        setUrl(finalUrl);
      }
    });
  return () => { cancelled = true; };
}, [path]);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/avatar.tsx
git commit -m "perf(avatar): cache signed URLs to eliminate redundant API calls"
```

### Task 14: Fix consultant-list cancellation pattern

**Files:**
- Modify: `src/features/consultants/components/consultant-list.tsx:107-112`

- [ ] **Step 1: Fix the useEffect to properly cancel**

Replace the broken cancellation pattern:

```ts
// OLD (broken — cancelled is always false when checked):
useEffect(() => {
  let cancelled = false;
  if (page === 1 && !search && ...) return;
  if (!cancelled) load();
  return () => { cancelled = true; };
}, [load, page, search, selectedStatuses]);

// NEW (check cancelled inside the async callback):
useEffect(() => {
  if (page === 1 && !search && selectedStatuses.length === 2 && selectedStatuses.includes('bench') && selectedStatuses.includes('actief')) return;
  let cancelled = false;
  load();
  return () => { cancelled = true; };
}, [load, page, search, selectedStatuses]);
```

Note: The `load()` call itself is fine — the real fix needed is inside `useEntity` to support an abort signal. For now, the structural fix is to remove the dead `if (!cancelled)` guard, which gives a false sense of safety. The deeper fix (abort signals in `useEntity`) would be a separate enhancement.

- [ ] **Step 2: Commit**

```bash
git add src/features/consultants/components/consultant-list.tsx
git commit -m "fix(consultants): remove broken cancellation guard in list useEffect"
```

### Task 15: Fix deals-page-client (memoize, fix double effect, fix duplicates)

**Files:**
- Modify: `src/features/deals/components/deals-page-client.tsx`

- [ ] **Step 1: Memoize dealCards**

```ts
const dealCards: DealCard[] = useMemo(() => deals.map((d) => ({
  id: d.id,
  title: d.title,
  amount: Number(d.amount ?? 0),
  probability: d.probability ?? 0,
  close_date: d.close_date,
  account_name: d.account?.name ?? '',
  owner_name: d.owner?.full_name ?? null,
  stage_id: d.stage_id,
  forecast_category: d.forecast_category,
  origin: d.origin,
})), [deals]);
```

Add `useMemo` to the imports.

- [ ] **Step 2: Fix double-fetch on pipeline/filter switch**

The root cause: two separate effects — one resets `page` to 1, the other fetches. When `activePipeline` changes, both fire: fetch fires first with old page, then page resets to 1 triggering another fetch.

Fix: use a ref to track previous filter values and reset page inside the fetch effect:

```ts
const prevFilters = useRef({ activePipeline, viewMode, originFilter });
const isInitialLoad = useRef(true);

useEffect(() => {
  // Skip initial render — server provided data
  if (isInitialLoad.current) {
    isInitialLoad.current = false;
    return;
  }

  // If filters changed (not just page), reset to page 1
  const filtersChanged =
    prevFilters.current.activePipeline !== activePipeline ||
    prevFilters.current.viewMode !== viewMode ||
    prevFilters.current.originFilter !== originFilter;

  if (filtersChanged) {
    prevFilters.current = { activePipeline, viewMode, originFilter };
    if (page !== 1) {
      setPage(1); // This will re-trigger this effect with page=1
      return;
    }
  }

  const signal = { cancelled: false };
  fetchDeals(signal);
  return () => { signal.cancelled = true; };
}, [fetchDeals, page, activePipeline, viewMode, originFilter]);
```

Remove the separate `useEffect(() => { setPage(1); }, [activePipeline, viewMode, originFilter])` — it's now handled inside the single effect.

- [ ] **Step 3: Remove duplicate DealList branches**

Replace the ternary at the bottom of the JSX:

```tsx
// OLD:
{viewMode === 'archief' ? (
  <DealList ... />
) : (
  <DealList ... />   // identical
)}

// NEW:
<DealList deals={deals} page={page} total={total} ... />
```

The condition `viewMode === 'kanban'` already handles the kanban case above this block.

- [ ] **Step 4: Commit**

```bash
git add src/features/deals/components/deals-page-client.tsx
git commit -m "perf(deals): memoize dealCards, fix double-fetch on pipeline switch, remove duplicate branches"
```

### Task 16: Fix notification-bell state sync

**Files:**
- Modify: `src/features/notifications/components/notification-bell.tsx`

- [ ] **Step 1: Derive unreadCount from notifications state**

Remove `const [unreadCount, setUnreadCount] = useState(0);` and replace with:

```ts
const unreadCount = notifications.filter((n) => !n.is_read).length;
```

Remove all `setUnreadCount(...)` calls throughout the component:
- Line 42: remove `setUnreadCount(data.filter(...).length)`
- Line 65: remove `setUnreadCount((prev) => prev + 1)`
- Line 82: remove `setUnreadCount((prev) => Math.max(0, prev - 1))`
- Line 94: remove `setUnreadCount(0)`

- [ ] **Step 2: Commit**

```bash
git add src/features/notifications/components/notification-bell.tsx
git commit -m "fix(notifications): derive unreadCount from state to prevent desync"
```

### Task 17: Fix prognose-editor memoization and error handling

**Files:**
- Modify: `src/features/prognose/components/prognose-editor.tsx`

- [ ] **Step 1: Memoize the three reduce computations**

Read the file first. Replace the three separate `.reduce()` calls with a single memoized pass:

```ts
const { totalForecast, totalLastYear, consultancyTotal } = useMemo(() =>
  lines.reduce((acc, l) => ({
    totalForecast: acc.totalForecast + l.forecastTotal,
    totalLastYear: acc.totalLastYear + l.lastKnownTotal,
    consultancyTotal: acc.consultancyTotal + (l.serviceName.toLowerCase() === 'consultancy' ? l.forecastTotal : 0),
  }), { totalForecast: 0, totalLastYear: 0, consultancyTotal: 0 }),
[lines]);
```

- [ ] **Step 2: Add error handling to handleSave**

```ts
const result = await savePrognose(...);
if ('error' in result && result.error) {
  toast.error(typeof result.error === 'string' ? result.error : 'Opslaan mislukt');
  return;
}
toast.success('Prognose opgeslagen');
```

- [ ] **Step 3: Commit**

```bash
git add src/features/prognose/components/prognose-editor.tsx
git commit -m "perf(prognose): memoize aggregations, add error handling to save"
```

### Task 18: Fix remaining memoization issues

**Files to modify:**
- `src/features/pipeline/components/pipeline-page-client.tsx` — memoize `monthlySpread` + `totalSold`
- `src/features/revenue/components/revenue-page-client.tsx` — memoize `grandTotal`
- `src/features/accounts/components/account-detail.tsx` — memoize `navItems`

- [ ] **Step 1: Fix each file** (read first, apply minimal memoization wrapping)
- [ ] **Step 2: Commit**

```bash
git add src/features/pipeline/components/pipeline-page-client.tsx src/features/revenue/components/revenue-page-client.tsx src/features/accounts/components/account-detail.tsx
git commit -m "perf: memoize computed values in pipeline, revenue, and account-detail components"
```

### Task 19: Fix uploadMany to use Promise.allSettled

**Files:**
- Modify: `src/lib/hooks/use-file-upload.ts`

- [ ] **Step 1: Replace sequential loop with concurrent uploads**

Read the file. Find the `uploadMany` function. Replace:

```ts
// OLD: sequential for loop
for (const file of valid) {
  const { error } = await supabase.storage.from(bucket).upload(...);
  if (error) failed++;
}

// NEW: concurrent uploads
const results = await Promise.allSettled(
  valid.map((file) => {
    const path = `${prefix}/${Date.now()}-${file.name}`;
    return supabase.storage.from(bucket).upload(path, file);
  })
);
const failed = results.filter((r) => r.status === 'rejected' || ('value' in r && r.value.error)).length;
```

Read the exact implementation first to preserve the upload path logic.

- [ ] **Step 2: Commit**

```bash
git add src/lib/hooks/use-file-upload.ts
git commit -m "perf(upload): parallelize file uploads with Promise.allSettled"
```

### Task 20: Make createServiceRoleClient a singleton

**Files:**
- Modify: `src/lib/supabase/admin.ts`

- [ ] **Step 1: Cache the client instance**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getServerEnv } from '@/lib/env';

let cachedClient: SupabaseClient<Database> | null = null;

export function createServiceRoleClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;
  const env = getServerEnv();
  cachedClient = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  return cachedClient;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/admin.ts
git commit -m "perf(supabase): make service role client a singleton"
```

---

## Wave 7: Conventions & Cleanup

### Task 21: Add missing error.tsx files

**Files to create:**
- `src/app/admin/pipeline/error.tsx`
- `src/app/admin/prognose/error.tsx`
- `src/app/admin/revenue/error.tsx`
- `src/app/admin/people/error.tsx`
- `src/app/admin/materials/error.tsx`

**Context:** These routes fall back to the global `admin/error.tsx`. Each needs a Dutch-language error boundary.

- [ ] **Step 1: Create error.tsx files**

Use the same pattern as existing error boundaries (e.g. `src/app/admin/accounts/error.tsx`). Each file:

```tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h2 className="text-lg font-semibold">Er ging iets mis</h2>
      <p className="text-sm text-muted-foreground">Er is een onverwachte fout opgetreden bij het laden van deze pagina.</p>
      <Button variant="outline" onClick={reset}>Opnieuw proberen</Button>
    </div>
  );
}
```

- [ ] **Step 2: Fix global admin/error.tsx English → Dutch**

Update `src/app/admin/error.tsx`: replace "Something went wrong" → "Er ging iets mis", "An unexpected error occurred" → "Er is een onverwachte fout opgetreden", "Try again" → "Opnieuw proberen".

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/pipeline/error.tsx src/app/admin/prognose/error.tsx src/app/admin/revenue/error.tsx src/app/admin/people/error.tsx src/app/admin/materials/error.tsx src/app/admin/error.tsx
git commit -m "fix(routes): add Dutch error boundaries for all admin routes"
```

### Task 22: Rename dashboard-client.tsx and fix remaining convention issues

**Files:**
- Rename: `src/features/dashboard/components/dashboard-client.tsx` → `src/features/dashboard/components/dashboard-view.tsx`
- Modify: `src/app/admin/dashboard/page.tsx` (update import)
- Modify: `src/features/revenue/components/revenue-page-client.tsx` (fix `bg-white` → `bg-card`)

- [ ] **Step 1: Rename dashboard-client.tsx**

```bash
git mv src/features/dashboard/components/dashboard-client.tsx src/features/dashboard/components/dashboard-view.tsx
```

Update the import in `src/app/admin/dashboard/page.tsx`.

- [ ] **Step 2: Fix hardcoded bg-white in revenue table**

In `src/features/revenue/components/revenue-page-client.tsx`, replace `bg-white` with `bg-card` on the sticky `<th>` and `<td>` elements.

- [ ] **Step 3: Fix consultant-list Bewerk action**

In `src/features/consultants/components/consultant-list.tsx`, the `Bewerk` action for active consultants opens the detail modal instead of edit. Either:
- Change it to open the edit modal, or
- Remove it if view and edit are the same modal

Read the file to determine the correct fix.

- [ ] **Step 4: Fix link-consultant-wizard calcWorkdays to O(1)**

In `src/features/consultants/components/link-consultant-wizard.tsx`, replace the day-by-day loop with:

```ts
function calcWorkdays(start: string, end: string | null): number {
  if (!end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  const totalDays = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  const fullWeeks = Math.floor(totalDays / 7);
  const remainder = totalDays % 7;
  const startDay = s.getDay(); // 0=Sun
  let extraWorkdays = 0;
  for (let i = 0; i < remainder; i++) {
    const day = (startDay + i) % 7;
    if (day !== 0 && day !== 6) extraWorkdays++;
  }
  return fullWeeks * 5 + extraWorkdays;
}
```

Also wrap the call site in `useMemo` to avoid recalculating on every render.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix(conventions): rename dashboard-client, fix bg-white, fix Bewerk action, optimize calcWorkdays"
```

---

## Wave 8: SOLID — Account Detail Refactor (URL-Driven Server Tabs)

**SOLID violations addressed:** SRP, ISP, OCP, DIP, LSP — no compromises.

### Current problems

The server page fires **14 parallel queries** for 8 tabs but only **1 tab is visible**. That's 13 wasted queries per page load. `AccountDetail` receives 17 props, imports 8 domain type systems, and uses a switch statement. Adding a tab requires modifying 3 files.

### Target architecture

```
accounts/[id]/page.tsx (server) — reads ?tab= searchParam
  ├── AccountBanner (client — avatar upload is interactive)
  │     └── gets stats from get_account_banner_stats() RPC (one lightweight query)
  ├── AccountTabNav (client — URL-driven navigation via router.push)
  │     └── reads tab config from tab-config.ts (OCP: add tab = add entry)
  └── Active tab server component (from _tabs/ folder)
        └── each tab fetches ONLY its own data via React.cache() queries
```

**SOLID compliance:**
- **SRP:** Banner (presentation + avatar), TabNav (navigation), each tab (own data + UI)
- **OCP:** Adding a tab = create `_tabs/foo.tsx` + add entry in `tab-config.ts` + one line in `page.tsx`
- **LSP:** All tab server components conform to `{ accountId: string }` interface
- **ISP:** Each tab fetches ONLY what it needs — no 14-query Promise.all
- **DIP:** TabNav depends on `TabMeta[]` interface, not concrete tab imports

### File structure

```
src/app/admin/accounts/[id]/
├── page.tsx              # Reads searchParams.tab, renders banner + nav + active tab
├── _tabs/                # Private folder — tab server components (not routes)
│   ├── tab-config.ts     # Tab metadata registry (labels, icons, count keys)
│   ├── overview.tsx      # Fetches: account, contract, contacts, internalPeople
│   ├── communications.tsx # Fetches: communications, contact stubs, deal stubs
│   ├── contracts.tsx     # Fetches: contract, hourlyRates, slaRates, indexation*
│   ├── consultants.tsx   # Fetches: consultants, roles
│   ├── contacts.tsx      # Fetches: contacts
│   ├── deals.tsx         # Fetches: deals
│   ├── activities.tsx    # Fetches: activities
│   └── omzet.tsx         # Fetches: revenue
src/features/accounts/components/
├── account-banner.tsx    # NEW — extracted from account-detail.tsx
├── account-tab-nav.tsx   # NEW — URL-driven navigation
├── account-detail.tsx    # DELETED
src/features/accounts/queries/
├── get-account-banner-stats.ts  # NEW — lightweight RPC for banner + nav badge counts
supabase/migrations/
└── 00079_account_banner_stats.sql  # RPC for banner stats
```

### Task 23: Create `get_account_banner_stats` RPC

**Files:**
- Create: `supabase/migrations/00079_account_banner_stats.sql`
- Create: `src/features/accounts/queries/get-account-banner-stats.ts`

**Context:** The banner needs consultant count, monthly revenue, pipeline value, and the tab nav needs entity counts for badges. Instead of fetching full entity arrays, use one lightweight SQL query.

- [ ] **Step 1: Create migration**

```sql
CREATE OR REPLACE FUNCTION get_account_banner_stats(p_account_id uuid)
RETURNS TABLE(
  consultant_count bigint, contact_count bigint, deal_count bigint,
  activity_count bigint, pipeline_value numeric, monthly_revenue numeric
)
LANGUAGE sql STABLE SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM consultants WHERE account_id = p_account_id AND status = 'actief' AND NOT is_archived),
    (SELECT COUNT(*) FROM contacts WHERE account_id = p_account_id),
    (SELECT COUNT(*) FROM deals WHERE account_id = p_account_id AND closed_at IS NULL),
    (SELECT COUNT(*) FROM activities WHERE account_id = p_account_id),
    COALESCE((SELECT SUM(amount) FROM deals WHERE account_id = p_account_id AND closed_at IS NULL), 0),
    COALESCE((
      SELECT SUM(COALESCE(
        (SELECT rate FROM consultant_rate_history WHERE consultant_id = c.id ORDER BY date DESC LIMIT 1),
        c.hourly_rate, 0) * 8 * 21)
      FROM consultants c WHERE c.account_id = p_account_id AND c.status = 'actief' AND NOT c.is_archived
    ), 0);
$$;
GRANT EXECUTE ON FUNCTION get_account_banner_stats(uuid) TO authenticated;
```

- [ ] **Step 2: Create query wrapper** (`src/features/accounts/queries/get-account-banner-stats.ts`)

Map snake_case to camelCase, return typed `AccountBannerStats`.

- [ ] **Step 3: Verify**: `supabase db reset`
- [ ] **Step 4: Commit**

### Task 24: Create tab-config, AccountBanner, and AccountTabNav

**Files:**
- Create: `src/app/admin/accounts/[id]/_tabs/tab-config.ts` — OCP registry (labels, icons, countKeys)
- Create: `src/features/accounts/components/account-banner.tsx` — extracted banner with `{ account, stats }` props
- Create: `src/features/accounts/components/account-tab-nav.tsx` — URL-driven nav using `router.push(?tab=)`

AccountTabNav reads from `tab-config.ts` (DIP — depends on interface, not concrete tabs).
AccountBanner uses `formatEUR` from `@/lib/format` and `AccountBannerStats` type.
Tab switching uses `searchParams` — URL-addressable, back-button friendly.

- [ ] **Step 1: Create all 3 files**
- [ ] **Step 2: Commit**

### Task 25: Create per-tab async server components

**Files to create** in `src/app/admin/accounts/[id]/_tabs/`:
- `overview.tsx` — fetches: account, contract, contacts, internalPeople
- `communications.tsx` — fetches: communications (page 1), contact stubs, deal stubs
- `contracts.tsx` — fetches: contract, hourlyRates, slaRates, indexation config/draft/history
- `consultants.tsx` — fetches: consultants, roles, account name
- `contacts.tsx` — fetches: contacts
- `deals.tsx` — fetches: deals
- `activities.tsx` — fetches: activities (first 50)
- `omzet.tsx` — fetches: account revenue

**All tabs conform to the same interface: `{ accountId: string }`** (LSP).
Each tab fetches ONLY its own data via `React.cache()` queries (ISP).
Overlapping queries (e.g. `getAccount` in overview + consultants) are deduplicated by React.cache().

Each tab server component delegates rendering to the existing client component (unchanged):
```tsx
// Example: _tabs/contacts.tsx
import { getContactsByAccount } from '@/features/contacts/queries/get-contacts-by-account';
import { AccountContactsTab } from '@/features/accounts/components/account-contacts-tab';

export default async function ContactsTabServer({ accountId }: { accountId: string }) {
  const contacts = await getContactsByAccount(accountId);
  return <AccountContactsTab accountId={accountId} initialData={contacts} initialCount={contacts.length} />;
}
```

- [ ] **Step 1: Create all 8 tab server components**
- [ ] **Step 2: Commit**

### Task 26: Rewire server page and delete AccountDetail God Component

**Files:**
- Rewrite: `src/app/admin/accounts/[id]/page.tsx`
- Delete: `src/features/accounts/components/account-detail.tsx`

The server page now:
1. Reads `searchParams.tab` to determine active tab
2. Fetches ONLY `getAccount()` + `getAccountBannerStats()` in `Promise.all` (2 queries vs old 14)
3. Renders `AccountBanner`, `AccountTabNav`, and the active tab's server component
4. Uses a `tabs` routing map — OCP: add a tab = add one line

```tsx
const tabs: Record<string, ComponentType<{ accountId: string }>> = {
  overview: OverviewTab,
  communicatie: CommunicationsTab,
  // ... one line per tab
};

// Only the active tab server component executes its queries
const TabComponent = tabs[tab] ?? tabs.overview;
return <TabComponent accountId={id} />;
```

- [ ] **Step 1: Rewrite page.tsx**
- [ ] **Step 2: Delete account-detail.tsx, verify no imports remain**
- [ ] **Step 3: Verify**: `npm run dev`, navigate to account detail, switch all tabs
- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(accounts): URL-driven server tabs, delete God Component, per-tab data loading (full SOLID)"
```

---

## Verification

After all waves are complete:

- [ ] Run `supabase db reset` — all migrations apply cleanly
- [ ] Run `npm run dev` — app starts without errors
- [ ] Run `npx next build` — build succeeds
- [ ] Manual smoke test: navigate all admin routes, perform CRUD operations
- [ ] Verify proxy no longer queries DB for role (check Supabase logs)
