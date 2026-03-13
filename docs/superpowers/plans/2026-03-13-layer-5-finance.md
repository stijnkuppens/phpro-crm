# Layer 5: Finance — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement divisions, revenue clients, revenue tracking (client/service views), account revenue (Omzet tab), prognose editor, and pipeline analytics — the complete finance module.

**Architecture:** Divisions and division services are reference data. Revenue clients can optionally link to CRM accounts. Revenue entries are monthly granularity per client/division/service. The Revenue page supports two view modes (client view and service view) with year/division/time filters. The Prognose editor is an interactive forecast table. Pipeline entries are standalone editable data. Account revenue is a per-account tab showing revenue by category/year.

**Tech Stack:** Supabase (PostgreSQL, RLS), React 19, Zod, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-13-crm-port-design.md`

**IMPORTANT — Cross-cutting pattern:** Every server action that performs a write (create/update/delete) MUST call `revalidatePath('/admin/<entity>')` before returning. Import: `import { revalidatePath } from 'next/cache';`

**Depends on:** Layer 1 (Foundation), Layer 2 (Core CRM), Layer 3 (Sales — deals FK for pipeline entries)

---

## Task 1: Database Migration — Divisions and Division Services

**Files:**
- Create: `supabase/migrations/00040_divisions.sql`

**Steps:**

- [ ] **Step 1: Create the migration file:**

```sql
-- ============================================================================
-- Migration: Divisions and division services
-- ============================================================================

CREATE TABLE divisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL UNIQUE,
  color           text,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON divisions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "divisions_select" ON divisions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "divisions_write" ON divisions FOR ALL TO authenticated
  USING (get_user_role() IN ('admin'))
  WITH CHECK (get_user_role() IN ('admin'));

CREATE TABLE division_services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id     uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  service_name    text NOT NULL,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON division_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_division_services_division ON division_services(division_id);

ALTER TABLE division_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "division_services_select" ON division_services FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "division_services_write" ON division_services FOR ALL TO authenticated
  USING (get_user_role() IN ('admin'))
  WITH CHECK (get_user_role() IN ('admin'));

-- Seed divisions
INSERT INTO divisions (id, name, color, sort_order) VALUES
  ('div00000-0000-0000-0000-000000000001', '25Carat', '#3b82f6', 1),
  ('div00000-0000-0000-0000-000000000002', 'PHPro', '#10b981', 2);

INSERT INTO division_services (division_id, service_name, sort_order) VALUES
  ('div00000-0000-0000-0000-000000000001', 'OroCommerce', 1),
  ('div00000-0000-0000-0000-000000000001', 'Marello OMS', 2),
  ('div00000-0000-0000-0000-000000000001', 'Marello B2B', 3),
  ('div00000-0000-0000-0000-000000000002', 'Magento', 1),
  ('div00000-0000-0000-0000-000000000002', 'Adobe Commerce', 2),
  ('div00000-0000-0000-0000-000000000002', 'Sulu CMS', 3),
  ('div00000-0000-0000-0000-000000000002', 'Custom Dev', 4),
  ('div00000-0000-0000-0000-000000000002', 'Consultancy', 5);
```

- [ ] **Step 2: Run the migration**

```bash
task db:migrate
```

---

## Task 2: Database Migration — Revenue Clients and Mappings

**Files:**
- Create: `supabase/migrations/00041_revenue_clients.sql`

**Steps:**

- [ ] **Step 1: Create the migration file:**

```sql
-- ============================================================================
-- Migration: Revenue clients with division and service mappings
-- ============================================================================

CREATE TABLE revenue_clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  account_id      uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenue_clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_revenue_clients_account ON revenue_clients(account_id);

ALTER TABLE revenue_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_clients_select" ON revenue_clients FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "revenue_clients_insert" ON revenue_clients FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "revenue_clients_update" ON revenue_clients FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "revenue_clients_delete" ON revenue_clients FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

CREATE TABLE revenue_client_divisions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_client_id   uuid NOT NULL REFERENCES revenue_clients(id) ON DELETE CASCADE,
  division_id         uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenue_client_divisions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_revenue_client_divisions_client ON revenue_client_divisions(revenue_client_id);
CREATE INDEX idx_revenue_client_divisions_division ON revenue_client_divisions(division_id);

ALTER TABLE revenue_client_divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_client_divisions_select" ON revenue_client_divisions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "revenue_client_divisions_write" ON revenue_client_divisions FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

CREATE TABLE revenue_client_services (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_client_id   uuid NOT NULL REFERENCES revenue_clients(id) ON DELETE CASCADE,
  division_id         uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  service_name        text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenue_client_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_revenue_client_services_client ON revenue_client_services(revenue_client_id);

ALTER TABLE revenue_client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_client_services_select" ON revenue_client_services FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "revenue_client_services_write" ON revenue_client_services FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
```

- [ ] **Step 2: Run the migration**

```bash
task db:migrate
```

---

## Task 3: Database Migration — Revenue Entries, Account Revenue, Pipeline Entries

**Files:**
- Create: `supabase/migrations/00042_revenue_entries.sql`

**Steps:**

- [ ] **Step 1: Create the migration file:**

```sql
-- ============================================================================
-- Migration: Revenue entries, account revenue, pipeline entries
-- ============================================================================

-- ── revenue_entries ─────────────────────────────────────────────────────────
CREATE TABLE revenue_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_client_id   uuid NOT NULL REFERENCES revenue_clients(id) ON DELETE CASCADE,
  division_id         uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  service_name        text NOT NULL,
  year                int NOT NULL,
  month               int NOT NULL CHECK (month >= 0 AND month <= 11),
  amount              numeric NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (revenue_client_id, division_id, service_name, year, month)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenue_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_revenue_entries_client ON revenue_entries(revenue_client_id);
CREATE INDEX idx_revenue_entries_division ON revenue_entries(division_id);
CREATE INDEX idx_revenue_entries_year ON revenue_entries(year);
CREATE INDEX idx_revenue_entries_year_month ON revenue_entries(year, month);

ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_entries_select" ON revenue_entries FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "revenue_entries_insert" ON revenue_entries FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "revenue_entries_update" ON revenue_entries FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "revenue_entries_delete" ON revenue_entries FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

-- ── account_revenue ─────────────────────────────────────────────────────────
CREATE TABLE account_revenue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  year            int NOT NULL,
  category        text NOT NULL,
  amount          numeric NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_revenue
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_account_revenue_account ON account_revenue(account_id);
CREATE INDEX idx_account_revenue_year ON account_revenue(account_id, year);

ALTER TABLE account_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_revenue_select" ON account_revenue FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "account_revenue_insert" ON account_revenue FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_revenue_update" ON account_revenue FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_revenue_delete" ON account_revenue FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

-- ── pipeline_entries ────────────────────────────────────────────────────────
CREATE TABLE pipeline_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         uuid REFERENCES deals(id) ON DELETE SET NULL,
  client          text NOT NULL,
  division_id     uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  service_name    text NOT NULL,
  sold_month      int NOT NULL CHECK (sold_month >= 0 AND sold_month <= 11),
  start_month     int NOT NULL CHECK (start_month >= 0 AND start_month <= 11),
  duration        int NOT NULL DEFAULT 1 CHECK (duration >= 1),
  total           numeric NOT NULL DEFAULT 0,
  year            int NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON pipeline_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_pipeline_entries_division ON pipeline_entries(division_id);
CREATE INDEX idx_pipeline_entries_year ON pipeline_entries(year);

ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pipeline_entries_select" ON pipeline_entries FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "pipeline_entries_insert" ON pipeline_entries FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "pipeline_entries_update" ON pipeline_entries FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "pipeline_entries_delete" ON pipeline_entries FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));
```

- [ ] **Step 2: Run migration and regenerate types**

```bash
task db:migrate && task types:generate
```

---

## Task 4: Revenue Feature — Types

**Files:**
- Create: `src/features/revenue/types.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/revenue/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

export type Division = Database['public']['Tables']['divisions']['Row'];
export type DivisionService = Database['public']['Tables']['division_services']['Row'];
export type RevenueClient = Database['public']['Tables']['revenue_clients']['Row'];
export type RevenueClientDivision = Database['public']['Tables']['revenue_client_divisions']['Row'];
export type RevenueClientService = Database['public']['Tables']['revenue_client_services']['Row'];
export type RevenueEntry = Database['public']['Tables']['revenue_entries']['Row'];
export type AccountRevenue = Database['public']['Tables']['account_revenue']['Row'];

export type RevenueClientFull = RevenueClient & {
  divisions: (RevenueClientDivision & { division: Division })[];
  services: RevenueClientService[];
};

export type DivisionWithServices = Division & {
  services: DivisionService[];
};

/**
 * Aggregated revenue data structure for display.
 * Organized as: client -> division -> service -> year -> month[12]
 */
export type RevenueData = Record<
  string, // client name
  Record<
    string, // division name
    Record<
      string, // service name
      Record<
        number, // year
        number[] // 12 monthly amounts
      >
    >
  >
>;

export const accountRevenueFormSchema = z.object({
  year: z.coerce.number(),
  category: z.string().min(1, 'Categorie is verplicht'),
  amount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export type AccountRevenueFormValues = z.infer<typeof accountRevenueFormSchema>;

export const revenueEntryFormSchema = z.object({
  revenue_client_id: z.string().uuid(),
  division_id: z.string().uuid(),
  service_name: z.string().min(1),
  year: z.coerce.number(),
  month: z.coerce.number().min(0).max(11),
  amount: z.coerce.number().min(0),
});

export type RevenueEntryFormValues = z.infer<typeof revenueEntryFormSchema>;
```

---

## Task 5: Revenue Feature — Queries

**Files:**
- Create: `src/features/revenue/queries/get-divisions.ts`
- Create: `src/features/revenue/queries/get-revenue-clients.ts`
- Create: `src/features/revenue/queries/get-revenue-entries.ts`
- Create: `src/features/revenue/queries/get-account-revenue.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/revenue/queries/get-divisions.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { DivisionWithServices } from '../types';

export const getDivisions = cache(
  async (): Promise<DivisionWithServices[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('divisions')
      .select(`
        *,
        services:division_services(*)
      `)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch divisions:', error.message);
      return [];
    }

    return (data as unknown as DivisionWithServices[]) ?? [];
  },
);
```

- [ ] **Step 2: Create `src/features/revenue/queries/get-revenue-clients.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { RevenueClientFull } from '../types';

export const getRevenueClients = cache(
  async (): Promise<RevenueClientFull[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('revenue_clients')
      .select(`
        *,
        divisions:revenue_client_divisions(*, division:divisions(*)),
        services:revenue_client_services(*)
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch revenue clients:', error.message);
      return [];
    }

    return (data as unknown as RevenueClientFull[]) ?? [];
  },
);
```

- [ ] **Step 3: Create `src/features/revenue/queries/get-revenue-entries.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { RevenueEntry } from '../types';

type GetRevenueEntriesParams = {
  year?: number;
  years?: number[];
  divisionId?: string;
  revenueClientId?: string;
};

export const getRevenueEntries = cache(
  async (params: GetRevenueEntriesParams = {}): Promise<RevenueEntry[]> => {
    const supabase = await createServerClient();

    let query = supabase
      .from('revenue_entries')
      .select('*')
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (params.year) {
      query = query.eq('year', params.year);
    }
    if (params.years && params.years.length > 0) {
      query = query.in('year', params.years);
    }
    if (params.divisionId) {
      query = query.eq('division_id', params.divisionId);
    }
    if (params.revenueClientId) {
      query = query.eq('revenue_client_id', params.revenueClientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch revenue entries:', error.message);
      return [];
    }

    return data ?? [];
  },
);
```

- [ ] **Step 4: Create `src/features/revenue/queries/get-account-revenue.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { AccountRevenue } from '../types';

export const getAccountRevenue = cache(
  async (accountId: string): Promise<AccountRevenue[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('account_revenue')
      .select('*')
      .eq('account_id', accountId)
      .order('year', { ascending: false })
      .order('category', { ascending: true });

    if (error) {
      console.error('Failed to fetch account revenue:', error.message);
      return [];
    }

    return data ?? [];
  },
);
```

---

## Task 6: Revenue Feature — Server Actions

**Files:**
- Create: `src/features/revenue/actions/upsert-revenue-entry.ts`
- Create: `src/features/revenue/actions/manage-account-revenue.ts`
- Create: `src/features/revenue/actions/save-prognose.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/revenue/actions/upsert-revenue-entry.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function upsertRevenueEntry(
  revenueClientId: string,
  divisionId: string,
  serviceName: string,
  year: number,
  month: number,
  amount: number,
) {
  await requirePermission('revenue.write');

  const supabase = await createServerClient();

  const { error } = await supabase
    .from('revenue_entries')
    .upsert(
      {
        revenue_client_id: revenueClientId,
        division_id: divisionId,
        service_name: serviceName,
        year,
        month,
        amount,
      },
      { onConflict: 'revenue_client_id,division_id,service_name,year,month' },
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/revenue');
  return { success: true };
}
```

- [ ] **Step 2: Create `src/features/revenue/actions/manage-account-revenue.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { accountRevenueFormSchema, type AccountRevenueFormValues } from '../types';

export async function createAccountRevenue(accountId: string, values: AccountRevenueFormValues) {
  await requirePermission('accounts.write');

  const parsed = accountRevenueFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('account_revenue')
    .insert({ account_id: accountId, ...parsed.data })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'account_revenue.created',
    entityType: 'account_revenue',
    entityId: data.id,
    metadata: { account_id: accountId, category: parsed.data.category, year: parsed.data.year },
  });

  revalidatePath('/admin/accounts');
  return { data };
}

export async function updateAccountRevenue(id: string, values: AccountRevenueFormValues) {
  await requirePermission('accounts.write');

  const parsed = accountRevenueFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('account_revenue')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'account_revenue.updated',
    entityType: 'account_revenue',
    entityId: id,
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}

export async function deleteAccountRevenue(id: string) {
  await requirePermission('accounts.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('account_revenue')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'account_revenue.deleted',
    entityType: 'account_revenue',
    entityId: id,
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
```

- [ ] **Step 3: Create `src/features/revenue/actions/save-prognose.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

type PrognoseEntry = {
  revenue_client_id: string;
  division_id: string;
  service_name: string;
  amount: number; // yearly total, distributed evenly across 12 months
};

/**
 * Save prognose: writes forecast-year revenue entries.
 * Distributes the yearly total evenly across 12 months (rounded).
 */
export async function savePrognose(year: number, entries: PrognoseEntry[]) {
  await requirePermission('revenue.write');

  const supabase = await createServerClient();

  // Delete existing forecast entries for this year
  const clientIds = [...new Set(entries.map((e) => e.revenue_client_id))];
  if (clientIds.length > 0) {
    await supabase
      .from('revenue_entries')
      .delete()
      .in('revenue_client_id', clientIds)
      .eq('year', year);
  }

  // Insert new entries with monthly distribution
  const rows: {
    revenue_client_id: string;
    division_id: string;
    service_name: string;
    year: number;
    month: number;
    amount: number;
  }[] = [];

  for (const entry of entries) {
    if (entry.amount <= 0) continue;
    const monthlyAmount = Math.round(entry.amount / 12);
    const remainder = entry.amount - monthlyAmount * 12;
    for (let m = 0; m < 12; m++) {
      rows.push({
        revenue_client_id: entry.revenue_client_id,
        division_id: entry.division_id,
        service_name: entry.service_name,
        year,
        month: m,
        amount: monthlyAmount + (m === 0 ? remainder : 0), // put remainder in Jan
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('revenue_entries').insert(rows);
    if (error) {
      return { error: error.message };
    }
  }

  await logAction({
    action: 'prognose.saved',
    entityType: 'revenue_entries',
    metadata: { year, entry_count: entries.length },
  });

  revalidatePath('/admin/prognose');
  return { success: true };
}
```

---

## Task 7: Pipeline Feature — Types, Queries, Actions

**Files:**
- Create: `src/features/pipeline/types.ts`
- Create: `src/features/pipeline/queries/get-pipeline-entries.ts`
- Create: `src/features/pipeline/actions/manage-pipeline-entry.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/pipeline/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

export type PipelineEntry = Database['public']['Tables']['pipeline_entries']['Row'];

export type PipelineEntryWithDivision = PipelineEntry & {
  division: { id: string; name: string; color: string } | null;
};

export const pipelineEntryFormSchema = z.object({
  client: z.string().min(1, 'Client is verplicht'),
  division_id: z.string().uuid('Division is verplicht'),
  service_name: z.string().min(1, 'Service is verplicht'),
  sold_month: z.coerce.number().min(0).max(11),
  start_month: z.coerce.number().min(0).max(11),
  duration: z.coerce.number().min(1),
  total: z.coerce.number().min(0),
  year: z.coerce.number(),
  deal_id: z.string().uuid().optional().nullable(),
});

export type PipelineEntryFormValues = z.infer<typeof pipelineEntryFormSchema>;
```

- [ ] **Step 2: Create `src/features/pipeline/queries/get-pipeline-entries.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { PipelineEntryWithDivision } from '../types';

export const getPipelineEntries = cache(
  async (year: number): Promise<PipelineEntryWithDivision[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('pipeline_entries')
      .select(`
        *,
        division:divisions!division_id(id, name, color)
      `)
      .eq('year', year)
      .order('client', { ascending: true });

    if (error) {
      console.error('Failed to fetch pipeline entries:', error.message);
      return [];
    }

    return (data as unknown as PipelineEntryWithDivision[]) ?? [];
  },
);
```

- [ ] **Step 3: Create `src/features/pipeline/actions/manage-pipeline-entry.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { pipelineEntryFormSchema, type PipelineEntryFormValues } from '../types';

export async function createPipelineEntry(values: PipelineEntryFormValues) {
  await requirePermission('revenue.write');

  const parsed = pipelineEntryFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('pipeline_entries')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'pipeline_entry.created',
    entityType: 'pipeline_entry',
    entityId: data.id,
    metadata: { client: parsed.data.client },
  });

  revalidatePath('/admin/pipeline');
  return { data };
}

export async function updatePipelineEntry(id: string, values: PipelineEntryFormValues) {
  await requirePermission('revenue.write');

  const parsed = pipelineEntryFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('pipeline_entries')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'pipeline_entry.updated',
    entityType: 'pipeline_entry',
    entityId: id,
  });

  revalidatePath('/admin/pipeline');
  return { success: true };
}

export async function deletePipelineEntry(id: string) {
  await requirePermission('revenue.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('pipeline_entries')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'pipeline_entry.deleted',
    entityType: 'pipeline_entry',
    entityId: id,
  });

  revalidatePath('/admin/pipeline');
  return { success: true };
}
```

---

## Task 8: Revenue Page

**Files:**
- Create: `src/app/admin/revenue/page.tsx`
- Create: `src/app/admin/revenue/loading.tsx`
- Create: `src/features/revenue/components/revenue-page-client.tsx`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/revenue/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function RevenueLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/revenue/components/revenue-page-client.tsx`**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RevenueEntry, RevenueClientFull, DivisionWithServices } from '../types';

type Props = {
  clients: RevenueClientFull[];
  divisions: DivisionWithServices[];
  entries: RevenueEntry[];
  years: number[];
};

const MONTHS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function RevenuePageClient({ clients, divisions, entries, years }: Props) {
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1] ?? new Date().getFullYear());
  const [divFilter, setDivFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'client' | 'service'>('client');

  const yearEntries = useMemo(
    () => entries.filter((e) => e.year === selectedYear && (divFilter === 'all' || e.division_id === divFilter)),
    [entries, selectedYear, divFilter],
  );

  // Build client totals
  const clientTotals = useMemo(() => {
    const totals: Record<string, { total: number; months: number[] }> = {};
    for (const client of clients) {
      totals[client.id] = { total: 0, months: Array(12).fill(0) };
    }
    for (const e of yearEntries) {
      if (totals[e.revenue_client_id]) {
        totals[e.revenue_client_id].total += Number(e.amount);
        totals[e.revenue_client_id].months[e.month] += Number(e.amount);
      }
    }
    return totals;
  }, [clients, yearEntries]);

  const grandTotal = Object.values(clientTotals).reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={divFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDivFilter('all')}
          >
            Alle
          </Button>
          {divisions.map((d) => (
            <Button
              key={d.id}
              variant={divFilter === d.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDivFilter(d.id)}
              style={divFilter === d.id ? { backgroundColor: d.color ?? undefined } : {}}
            >
              {d.name}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          <Button
            variant={viewMode === 'client' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('client')}
          >
            Client
          </Button>
          <Button
            variant={viewMode === 'service' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('service')}
          >
            Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Totaal: {fmt(grandTotal)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sticky left-0 bg-white min-w-[190px]">
                    {viewMode === 'client' ? 'Client' : 'Service'}
                  </th>
                  {MONTHS.map((m) => (
                    <th key={m} className="text-right p-2 min-w-[78px]">{m}</th>
                  ))}
                  <th className="text-right p-2 min-w-[90px] font-bold">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'client' &&
                  clients
                    .filter((c) => (clientTotals[c.id]?.total ?? 0) > 0)
                    .sort((a, b) => (clientTotals[b.id]?.total ?? 0) - (clientTotals[a.id]?.total ?? 0))
                    .map((client) => {
                      const ct = clientTotals[client.id];
                      return (
                        <tr key={client.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 sticky left-0 bg-white font-medium">{client.name}</td>
                          {ct.months.map((m, i) => (
                            <td key={i} className="text-right p-2 tabular-nums">{m > 0 ? fmt(m) : ''}</td>
                          ))}
                          <td className="text-right p-2 font-bold tabular-nums">{fmt(ct.total)}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/revenue/page.tsx`**

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { getDivisions } from '@/features/revenue/queries/get-divisions';
import { getRevenueClients } from '@/features/revenue/queries/get-revenue-clients';
import { getRevenueEntries } from '@/features/revenue/queries/get-revenue-entries';
import { RevenuePageClient } from '@/features/revenue/components/revenue-page-client';

export default async function RevenuePage() {
  const [divisions, clients, entries] = await Promise.all([
    getDivisions(),
    getRevenueClients(),
    getRevenueEntries({ years: [2023, 2024, 2025, 2026] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Revenue' },
        ]}
      />
      <RevenuePageClient
        clients={clients}
        divisions={divisions}
        entries={entries}
        years={[2023, 2024, 2025, 2026]}
      />
    </div>
  );
}
```

---

## Task 9: Prognose Page

**Files:**
- Create: `src/app/admin/prognose/page.tsx`
- Create: `src/app/admin/prognose/loading.tsx`
- Create: `src/features/prognose/types.ts`
- Create: `src/features/prognose/components/prognose-editor.tsx`

**Steps:**

- [ ] **Step 1: Create loading skeleton**

`src/app/admin/prognose/loading.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function PrognoseLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/prognose/types.ts`**

```ts
export type PrognoseLineAction = 'copy' | 'custom' | 'stop';

export type PrognoseLine = {
  clientId: string;
  clientName: string;
  divisionId: string;
  divisionName: string;
  serviceName: string;
  lastKnownTotal: number;
  forecastTotal: number;
  action: PrognoseLineAction;
};
```

- [ ] **Step 3: Create `src/features/prognose/components/prognose-editor.tsx`**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/admin/stat-card';
import { DollarSign, TrendingUp, Users } from 'lucide-react';
import { savePrognose } from '@/features/revenue/actions/save-prognose';
import type { RevenueClientFull, DivisionWithServices, RevenueEntry } from '@/features/revenue/types';
import type { PrognoseLine, PrognoseLineAction } from '../types';

type Props = {
  clients: RevenueClientFull[];
  divisions: DivisionWithServices[];
  entries: RevenueEntry[];
  forecastYear: number;
  lastKnownYear: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function PrognoseEditor({ clients, divisions, entries, forecastYear, lastKnownYear }: Props) {
  // Build initial lines from last known year data
  const initialLines = useMemo(() => {
    const lines: PrognoseLine[] = [];
    for (const client of clients) {
      for (const svc of client.services) {
        const div = divisions.find((d) => d.id === svc.division_id);
        const lastYearEntries = entries.filter(
          (e) =>
            e.revenue_client_id === client.id &&
            e.division_id === svc.division_id &&
            e.service_name === svc.service_name &&
            e.year === lastKnownYear,
        );
        const lastKnownTotal = lastYearEntries.reduce((s, e) => s + Number(e.amount), 0);

        lines.push({
          clientId: client.id,
          clientName: client.name,
          divisionId: svc.division_id,
          divisionName: div?.name ?? '',
          serviceName: svc.service_name,
          lastKnownTotal,
          forecastTotal: lastKnownTotal, // default: copy
          action: 'copy',
        });
      }
    }
    return lines;
  }, [clients, divisions, entries, lastKnownYear]);

  const [lines, setLines] = useState(initialLines);
  const [saving, setSaving] = useState(false);

  const totalForecast = lines.reduce((s, l) => s + l.forecastTotal, 0);
  const totalLastYear = lines.reduce((s, l) => s + l.lastKnownTotal, 0);
  const consultancyTotal = lines
    .filter((l) => l.serviceName.toLowerCase() === 'consultancy')
    .reduce((s, l) => s + l.forecastTotal, 0);

  function updateLine(index: number, action: PrognoseLineAction, customAmount?: number) {
    setLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[index] };
      line.action = action;
      if (action === 'copy') line.forecastTotal = line.lastKnownTotal;
      else if (action === 'stop') line.forecastTotal = 0;
      else if (action === 'custom' && customAmount !== undefined) line.forecastTotal = customAmount;
      updated[index] = line;
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    const prognoseEntries = lines
      .filter((l) => l.forecastTotal > 0)
      .map((l) => ({
        revenue_client_id: l.clientId,
        division_id: l.divisionId,
        service_name: l.serviceName,
        amount: l.forecastTotal,
      }));

    await savePrognose(forecastYear, prognoseEntries);
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title={`Prognose ${forecastYear}`} value={fmt(totalForecast)} icon={TrendingUp} />
        <StatCard title={`Realisatie ${lastKnownYear}`} value={fmt(totalLastYear)} icon={DollarSign} />
        <StatCard title="Consultancy" value={fmt(consultancyTotal)} icon={Users} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Prognose {forecastYear}</CardTitle>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Client</th>
                <th className="text-left p-2">Division</th>
                <th className="text-left p-2">Service</th>
                <th className="text-right p-2">{lastKnownYear}</th>
                <th className="text-right p-2">{forecastYear}</th>
                <th className="text-center p-2">Actie</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={`${line.clientId}-${line.divisionId}-${line.serviceName}`} className={`border-b ${line.action === 'stop' ? 'opacity-50 line-through' : ''}`}>
                  <td className="p-2">{line.clientName}</td>
                  <td className="p-2">{line.divisionName}</td>
                  <td className="p-2">{line.serviceName}</td>
                  <td className="text-right p-2 tabular-nums">{fmt(line.lastKnownTotal)}</td>
                  <td className="text-right p-2">
                    {line.action === 'custom' ? (
                      <Input
                        type="number"
                        value={line.forecastTotal}
                        onChange={(e) => updateLine(i, 'custom', Number(e.target.value))}
                        className="w-28 text-right inline-block"
                      />
                    ) : (
                      <span className="tabular-nums">{fmt(line.forecastTotal)}</span>
                    )}
                  </td>
                  <td className="text-center p-2">
                    <div className="flex gap-1 justify-center">
                      <Button
                        variant={line.action === 'copy' ? 'default' : 'ghost'}
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => updateLine(i, 'copy')}
                      >
                        Zelfde
                      </Button>
                      <Button
                        variant={line.action === 'custom' ? 'default' : 'ghost'}
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => updateLine(i, 'custom', line.forecastTotal)}
                      >
                        Aanpassen
                      </Button>
                      <Button
                        variant={line.action === 'stop' ? 'destructive' : 'ghost'}
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => updateLine(i, 'stop')}
                      >
                        Gestopt
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/admin/prognose/page.tsx`**

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { getDivisions } from '@/features/revenue/queries/get-divisions';
import { getRevenueClients } from '@/features/revenue/queries/get-revenue-clients';
import { getRevenueEntries } from '@/features/revenue/queries/get-revenue-entries';
import { PrognoseEditor } from '@/features/prognose/components/prognose-editor';

const FORECAST_YEAR = 2026;
const LAST_KNOWN_YEAR = 2025;

export default async function PrognosePage() {
  const [divisions, clients, entries] = await Promise.all([
    getDivisions(),
    getRevenueClients(),
    getRevenueEntries({ years: [2023, 2024, 2025, 2026] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prognose"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Prognose' },
        ]}
      />
      <PrognoseEditor
        clients={clients}
        divisions={divisions}
        entries={entries}
        forecastYear={FORECAST_YEAR}
        lastKnownYear={LAST_KNOWN_YEAR}
      />
    </div>
  );
}
```

---

## Task 10: Pipeline Analytics Page

**Files:**
- Create: `src/app/admin/pipeline/page.tsx`
- Create: `src/app/admin/pipeline/loading.tsx`
- Create: `src/features/pipeline/components/pipeline-page-client.tsx`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/pipeline/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/pipeline/components/pipeline-page-client.tsx`**

```tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/admin/stat-card';
import { DollarSign } from 'lucide-react';
import type { PipelineEntryWithDivision } from '../types';
import type { DivisionWithServices } from '@/features/revenue/types';

type Props = {
  entries: PipelineEntryWithDivision[];
  divisions: DivisionWithServices[];
  year: number;
};

const MONTHS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function PipelinePageClient({ entries, divisions, year }: Props) {
  const totalSold = entries.reduce((s, e) => s + Number(e.total), 0);

  // Group by division
  const byDivision = useMemo(() => {
    const groups: Record<string, { name: string; color: string; entries: PipelineEntryWithDivision[]; total: number }> = {};
    for (const e of entries) {
      const divName = e.division?.name ?? 'Unknown';
      const divColor = e.division?.color ?? '#666';
      if (!groups[divName]) {
        groups[divName] = { name: divName, color: divColor, entries: [], total: 0 };
      }
      groups[divName].entries.push(e);
      groups[divName].total += Number(e.total);
    }
    return Object.values(groups);
  }, [entries]);

  // Compute monthly spread for an entry
  function monthlySpread(entry: PipelineEntryWithDivision): number[] {
    const months = Array(12).fill(0);
    const monthlyAmount = Number(entry.total) / entry.duration;
    for (let i = 0; i < entry.duration; i++) {
      const m = entry.start_month + i;
      if (m < 12) months[m] += monthlyAmount;
    }
    return months;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={`Totaal Sold ${year}`} value={fmt(totalSold)} icon={DollarSign} />
        {byDivision.map((d) => (
          <StatCard key={d.name} title={d.name} value={fmt(d.total)} icon={DollarSign} />
        ))}
      </div>

      {byDivision.map((divGroup) => (
        <Card key={divGroup.name}>
          <CardHeader>
            <CardTitle className="text-sm" style={{ color: divGroup.color }}>
              {divGroup.name} — {fmt(divGroup.total)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 min-w-[150px]">Client</th>
                    <th className="text-left p-2">Service</th>
                    <th className="text-right p-2">Totaal</th>
                    {MONTHS.map((m) => (
                      <th key={m} className="text-right p-2 min-w-[60px]">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {divGroup.entries.map((entry) => {
                    const spread = monthlySpread(entry);
                    return (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{entry.client}</td>
                        <td className="p-2">{entry.service_name}</td>
                        <td className="text-right p-2 font-medium tabular-nums">{fmt(Number(entry.total))}</td>
                        {spread.map((v, i) => (
                          <td key={i} className="text-right p-2 tabular-nums text-xs">
                            {v > 0 ? fmt(Math.round(v)) : ''}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/pipeline/page.tsx`**

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { getPipelineEntries } from '@/features/pipeline/queries/get-pipeline-entries';
import { getDivisions } from '@/features/revenue/queries/get-divisions';
import { PipelinePageClient } from '@/features/pipeline/components/pipeline-page-client';

const PIPELINE_YEAR = 2026;

export default async function PipelineAnalyticsPage() {
  const [entries, divisions] = await Promise.all([
    getPipelineEntries(PIPELINE_YEAR),
    getDivisions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Pipeline' },
        ]}
      />
      <PipelinePageClient entries={entries} divisions={divisions} year={PIPELINE_YEAR} />
    </div>
  );
}
```

---

## Task 11: Seed Data — Finance

**Files:**
- Create: `supabase/migrations/00043_seed_finance.sql`

**Steps:**

- [ ] **Step 1: Create seed migration**

```sql
-- ============================================================================
-- Seed: Finance data (revenue clients, revenue entries, account revenue)
-- ============================================================================

-- ── Revenue Clients ─────────────────────────────────────────────────────────
INSERT INTO revenue_clients (id, name) VALUES
  ('rc000000-0000-0000-0000-000000000001', 'Belcolor'),
  ('rc000000-0000-0000-0000-000000000002', 'Nordex Group'),
  ('rc000000-0000-0000-0000-000000000003', 'Solavio'),
  ('rc000000-0000-0000-0000-000000000004', 'Lumex Retail'),
  ('rc000000-0000-0000-0000-000000000005', 'Arvato Connect'),
  ('rc000000-0000-0000-0000-000000000006', 'Flexpoint'),
  ('rc000000-0000-0000-0000-000000000007', 'Medifurn'),
  ('rc000000-0000-0000-0000-000000000008', 'Triskelion'),
  ('rc000000-0000-0000-0000-000000000009', 'Cronova'),
  ('rc000000-0000-0000-0000-000000000010', 'Veldora');

-- ── Revenue Client Divisions ────────────────────────────────────────────────
INSERT INTO revenue_client_divisions (revenue_client_id, division_id) VALUES
  ('rc000000-0000-0000-0000-000000000001', 'div00000-0000-0000-0000-000000000001'),
  ('rc000000-0000-0000-0000-000000000002', 'div00000-0000-0000-0000-000000000002'),
  ('rc000000-0000-0000-0000-000000000003', 'div00000-0000-0000-0000-000000000001'),
  ('rc000000-0000-0000-0000-000000000003', 'div00000-0000-0000-0000-000000000002'),
  ('rc000000-0000-0000-0000-000000000004', 'div00000-0000-0000-0000-000000000002'),
  ('rc000000-0000-0000-0000-000000000005', 'div00000-0000-0000-0000-000000000001'),
  ('rc000000-0000-0000-0000-000000000006', 'div00000-0000-0000-0000-000000000001'),
  ('rc000000-0000-0000-0000-000000000006', 'div00000-0000-0000-0000-000000000002'),
  ('rc000000-0000-0000-0000-000000000007', 'div00000-0000-0000-0000-000000000002'),
  ('rc000000-0000-0000-0000-000000000008', 'div00000-0000-0000-0000-000000000001'),
  ('rc000000-0000-0000-0000-000000000009', 'div00000-0000-0000-0000-000000000002'),
  ('rc000000-0000-0000-0000-000000000010', 'div00000-0000-0000-0000-000000000001'),
  ('rc000000-0000-0000-0000-000000000010', 'div00000-0000-0000-0000-000000000002');

-- ── Revenue Client Services ────────────────────────────────────────────────
INSERT INTO revenue_client_services (revenue_client_id, division_id, service_name) VALUES
  ('rc000000-0000-0000-0000-000000000001', 'div00000-0000-0000-0000-000000000001', 'OroCommerce'),
  ('rc000000-0000-0000-0000-000000000001', 'div00000-0000-0000-0000-000000000001', 'Marello OMS'),
  ('rc000000-0000-0000-0000-000000000002', 'div00000-0000-0000-0000-000000000002', 'Magento'),
  ('rc000000-0000-0000-0000-000000000002', 'div00000-0000-0000-0000-000000000002', 'Consultancy'),
  ('rc000000-0000-0000-0000-000000000003', 'div00000-0000-0000-0000-000000000001', 'Marello B2B'),
  ('rc000000-0000-0000-0000-000000000003', 'div00000-0000-0000-0000-000000000001', 'OroCommerce'),
  ('rc000000-0000-0000-0000-000000000003', 'div00000-0000-0000-0000-000000000002', 'Custom Dev'),
  ('rc000000-0000-0000-0000-000000000003', 'div00000-0000-0000-0000-000000000002', 'Sulu CMS'),
  ('rc000000-0000-0000-0000-000000000004', 'div00000-0000-0000-0000-000000000002', 'Adobe Commerce'),
  ('rc000000-0000-0000-0000-000000000004', 'div00000-0000-0000-0000-000000000002', 'Consultancy'),
  ('rc000000-0000-0000-0000-000000000004', 'div00000-0000-0000-0000-000000000002', 'Custom Dev'),
  ('rc000000-0000-0000-0000-000000000005', 'div00000-0000-0000-0000-000000000001', 'Marello OMS'),
  ('rc000000-0000-0000-0000-000000000005', 'div00000-0000-0000-0000-000000000001', 'Marello B2B'),
  ('rc000000-0000-0000-0000-000000000006', 'div00000-0000-0000-0000-000000000001', 'OroCommerce'),
  ('rc000000-0000-0000-0000-000000000006', 'div00000-0000-0000-0000-000000000002', 'Magento'),
  ('rc000000-0000-0000-0000-000000000006', 'div00000-0000-0000-0000-000000000002', 'Custom Dev'),
  ('rc000000-0000-0000-0000-000000000007', 'div00000-0000-0000-0000-000000000002', 'Sulu CMS'),
  ('rc000000-0000-0000-0000-000000000007', 'div00000-0000-0000-0000-000000000002', 'Consultancy'),
  ('rc000000-0000-0000-0000-000000000008', 'div00000-0000-0000-0000-000000000001', 'OroCommerce'),
  ('rc000000-0000-0000-0000-000000000008', 'div00000-0000-0000-0000-000000000001', 'Marello OMS'),
  ('rc000000-0000-0000-0000-000000000008', 'div00000-0000-0000-0000-000000000001', 'Marello B2B'),
  ('rc000000-0000-0000-0000-000000000009', 'div00000-0000-0000-0000-000000000002', 'Adobe Commerce'),
  ('rc000000-0000-0000-0000-000000000009', 'div00000-0000-0000-0000-000000000002', 'Custom Dev'),
  ('rc000000-0000-0000-0000-000000000010', 'div00000-0000-0000-0000-000000000001', 'Marello B2B'),
  ('rc000000-0000-0000-0000-000000000010', 'div00000-0000-0000-0000-000000000002', 'Magento'),
  ('rc000000-0000-0000-0000-000000000010', 'div00000-0000-0000-0000-000000000002', 'Consultancy');

-- ── Account Revenue (Omzet tab) ────────────────────────────────────────────
INSERT INTO account_revenue (account_id, year, category, amount, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 2023, 'Consultancy', 185000, 'Kevin Martens fulltime'),
  ('a0000000-0000-0000-0000-000000000001', 2023, 'Magento', 62000, 'E-commerce migratie fase 1'),
  ('a0000000-0000-0000-0000-000000000001', 2024, 'Consultancy', 248000, 'Kevin + Elien'),
  ('a0000000-0000-0000-0000-000000000001', 2024, 'Adobe Commerce', 38400, 'Adobe Commerce upgrade'),
  ('a0000000-0000-0000-0000-000000000001', 2024, 'Hyva', 95000, 'Hyva theme implementatie'),
  ('a0000000-0000-0000-0000-000000000001', 2025, 'Consultancy', 275000, 'Kevin + Elien lopend'),
  ('a0000000-0000-0000-0000-000000000001', 2025, 'Adobe Commerce', 45000, 'Adobe Commerce extensies'),
  ('a0000000-0000-0000-0000-000000000001', 2025, 'Custom Dev', 38000, 'Custom integraties'),
  ('a0000000-0000-0000-0000-000000000003', 2023, 'Magento', 35000, 'Portaal implementatie'),
  ('a0000000-0000-0000-0000-000000000003', 2024, 'Consultancy', 89000, 'Yasmine El Amrani'),
  ('a0000000-0000-0000-0000-000000000003', 2024, 'Hyva', 42000, 'Hyva integratie zorgplatform'),
  ('a0000000-0000-0000-0000-000000000003', 2025, 'Consultancy', 55000, 'Lopend');

-- Note: Revenue entries (monthly granularity) are generated programmatically
-- in the demo. For the seed, we skip generating 4 years * 12 months * ~25
-- service lines = ~1200 rows. The app will start with account_revenue data
-- for the Omzet tab. Revenue entries can be added via the UI or a separate
-- seed script run with `node scripts/seed-revenue-entries.ts`.
```

- [ ] **Step 2: Run the seed migration**

```bash
task db:migrate
```

---

## Task 12: Verify and Commit

**Steps:**

- [ ] **Step 1: Regenerate TypeScript types**

```bash
task types:generate
```

- [ ] **Step 2: Verify the app compiles**

```bash
task build
```

- [ ] **Step 3: Verify pages load in dev**

Visit:
- `/admin/revenue` — revenue table with year/division filters
- `/admin/prognose` — prognose editor with stat cards
- `/admin/pipeline` — pipeline analytics grouped by division

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement Layer 5 — Finance (divisions, revenue, prognose, pipeline analytics)"
```
