# Layer 3: Sales — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement deals (with kanban + list views across 3 pipelines), activities, tasks, and the main dashboard — the complete sales workflow.

**Architecture:** Deals reference accounts, contacts, pipelines, and pipeline stages. Activities and tasks link to accounts and optionally to deals. The dashboard aggregates data from deals, activities, and tasks. Deals support a close flow (won/lost/longterm) and forecast categories. The kanban board uses @dnd-kit from Layer 1.

**Tech Stack:** Supabase (PostgreSQL, RLS), React 19, @dnd-kit (kanban), Zod, shadcn/ui, Plate rich text editor (activity notes)

**Spec:** `docs/superpowers/specs/2026-03-13-crm-port-design.md`

**IMPORTANT — Cross-cutting pattern:** Every server action that performs a write (create/update/delete) MUST call `revalidatePath('/admin/<entity>')` before returning. Import: `import { revalidatePath } from 'next/cache';`

**Depends on:** Layer 1 (Foundation), Layer 2 (Core CRM — accounts, contacts)

---

## Task 1: Database Migration — Deals

**Files:**
- Create: `supabase/migrations/00020_deals.sql`

**Steps:**

- [ ] **Step 1: Create the migration file with the following SQL:**

```sql
-- ============================================================================
-- Migration: Deals
-- ============================================================================

CREATE TABLE deals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  account_id          uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  pipeline_id         uuid NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
  stage_id            uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  amount              numeric DEFAULT 0,
  close_date          date,
  probability         int DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  owner_id            uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  description         text,
  contact_id          uuid REFERENCES contacts(id) ON DELETE SET NULL,
  lead_source         text,
  origin              text CHECK (origin IN ('rechtstreeks', 'cronos')),
  cronos_cc           text,
  cronos_contact      text,
  cronos_email        text,
  bench_consultant_id uuid,  -- FK to bench_consultants added in Layer 4
  consultant_role     text,
  forecast_category   text CHECK (forecast_category IN ('Commit', 'Best Case', 'Pipeline', 'Omit')),
  closed_at           timestamptz,
  closed_type         text CHECK (closed_type IN ('won', 'lost', 'longterm')),
  closed_reason       text,
  closed_notes        text,
  longterm_date       date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_deals_account ON deals(account_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_closed_type ON deals(closed_type);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_select" ON deals FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "deals_insert" ON deals FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "deals_update" ON deals FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "deals_delete" ON deals FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

ALTER PUBLICATION supabase_realtime ADD TABLE deals;

-- Add deal_id FK to communications (was deferred from Layer 2)
ALTER TABLE communications
  ADD CONSTRAINT communications_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

CREATE INDEX idx_communications_deal ON communications(deal_id);
```

- [ ] **Step 2: Run the migration**

```bash
task db:migrate
```

---

## Task 2: Database Migration — Activities and Tasks

**Files:**
- Create: `supabase/migrations/00021_activities_tasks.sql`

**Steps:**

- [ ] **Step 1: Create the migration file with the following SQL:**

```sql
-- ============================================================================
-- Migration: Activities and Tasks
-- ============================================================================

-- ── activities ──────────────────────────────────────────────────────────────
CREATE TABLE activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text NOT NULL CHECK (type IN ('Meeting', 'Demo', 'Call', 'E-mail', 'Lunch', 'Event')),
  subject           text NOT NULL,
  date              timestamptz NOT NULL,
  duration_minutes  int,
  account_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id           uuid REFERENCES deals(id) ON DELETE SET NULL,
  owner_id          uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes             jsonb,
  is_done           bool NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_activities_account ON activities(account_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_owner ON activities(owner_id);
CREATE INDEX idx_activities_date ON activities(date DESC);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON activities FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "activities_insert" ON activities FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "activities_update" ON activities FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "activities_delete" ON activities FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

ALTER PUBLICATION supabase_realtime ADD TABLE activities;

-- ── tasks ───────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  due_date        date,
  priority        text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status          text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Done')),
  account_id      uuid REFERENCES accounts(id) ON DELETE SET NULL,
  deal_id         uuid REFERENCES deals(id) ON DELETE SET NULL,
  assigned_to     uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_tasks_account ON tasks(account_id);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

- [ ] **Step 2: Run migration and regenerate types**

```bash
task db:migrate && task types:generate
```

---

## Task 3: Deals Feature — Types

**Files:**
- Create: `src/features/deals/types.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/deals/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

// ── Row types ───────────────────────────────────────────────────────────────
export type Deal = Database['public']['Tables']['deals']['Row'];

// ── Extended type ───────────────────────────────────────────────────────────
export type DealWithRelations = Deal & {
  account: { id: string; name: string } | null;
  contact: { id: string; first_name: string; last_name: string } | null;
  owner: { id: string; full_name: string | null } | null;
  stage: { id: string; name: string; color: string; probability: number; is_closed: boolean; is_won: boolean; is_longterm: boolean } | null;
  pipeline: { id: string; name: string; type: string } | null;
};

// ── Kanban card type ────────────────────────────────────────────────────────
export type DealCard = {
  id: string;
  title: string;
  amount: number;
  probability: number;
  close_date: string | null;
  account_name: string;
  owner_name: string | null;
  stage_id: string;
  forecast_category: string | null;
};

// ── Zod schemas ─────────────────────────────────────────────────────────────
export const dealFormSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  account_id: z.string().uuid('Account is verplicht'),
  pipeline_id: z.string().uuid('Pipeline is verplicht'),
  stage_id: z.string().uuid('Stage is verplicht'),
  amount: z.coerce.number().min(0).optional(),
  close_date: z.string().optional().nullable(),
  probability: z.coerce.number().min(0).max(100).optional(),
  owner_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  contact_id: z.string().uuid().optional().nullable(),
  lead_source: z.string().optional(),
  origin: z.enum(['rechtstreeks', 'cronos']).optional(),
  cronos_cc: z.string().optional(),
  cronos_contact: z.string().optional(),
  cronos_email: z.string().optional(),
  bench_consultant_id: z.string().uuid().optional().nullable(),
  consultant_role: z.string().optional(),
  forecast_category: z.enum(['Commit', 'Best Case', 'Pipeline', 'Omit']).optional().nullable(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;

export const closeDealSchema = z.object({
  closed_type: z.enum(['won', 'lost', 'longterm']),
  closed_reason: z.string().optional(),
  closed_notes: z.string().optional(),
  longterm_date: z.string().optional().nullable(),
}).refine(
  (data) => data.closed_type !== 'longterm' || !!data.longterm_date,
  { message: 'Follow-up datum is verplicht voor longterm deals', path: ['longterm_date'] }
);

export type CloseDealValues = z.infer<typeof closeDealSchema>;

// ── Filter types ────────────────────────────────────────────────────────────
export type DealFilters = {
  pipeline_id?: string;
  search?: string;
  owner_id?: string;
  forecast_category?: string;
};
```

---

## Task 4: Deals Feature — Queries

**Files:**
- Create: `src/features/deals/queries/get-deals.ts`
- Create: `src/features/deals/queries/get-deal.ts`
- Create: `src/features/deals/queries/get-deals-by-pipeline.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/deals/queries/get-deals.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { DealWithRelations, DealFilters } from '../types';

type GetDealsParams = {
  filters?: DealFilters;
  page?: number;
  pageSize?: number;
};

export const getDeals = cache(
  async ({
    filters,
    page = 1,
    pageSize = 50,
  }: GetDealsParams = {}): Promise<{ data: DealWithRelations[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('deals')
      .select(`
        *,
        account:accounts!account_id(id, name),
        contact:contacts!contact_id(id, first_name, last_name),
        owner:user_profiles!owner_id(id, full_name),
        stage:pipeline_stages!stage_id(id, name, color, probability, is_closed, is_won, is_longterm),
        pipeline:pipelines!pipeline_id(id, name, type)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.pipeline_id) {
      query = query.eq('pipeline_id', filters.pipeline_id);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.forecast_category) {
      query = query.eq('forecast_category', filters.forecast_category);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch deals:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as DealWithRelations[]) ?? [], count: count ?? 0 };
  },
);
```

- [ ] **Step 2: Create `src/features/deals/queries/get-deal.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { DealWithRelations } from '../types';

export const getDeal = cache(
  async (id: string): Promise<DealWithRelations | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        account:accounts!account_id(id, name),
        contact:contacts!contact_id(id, first_name, last_name),
        owner:user_profiles!owner_id(id, full_name),
        stage:pipeline_stages!stage_id(id, name, color, probability, is_closed, is_won, is_longterm),
        pipeline:pipelines!pipeline_id(id, name, type)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch deal:', error.message);
      return null;
    }

    return data as unknown as DealWithRelations;
  },
);
```

- [ ] **Step 3: Create `src/features/deals/queries/get-deals-by-pipeline.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { DealCard } from '../types';

/**
 * Fetches all open deals for a pipeline, formatted for kanban display.
 * Excludes closed deals (won/lost/longterm).
 */
export const getDealsByPipeline = cache(
  async (pipelineId: string): Promise<DealCard[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('deals')
      .select(`
        id, title, amount, probability, close_date, stage_id, forecast_category,
        account:accounts!account_id(name),
        owner:user_profiles!owner_id(full_name),
        stage:pipeline_stages!stage_id(is_closed)
      `)
      .eq('pipeline_id', pipelineId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch deals by pipeline:', error.message);
      return [];
    }

    return (data ?? []).map((d: any) => ({
      id: d.id,
      title: d.title,
      amount: Number(d.amount ?? 0),
      probability: d.probability ?? 0,
      close_date: d.close_date,
      account_name: d.account?.name ?? '',
      owner_name: d.owner?.full_name ?? null,
      stage_id: d.stage_id,
      forecast_category: d.forecast_category,
    }));
  },
);
```

---

## Task 5: Deals Feature — Server Actions

**Files:**
- Create: `src/features/deals/actions/create-deal.ts`
- Create: `src/features/deals/actions/update-deal.ts`
- Create: `src/features/deals/actions/delete-deal.ts`
- Create: `src/features/deals/actions/close-deal.ts`
- Create: `src/features/deals/actions/move-deal-stage.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/deals/actions/create-deal.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { dealFormSchema, type DealFormValues } from '../types';

export async function createDeal(values: DealFormValues) {
  const { userId } = await requirePermission('deals.write');

  const parsed = dealFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('deals')
    .insert({ ...parsed.data, owner_id: parsed.data.owner_id ?? userId })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'deal.created',
    entityType: 'deal',
    entityId: data.id,
    metadata: { title: parsed.data.title },
  });

  revalidatePath('/admin/deals');
  return { data };
}
```

- [ ] **Step 2: Create `src/features/deals/actions/update-deal.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { dealFormSchema, type DealFormValues } from '../types';

export async function updateDeal(id: string, values: DealFormValues) {
  await requirePermission('deals.write');

  const parsed = dealFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('deals')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'deal.updated',
    entityType: 'deal',
    entityId: id,
  });

  revalidatePath('/admin/deals');
  return { success: true };
}
```

- [ ] **Step 3: Create `src/features/deals/actions/delete-deal.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function deleteDeal(id: string) {
  await requirePermission('deals.delete');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'deal.deleted',
    entityType: 'deal',
    entityId: id,
  });

  revalidatePath('/admin/deals');
  return { success: true };
}
```

- [ ] **Step 4: Create `src/features/deals/actions/close-deal.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { closeDealSchema, type CloseDealValues } from '../types';

export async function closeDeal(dealId: string, values: CloseDealValues) {
  await requirePermission('deals.write');

  const parsed = closeDealSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();

  // Get the appropriate closed stage for the deal's pipeline
  const { data: deal } = await supabase
    .from('deals')
    .select('pipeline_id')
    .eq('id', dealId)
    .single();

  if (!deal) {
    return { error: 'Deal not found' };
  }

  // Find the correct closed stage based on closed_type
  let stageQuery = supabase
    .from('pipeline_stages')
    .select('id, probability')
    .eq('pipeline_id', deal.pipeline_id)
    .eq('is_closed', true);

  if (parsed.data.closed_type === 'won') {
    stageQuery = stageQuery.eq('is_won', true);
  } else if (parsed.data.closed_type === 'longterm') {
    stageQuery = stageQuery.eq('is_longterm', true);
  } else {
    // lost: closed but not won and not longterm
    stageQuery = stageQuery.eq('is_won', false).eq('is_longterm', false);
  }

  const { data: stage } = await stageQuery.single();

  if (!stage) {
    return { error: 'Could not find appropriate closed stage' };
  }

  const { error } = await supabase
    .from('deals')
    .update({
      stage_id: stage.id,
      closed_at: new Date().toISOString(),
      closed_type: parsed.data.closed_type,
      closed_reason: parsed.data.closed_reason,
      closed_notes: parsed.data.closed_notes,
      longterm_date: parsed.data.longterm_date,
      probability: parsed.data.closed_type === 'won' ? 100 : parsed.data.closed_type === 'longterm' ? stage.probability : 0,
    })
    .eq('id', dealId);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: `deal.closed.${parsed.data.closed_type}`,
    entityType: 'deal',
    entityId: dealId,
    metadata: { closed_type: parsed.data.closed_type, reason: parsed.data.closed_reason },
  });

  revalidatePath('/admin/deals');
  return { success: true };
}
```

- [ ] **Step 5: Create `src/features/deals/actions/move-deal-stage.ts`**

This is called from the kanban drag-and-drop handler.

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';

export async function moveDealStage(dealId: string, newStageId: string) {
  await requirePermission('deals.write');

  const supabase = await createServerClient();

  // Get the new stage's probability
  const { data: stage } = await supabase
    .from('pipeline_stages')
    .select('probability, is_closed')
    .eq('id', newStageId)
    .single();

  if (!stage) {
    return { error: 'Stage not found' };
  }

  // Don't allow dragging to closed stages — use close-deal action instead
  if (stage.is_closed) {
    return { error: 'Use the close deal flow for closed stages' };
  }

  const { error } = await supabase
    .from('deals')
    .update({
      stage_id: newStageId,
      probability: stage.probability,
    })
    .eq('id', dealId);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'deal.stage_moved',
    entityType: 'deal',
    entityId: dealId,
    metadata: { new_stage_id: newStageId },
  });

  return { success: true };
}
```

---

## Task 6: Activities Feature — Types, Queries, Actions

**Files:**
- Create: `src/features/activities/types.ts`
- Create: `src/features/activities/queries/get-activities.ts`
- Create: `src/features/activities/actions/create-activity.ts`
- Create: `src/features/activities/actions/update-activity.ts`
- Create: `src/features/activities/actions/delete-activity.ts`
- Create: `src/features/activities/columns.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/activities/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

export type Activity = Database['public']['Tables']['activities']['Row'];

export type ActivityWithRelations = Activity & {
  account: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  owner: { id: string; full_name: string | null } | null;
};

export const activityFormSchema = z.object({
  type: z.enum(['Meeting', 'Demo', 'Call', 'E-mail', 'Lunch', 'Event']),
  subject: z.string().min(1, 'Onderwerp is verplicht'),
  date: z.string().min(1, 'Datum is verplicht'),
  duration_minutes: z.coerce.number().optional().nullable(),
  account_id: z.string().uuid('Account is verplicht'),
  deal_id: z.string().uuid().optional().nullable(),
  notes: z.any().optional().nullable(), // Plate JSON
  is_done: z.boolean().optional(),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export type ActivityFilters = {
  search?: string;
  type?: string;
  account_id?: string;
  is_done?: boolean;
};
```

- [ ] **Step 2: Create `src/features/activities/queries/get-activities.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ActivityWithRelations, ActivityFilters } from '../types';

type GetActivitiesParams = {
  filters?: ActivityFilters;
  page?: number;
  pageSize?: number;
};

export const getActivities = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetActivitiesParams = {}): Promise<{ data: ActivityWithRelations[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('activities')
      .select(`
        *,
        account:accounts!account_id(id, name),
        deal:deals!deal_id(id, title),
        owner:user_profiles!owner_id(id, full_name)
      `, { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to);

    if (filters?.search) {
      query = query.ilike('subject', `%${filters.search}%`);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.account_id) {
      query = query.eq('account_id', filters.account_id);
    }
    if (filters?.is_done !== undefined) {
      query = query.eq('is_done', filters.is_done);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch activities:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as ActivityWithRelations[]) ?? [], count: count ?? 0 };
  },
);
```

- [ ] **Step 3: Create `src/features/activities/actions/create-activity.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { activityFormSchema, type ActivityFormValues } from '../types';

export async function createActivity(values: ActivityFormValues) {
  const { userId } = await requirePermission('activities.write');

  const parsed = activityFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('activities')
    .insert({ ...parsed.data, owner_id: userId })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'activity.created',
    entityType: 'activity',
    entityId: data.id,
    metadata: { subject: parsed.data.subject, type: parsed.data.type },
  });

  revalidatePath('/admin/activities');
  return { data };
}
```

- [ ] **Step 4: Create `src/features/activities/actions/update-activity.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { activityFormSchema, type ActivityFormValues } from '../types';

export async function updateActivity(id: string, values: ActivityFormValues) {
  await requirePermission('activities.write');

  const parsed = activityFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('activities')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'activity.updated',
    entityType: 'activity',
    entityId: id,
  });

  revalidatePath('/admin/activities');
  return { success: true };
}
```

- [ ] **Step 5: Create `src/features/activities/actions/delete-activity.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function deleteActivity(id: string) {
  await requirePermission('activities.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'activity.deleted',
    entityType: 'activity',
    entityId: id,
  });

  revalidatePath('/admin/activities');
  return { success: true };
}
```

- [ ] **Step 6: Create `src/features/activities/columns.ts`**

```ts
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ActivityWithRelations } from './types';

export const activityColumns: ColumnDef<ActivityWithRelations>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'subject',
    header: 'Onderwerp',
  },
  {
    accessorKey: 'date',
    header: 'Datum',
    cell: ({ getValue }) => {
      const d = getValue<string>();
      return d ? new Date(d).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    },
  },
  {
    accessorKey: 'duration_minutes',
    header: 'Duur',
    cell: ({ getValue }) => {
      const m = getValue<number | null>();
      return m ? `${m} min` : '';
    },
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    header: 'Account',
  },
  {
    accessorFn: (row) => row.deal?.title ?? '',
    id: 'deal',
    header: 'Deal',
  },
  {
    accessorKey: 'is_done',
    header: 'Status',
    cell: ({ getValue }) => getValue<boolean>() ? 'Afgerond' : 'Gepland',
  },
];
```

---

## Task 7: Tasks Feature — Types, Queries, Actions

**Files:**
- Create: `src/features/tasks/types.ts`
- Create: `src/features/tasks/queries/get-tasks.ts`
- Create: `src/features/tasks/actions/create-task.ts`
- Create: `src/features/tasks/actions/update-task.ts`
- Create: `src/features/tasks/actions/delete-task.ts`
- Create: `src/features/tasks/columns.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/tasks/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

export type Task = Database['public']['Tables']['tasks']['Row'];

export type TaskWithRelations = Task & {
  account: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  assignee: { id: string; full_name: string | null } | null;
};

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['High', 'Medium', 'Low']),
  status: z.enum(['Open', 'In Progress', 'Done']),
  account_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export type TaskFilters = {
  status?: string;
  priority?: string;
  assigned_to?: string;
};
```

- [ ] **Step 2: Create `src/features/tasks/queries/get-tasks.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { TaskWithRelations, TaskFilters } from '../types';

type GetTasksParams = {
  filters?: TaskFilters;
  page?: number;
  pageSize?: number;
};

export const getTasks = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetTasksParams = {}): Promise<{ data: TaskWithRelations[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        account:accounts!account_id(id, name),
        deal:deals!deal_id(id, title),
        assignee:user_profiles!assigned_to(id, full_name)
      `, { count: 'exact' })
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(from, to);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch tasks:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as TaskWithRelations[]) ?? [], count: count ?? 0 };
  },
);
```

- [ ] **Step 3: Create `src/features/tasks/actions/create-task.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { taskFormSchema, type TaskFormValues } from '../types';

export async function createTask(values: TaskFormValues) {
  const { userId } = await requirePermission('tasks.write');

  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...parsed.data, assigned_to: parsed.data.assigned_to ?? userId })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'task.created',
    entityType: 'task',
    entityId: data.id,
    metadata: { title: parsed.data.title },
  });

  revalidatePath('/admin/tasks');
  return { data };
}
```

- [ ] **Step 4: Create `src/features/tasks/actions/update-task.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { taskFormSchema, type TaskFormValues } from '../types';

export async function updateTask(id: string, values: TaskFormValues) {
  await requirePermission('tasks.write');

  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('tasks')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'task.updated',
    entityType: 'task',
    entityId: id,
  });

  revalidatePath('/admin/tasks');
  return { success: true };
}
```

- [ ] **Step 5: Create `src/features/tasks/actions/delete-task.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function deleteTask(id: string) {
  await requirePermission('tasks.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'task.deleted',
    entityType: 'task',
    entityId: id,
  });

  revalidatePath('/admin/tasks');
  return { success: true };
}
```

- [ ] **Step 6: Create `src/features/tasks/columns.ts`**

```ts
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { TaskWithRelations } from './types';

export const taskColumns: ColumnDef<TaskWithRelations>[] = [
  {
    accessorKey: 'title',
    header: 'Titel',
  },
  {
    accessorKey: 'due_date',
    header: 'Deadline',
    cell: ({ getValue }) => {
      const d = getValue<string | null>();
      return d ? new Date(d).toLocaleDateString('nl-BE') : '';
    },
  },
  {
    accessorKey: 'priority',
    header: 'Prioriteit',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    header: 'Account',
  },
  {
    accessorFn: (row) => row.assignee?.full_name ?? '',
    id: 'assignee',
    header: 'Toegewezen',
  },
];
```

---

## Task 8: Deals Page — Kanban + List Toggle

**Files:**
- Create: `src/app/admin/deals/page.tsx`
- Create: `src/app/admin/deals/loading.tsx`
- Create: `src/features/deals/components/deals-page-client.tsx`
- Create: `src/features/deals/components/deal-kanban.tsx`
- Create: `src/features/deals/components/deal-list.tsx`
- Create: `src/features/deals/columns.ts`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/deals/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function DealsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-72 shrink-0" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/deals/columns.ts`**

```ts
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { DealWithRelations } from './types';

export const dealColumns: ColumnDef<DealWithRelations>[] = [
  {
    accessorKey: 'title',
    header: 'Titel',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    header: 'Account',
  },
  {
    accessorKey: 'amount',
    header: 'Bedrag',
    cell: ({ getValue }) => {
      const n = Number(getValue<number>() ?? 0);
      return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
    },
  },
  {
    accessorFn: (row) => row.stage?.name ?? '',
    id: 'stage',
    header: 'Stage',
  },
  {
    accessorKey: 'probability',
    header: 'Kans',
    cell: ({ getValue }) => `${getValue<number>()}%`,
  },
  {
    accessorKey: 'close_date',
    header: 'Close Date',
    cell: ({ getValue }) => {
      const d = getValue<string | null>();
      return d ? new Date(d).toLocaleDateString('nl-BE') : '';
    },
  },
  {
    accessorFn: (row) => row.owner?.full_name ?? '',
    id: 'owner',
    header: 'Owner',
  },
  {
    accessorKey: 'forecast_category',
    header: 'Forecast',
  },
];
```

- [ ] **Step 3: Create `src/features/deals/components/deal-kanban.tsx`**

The kanban board uses `@dnd-kit`. Each column is a pipeline stage (excluding closed stages). Cards are draggable deal summaries.

```tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { moveDealStage } from '../actions/move-deal-stage';
import type { DealCard } from '../types';

type Stage = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_closed: boolean;
};

type Props = {
  stages: Stage[];
  deals: DealCard[];
  onRefresh: () => void;
};

function DroppableColumn({ stage, children }: { stage: Stage; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className="w-72 shrink-0 rounded-lg p-3"
      style={{
        backgroundColor: isOver ? `${stage.color}15` : '#f9fafb',
        borderTop: `3px solid ${stage.color}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{stage.name}</h3>
      </div>
      <div className="space-y-2 min-h-[100px]">{children}</div>
    </div>
  );
}

function DraggableDealCard({ deal }: { deal: DealCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: deal,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return (
    <Card ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <CardContent className="p-3">
        <div className="text-sm font-medium mb-1">{deal.title}</div>
        <div className="text-xs text-muted-foreground mb-1">{deal.account_name}</div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">{fmt(deal.amount)}</span>
          <span>{deal.probability}%</span>
        </div>
        {deal.forecast_category && (
          <Badge variant="outline" className="mt-1 text-[10px]">{deal.forecast_category}</Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function DealKanban({ stages, deals, onRefresh }: Props) {
  const openStages = stages
    .filter((s) => !s.is_closed)
    .sort((a, b) => a.sort_order - b.sort_order);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;

    // Optimistic — refresh after server confirms
    await moveDealStage(dealId, newStageId);
    onRefresh();
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {openStages.map((stage) => (
          <DroppableColumn key={stage.id} stage={stage}>
            {deals
              .filter((d) => d.stage_id === stage.id)
              .map((deal) => (
                <DraggableDealCard key={deal.id} deal={deal} />
              ))}
          </DroppableColumn>
        ))}
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 4: Create `src/features/deals/components/deal-list.tsx`**

```tsx
'use client';

import { DataTable } from '@/components/admin/data-table';
import { dealColumns } from '../columns';
import type { DealWithRelations } from '../types';

type Props = {
  deals: DealWithRelations[];
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  loading: boolean;
};

export function DealList({ deals, page, total, onPageChange, loading }: Props) {
  return (
    <DataTable
      columns={dealColumns}
      data={deals}
      pagination={{ page, pageSize: 25, total }}
      onPageChange={onPageChange}
      loading={loading}
    />
  );
}
```

- [ ] **Step 5: Create `src/features/deals/components/deals-page-client.tsx`**

This is the main client component: 3 pipeline tabs, kanban/list toggle.

```tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { useEntity } from '@/lib/hooks/use-entity';
import { DealKanban } from './deal-kanban';
import { DealList } from './deal-list';
import type { Deal } from '../types';

type Pipeline = {
  id: string;
  name: string;
  type: string;
  stages: {
    id: string;
    name: string;
    color: string;
    sort_order: number;
    is_closed: boolean;
    is_won: boolean;
    is_longterm: boolean;
    probability: number;
  }[];
};

type Props = {
  pipelines: Pipeline[];
};

export function DealsPageClient({ pipelines }: Props) {
  const [activePipeline, setActivePipeline] = useState(pipelines[0]?.id ?? '');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [page, setPage] = useState(1);

  const { data, total, loading, fetchList } = useEntity<Deal>({
    table: 'deals',
    pageSize: 50,
  });

  const load = useCallback(() => {
    fetchList({ page });
  }, [fetchList, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pipeline = pipelines.find((p) => p.id === activePipeline);
  const pipelineDeals = data.filter((d) => d.pipeline_id === activePipeline);

  const dealCards = pipelineDeals.map((d) => ({
    id: d.id,
    title: d.title,
    amount: Number(d.amount ?? 0),
    probability: d.probability ?? 0,
    close_date: d.close_date,
    account_name: '', // Would need join — simplified for list
    owner_name: null,
    stage_id: d.stage_id,
    forecast_category: d.forecast_category,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activePipeline} onValueChange={setActivePipeline}>
          <TabsList>
            {pipelines.map((p) => (
              <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' && pipeline ? (
        <DealKanban
          stages={pipeline.stages}
          deals={dealCards}
          onRefresh={load}
        />
      ) : (
        <DealList
          deals={pipelineDeals as any}
          page={page}
          total={total}
          onPageChange={setPage}
          loading={loading}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create `src/app/admin/deals/page.tsx`**

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { createServerClient } from '@/lib/supabase/server';
import { DealsPageClient } from '@/features/deals/components/deals-page-client';

export default async function DealsPage() {
  const supabase = await createServerClient();

  const { data: pipelines } = await supabase
    .from('pipelines')
    .select(`
      id, name, type,
      stages:pipeline_stages(id, name, color, sort_order, is_closed, is_won, is_longterm, probability)
    `)
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Deals' },
        ]}
      />
      <DealsPageClient pipelines={(pipelines as any) ?? []} />
    </div>
  );
}
```

---

## Task 9: Deal Detail Page

**Files:**
- Create: `src/app/admin/deals/[id]/page.tsx`
- Create: `src/app/admin/deals/[id]/loading.tsx`
- Create: `src/features/deals/components/deal-detail.tsx`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/deals/[id]/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function DealDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/deals/components/deal-detail.tsx`**

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DealWithRelations } from '../types';

type Props = {
  deal: DealWithRelations;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const FC_COLORS: Record<string, string> = {
  Commit: 'bg-green-100 text-green-800',
  'Best Case': 'bg-blue-100 text-blue-800',
  Pipeline: 'bg-purple-100 text-purple-800',
  Omit: 'bg-gray-100 text-gray-800',
};

export function DealDetail({ deal }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Deal Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Account" value={deal.account?.name} />
          <InfoRow label="Pipeline" value={deal.pipeline?.name} />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-32">Stage</span>
            {deal.stage && (
              <Badge style={{ backgroundColor: deal.stage.color, color: 'white' }}>
                {deal.stage.name}
              </Badge>
            )}
          </div>
          <InfoRow label="Bedrag" value={fmt(Number(deal.amount ?? 0))} />
          <InfoRow label="Kans" value={`${deal.probability ?? 0}%`} />
          <InfoRow label="Close Date" value={deal.close_date ? new Date(deal.close_date).toLocaleDateString('nl-BE') : undefined} />
          <InfoRow label="Lead Source" value={deal.lead_source} />
          <InfoRow label="Herkomst" value={deal.origin} />
          {deal.forecast_category && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-32">Forecast</span>
              <Badge className={FC_COLORS[deal.forecast_category] ?? ''}>
                {deal.forecast_category}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Contact & Eigenaar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Contact" value={deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : undefined} />
          <InfoRow label="Owner" value={deal.owner?.full_name} />
          {deal.origin === 'cronos' && (
            <>
              <InfoRow label="Cronos CC" value={deal.cronos_cc} />
              <InfoRow label="Cronos Contact" value={deal.cronos_contact} />
              <InfoRow label="Cronos E-mail" value={deal.cronos_email} />
            </>
          )}
          <InfoRow label="Consultant Rol" value={deal.consultant_role} />
        </CardContent>
      </Card>

      {deal.description && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Beschrijving</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p>
          </CardContent>
        </Card>
      )}

      {deal.closed_type && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Afsluiting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Type" value={deal.closed_type} />
            <InfoRow label="Reden" value={deal.closed_reason} />
            <InfoRow label="Notities" value={deal.closed_notes} />
            <InfoRow label="Datum" value={deal.closed_at ? new Date(deal.closed_at).toLocaleDateString('nl-BE') : undefined} />
            {deal.longterm_date && (
              <InfoRow label="Follow-up" value={new Date(deal.longterm_date).toLocaleDateString('nl-BE')} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/deals/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { getDeal } from '@/features/deals/queries/get-deal';
import { DealDetail } from '@/features/deals/components/deal-detail';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params;
  const deal = await getDeal(id);

  if (!deal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.title}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Deals', href: '/admin/deals' },
          { label: deal.title },
        ]}
      />
      <DealDetail deal={deal} />
    </div>
  );
}
```

---

## Task 10: Activities Page

**Files:**
- Create: `src/app/admin/activities/page.tsx`
- Create: `src/app/admin/activities/loading.tsx`
- Create: `src/features/activities/components/activity-list.tsx`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/activities/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function ActivitiesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/activities/components/activity-list.tsx`**

```tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { DataTable } from '@/components/admin/data-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { activityColumns } from '../columns';
import type { Activity, ActivityFilters } from '../types';

const PAGE_SIZE = 25;

export function ActivityList() {
  const { data, total, loading, fetchList } = useEntity<Activity>({
    table: 'activities',
    pageSize: PAGE_SIZE,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ActivityFilters>({});

  const load = useCallback(() => {
    fetchList({ page });
  }, [fetchList, page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = data.filter((a) => {
    if (filters.search && !a.subject.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.type && a.type !== filters.type) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Zoeken..."
          value={filters.search ?? ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-64"
        />
        <Select
          value={filters.type ?? 'all'}
          onValueChange={(v) => setFilters({ ...filters, type: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="Meeting">Meeting</SelectItem>
            <SelectItem value="Demo">Demo</SelectItem>
            <SelectItem value="Call">Call</SelectItem>
            <SelectItem value="E-mail">E-mail</SelectItem>
            <SelectItem value="Lunch">Lunch</SelectItem>
            <SelectItem value="Event">Event</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={activityColumns as any}
        data={filtered}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/activities/page.tsx`**

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { ActivityList } from '@/features/activities/components/activity-list';

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activiteiten"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Activiteiten' },
        ]}
      />
      <ActivityList />
    </div>
  );
}
```

---

## Task 11: Tasks Page

**Files:**
- Create: `src/app/admin/tasks/page.tsx`
- Create: `src/app/admin/tasks/loading.tsx`
- Create: `src/features/tasks/components/task-list.tsx`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/tasks/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/tasks/components/task-list.tsx`**

```tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { DataTable } from '@/components/admin/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { taskColumns } from '../columns';
import type { Task, TaskFilters } from '../types';

const PAGE_SIZE = 25;

export function TaskList() {
  const { data, total, loading, fetchList } = useEntity<Task>({
    table: 'tasks',
    pageSize: PAGE_SIZE,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TaskFilters>({});

  const load = useCallback(() => {
    fetchList({ page });
  }, [fetchList, page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = data.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.priority ?? 'all'}
          onValueChange={(v) => setFilters({ ...filters, priority: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Prioriteit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={taskColumns as any}
        data={filtered}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/tasks/page.tsx`**

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { TaskList } from '@/features/tasks/components/task-list';

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Taken"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Taken' },
        ]}
      />
      <TaskList />
    </div>
  );
}
```

---

## Task 12: Dashboard Page

**Files:**
- Create: `src/app/admin/dashboard/page.tsx`
- Create: `src/app/admin/dashboard/loading.tsx`
- Create: `src/features/dashboard/queries/get-dashboard-stats.ts`
- Create: `src/features/dashboard/components/dashboard-client.tsx`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/dashboard/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/dashboard/queries/get-dashboard-stats.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export type DashboardStats = {
  openDealValue: number;
  activeConsultants: number;
  highPriorityBench: number;
  upcomingActivities: number;
  overdueTasks: number;
  totalAccounts: number;
};

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const supabase = await createServerClient();

  // Open deals: weighted by probability (sum of amount * probability / 100)
  const { data: deals } = await supabase
    .from('deals')
    .select('amount, probability')
    .is('closed_at', null);

  const openDealValue = (deals ?? []).reduce(
    (sum, d) => sum + (Number(d.amount ?? 0) * (d.probability ?? 0)) / 100,
    0,
  );

  // Total accounts
  const { count: totalAccounts } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true });

  // Upcoming activities (next 7 days)
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { count: upcomingActivities } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('is_done', false)
    .gte('date', now.toISOString())
    .lte('date', weekFromNow.toISOString());

  // Overdue tasks
  const { count: overdueTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'Done')
    .lt('due_date', now.toISOString().split('T')[0]);

  // Active consultants and high-priority bench — these tables don't exist yet (Layer 4)
  // Return 0 for now; will be updated when Layer 4 is implemented
  const activeConsultants = 0;
  const highPriorityBench = 0;

  return {
    openDealValue,
    activeConsultants,
    highPriorityBench,
    upcomingActivities: upcomingActivities ?? 0,
    overdueTasks: overdueTasks ?? 0,
    totalAccounts: totalAccounts ?? 0,
  };
});
```

- [ ] **Step 3: Create `src/features/dashboard/components/dashboard-client.tsx`**

```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/admin/stat-card';
import { DollarSign, Users, AlertCircle, Calendar, CheckSquare, Building2 } from 'lucide-react';
import type { DashboardStats } from '../queries/get-dashboard-stats';
import type { Activity } from '@/features/activities/types';
import type { Task } from '@/features/tasks/types';

type Props = {
  stats: DashboardStats;
  recentActivities: Activity[];
  upcomingTasks: Task[];
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function DashboardClient({ stats, recentActivities, upcomingTasks }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Open Deal Waarde"
          value={fmt(stats.openDealValue)}
          icon={DollarSign}
        />
        <StatCard
          title="Accounts"
          value={String(stats.totalAccounts)}
          icon={Building2}
        />
        <StatCard
          title="Activiteiten (7d)"
          value={String(stats.upcomingActivities)}
          icon={Calendar}
        />
        <StatCard
          title="Achterstallige Taken"
          value={String(stats.overdueTasks)}
          icon={AlertCircle}
        />
        <StatCard
          title="Actieve Consultants"
          value={String(stats.activeConsultants)}
          icon={Users}
        />
        <StatCard
          title="Bench (High Priority)"
          value={String(stats.highPriorityBench)}
          icon={CheckSquare}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recente Activiteiten</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen recente activiteiten.</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium w-16">{a.type}</span>
                    <span className="flex-1">{a.subject}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.date).toLocaleDateString('nl-BE')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Aankomende Taken</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen openstaande taken.</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full ${t.priority === 'High' ? 'bg-red-500' : t.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <span className="flex-1">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('nl-BE') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/admin/dashboard/page.tsx`**

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { getDashboardStats } from '@/features/dashboard/queries/get-dashboard-stats';
import { DashboardClient } from '@/features/dashboard/components/dashboard-client';
import { createServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const supabase = await createServerClient();

  // Recent activities (last 10)
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('*')
    .order('date', { ascending: false })
    .limit(10);

  // Upcoming tasks (next 10 not done)
  const { data: upcomingTasks } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'Done')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Dashboard' },
        ]}
      />
      <DashboardClient
        stats={stats}
        recentActivities={recentActivities ?? []}
        upcomingTasks={upcomingTasks ?? []}
      />
    </div>
  );
}
```

---

## Task 13: Seed Data — Deals, Activities, Tasks

**Files:**
- Create: `supabase/migrations/00022_seed_sales.sql`

**Steps:**

- [ ] **Step 1: Create seed migration**

```sql
-- ============================================================================
-- Seed: Sales data (deals, activities, tasks)
-- References account/contact UUIDs from Layer 2 seed and pipeline UUIDs from Layer 1 seed.
-- Pipeline stage IDs come from Layer 1 seed: pl1 stages = p1..p8, pl3 stages = cs1..cs6.
-- User IDs referenced via user_profiles.full_name lookups.
-- ============================================================================

-- ── Deals ───────────────────────────────────────────────────────────────────
-- Assumes pipeline stage UUIDs are known from Layer 1 seed.
-- We use subqueries to resolve pipeline and stage IDs by name.

INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, contact_id, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000001'::uuid,
  'TechVision Platform Upgrade',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  ps.id,
  125000, '2026-03-31', 60,
  (SELECT id FROM user_profiles WHERE full_name = 'Sophie Willems'),
  'Upgrade van het bestaande e-commerce platform naar Magento 2.4.',
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'Referral', 'rechtstreeks', '', '', ''
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'Voorstel'
WHERE p.name = 'Projecten'
ON CONFLICT DO NOTHING;

INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, contact_id, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000002'::uuid,
  'GreenLogistics TMS Implementatie',
  'a0000000-0000-0000-0000-000000000002'::uuid,
  p.id,
  ps.id,
  85000, '2026-06-30', 25,
  (SELECT id FROM user_profiles WHERE full_name = 'Pieter Claes'),
  'Transport Management System implementatie.',
  'c0000000-0000-0000-0000-000000000003'::uuid,
  'Partner', 'rechtstreeks', '', '', ''
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'Meeting'
WHERE p.name = 'Projecten'
ON CONFLICT DO NOTHING;

INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, contact_id, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000005'::uuid,
  'TechVision Security Module',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  ps.id,
  55000, '2026-02-28', 80,
  (SELECT id FROM user_profiles WHERE full_name = 'Sophie Willems'),
  'Implementatie security module.',
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'E-mail', 'rechtstreeks', '', '', ''
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'Onderhandeling'
WHERE p.name = 'Projecten'
ON CONFLICT DO NOTHING;

INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, contact_id, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000003'::uuid,
  'Dev Senior plaatsing bij MediCare Plus',
  'a0000000-0000-0000-0000-000000000003'::uuid,
  p.id,
  ps.id,
  9800, '2026-04-15', 25,
  (SELECT id FROM user_profiles WHERE full_name = 'Pieter Claes'),
  '',
  'c0000000-0000-0000-0000-000000000004'::uuid,
  '', 'cronos', 'Induxx', 'Peter Maes', 'peter@induxx.be'
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'CV/Info'
WHERE p.name = 'Consultancy Profielen'
ON CONFLICT DO NOTHING;

INSERT INTO deals (id, title, account_id, pipeline_id, stage_id, amount, close_date, probability, owner_id, description, contact_id, lead_source, origin, cronos_cc, cronos_contact, cronos_email)
SELECT
  'd0000000-0000-0000-0000-000000000006'::uuid,
  'Analist plaatsing bij TechVision',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  p.id,
  ps.id,
  8640, '2026-03-01', 50,
  (SELECT id FROM user_profiles WHERE full_name = 'Sophie Willems'),
  '',
  'c0000000-0000-0000-0000-000000000001'::uuid,
  '', 'rechtstreeks', '', '', ''
FROM pipelines p
JOIN pipeline_stages ps ON ps.pipeline_id = p.id AND ps.name = 'Intake'
WHERE p.name = 'Consultancy Profielen'
ON CONFLICT DO NOTHING;

-- ── Activities ──────────────────────────────────────────────────────────────
INSERT INTO activities (id, type, subject, date, duration_minutes, account_id, deal_id, owner_id, notes, is_done)
SELECT
  'ac000000-0000-0000-0000-000000000001'::uuid,
  'Meeting', 'Discovery call TechVision', '2025-10-15T10:00:00Z', 45,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  up.id,
  '[{"type":"paragraph","children":[{"text":"Eerste kennismaking. "},{"text":"Beslissing verwacht","bold":true},{"text":" eind oktober."}]},{"type":"bulleted-list","children":[{"type":"list-item","children":[{"text":"Budget bevestigd"}]},{"type":"list-item","children":[{"text":"Technisch team aanwezig"}]}]}]'::jsonb,
  true
FROM user_profiles up WHERE up.full_name = 'Sophie Willems'
ON CONFLICT DO NOTHING;

INSERT INTO activities (id, type, subject, date, duration_minutes, account_id, deal_id, owner_id, notes, is_done)
SELECT
  'ac000000-0000-0000-0000-000000000002'::uuid,
  'Demo', 'Platform demo voor TechVision', '2025-11-20T14:00:00Z', 90,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  up.id,
  '[{"type":"paragraph","children":[{"text":"Demo van het nieuwe platform gegeven. "},{"text":"Positieve reactie","italic":true},{"text":" van het team."}]}]'::jsonb,
  true
FROM user_profiles up WHERE up.full_name = 'Sophie Willems'
ON CONFLICT DO NOTHING;

INSERT INTO activities (id, type, subject, date, duration_minutes, account_id, deal_id, owner_id, notes, is_done)
SELECT
  'ac000000-0000-0000-0000-000000000003'::uuid,
  'Call', 'Follow-up GreenLogistics', '2026-01-15T11:00:00Z', 20,
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'd0000000-0000-0000-0000-000000000002'::uuid,
  up.id,
  null,
  true
FROM user_profiles up WHERE up.full_name = 'Pieter Claes'
ON CONFLICT DO NOTHING;

INSERT INTO activities (id, type, subject, date, duration_minutes, account_id, deal_id, owner_id, notes, is_done)
SELECT
  'ac000000-0000-0000-0000-000000000004'::uuid,
  'Meeting', 'Voorstel bespreken TechVision', '2026-04-10T10:00:00Z', 60,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  up.id,
  null,
  false
FROM user_profiles up WHERE up.full_name = 'Sophie Willems'
ON CONFLICT DO NOTHING;

-- ── Tasks ───────────────────────────────────────────────────────────────────
INSERT INTO tasks (id, title, due_date, priority, status, account_id, deal_id, assigned_to)
SELECT
  't0000000-0000-0000-0000-000000000001'::uuid,
  'Stuur aangepaste offerte TechVision', '2026-02-18', 'High', 'Open',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  up.id
FROM user_profiles up WHERE up.full_name = 'Sophie Willems'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, title, due_date, priority, status, account_id, deal_id, assigned_to)
SELECT
  't0000000-0000-0000-0000-000000000002'::uuid,
  'Follow-up call Dirk Van Damme', '2026-02-20', 'Medium', 'Open',
  'a0000000-0000-0000-0000-000000000002'::uuid,
  null,
  up.id
FROM user_profiles up WHERE up.full_name = 'Pieter Claes'
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Run the seed migration**

```bash
task db:migrate
```

---

## Task 13b: Deal, Activity, and Task form components

**Files:**
- Create: `src/features/deals/components/deal-form.tsx`
- Create: `src/features/deals/components/close-deal-modal.tsx`
- Create: `src/features/activities/components/activity-form.tsx`
- Create: `src/features/tasks/components/task-form.tsx`

Each form component should use the existing Zod schemas and server actions from the feature's `types.ts` and `actions/`. Each form accepts an optional `defaultValues` prop for edit mode.

- [ ] **Step 1: Create `deal-form.tsx`**

Create/edit deal modal using `dealFormSchema`. Fields: `title`, `account_id`, `contact_id`, `pipeline_id`, `stage_id`, `value`, `probability`, `expected_close_date`, `forecast_category`, `bench_consultant_id`, `notes`. Use `createDeal` / `updateDeal` server actions.

- [ ] **Step 2: Create `close-deal-modal.tsx`**

Won/lost/longterm close flow. Accept `dealId` and `closeType` ('won'|'lost'|'longterm'). Fields vary by type:
- won: `close_date`, `final_value`
- lost: `close_date`, `lost_reason`
- longterm: `follow_up_date`, `notes`

Call `closeDeal` server action on submit.

- [ ] **Step 3: Create `activity-form.tsx`**

Create/edit activity modal using `activityFormSchema`. Fields: `type`, `subject`, `body` (textarea), `activity_date`, `account_id`, `deal_id` (optional), `contact_id` (optional). Use `createActivity` / `updateActivity` server actions.

- [ ] **Step 4: Create `task-form.tsx`**

Create/edit task modal using `taskFormSchema`. Fields: `title`, `description`, `due_date`, `priority`, `account_id` (optional), `deal_id` (optional), `assigned_to` (user select). Use `createTask` / `updateTask` server actions.

- [ ] **Step 5: Wire forms into list/detail pages**

- Add "Nieuwe Deal" button to deals page header (opens DealForm modal)
- Add "Sluiten" button to deal detail page (opens CloseDealModal)
- Add "Nieuwe Activiteit" button to activities page header (opens ActivityForm modal)
- Add "Nieuwe Taak" button to tasks page header (opens TaskForm modal)
- Add edit/delete row actions to all list pages

- [ ] **Step 6: Commit**

```bash
git add src/features/deals/components/ src/features/activities/components/ src/features/tasks/components/
git commit -m "feat: add deal, activity, and task form components"
```

---

## Task 13c: Replace account detail Deals tab stub with AccountDealsTab

**Files:**
- Create: `src/features/deals/components/account-deals-tab.tsx`
- Modify: `src/features/accounts/components/account-detail.tsx`

- [ ] **Step 1: Create `account-deals-tab.tsx`**

Create `src/features/deals/components/account-deals-tab.tsx`. This component:
- Accepts `accountId: string` prop
- Calls `getDealsByAccount(accountId)` query (add this query to `src/features/deals/queries/get-deals-by-account.ts` if not present)
- Renders a table of deals with columns: title, stage, value, probability, expected close date, status
- Shows a "Nieuwe Deal" button that opens DealForm pre-filled with the account_id

`getDealsByAccount` query pattern:
```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getDealsByAccount = cache(async (accountId: string) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('deals')
    .select('*, stage:pipeline_stages(name, pipeline:pipelines(name))')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
});
```

- [ ] **Step 2: Wire into account detail**

In `src/features/accounts/components/account-detail.tsx`, replace the Deals tab stub with `<AccountDealsTab accountId={account.id} />`.

- [ ] **Step 3: Commit**

```bash
git add src/features/deals/
git commit -m "feat(accounts): replace deals tab stub with AccountDealsTab"
```

---

## Task 14: Verify and Commit

**Steps:**

- [ ] **Step 1: Regenerate TypeScript types**

```bash
task types:generate
```

- [ ] **Step 2: Verify the app compiles**

```bash
task build
```

- [ ] **Step 3: Verify all pages load in dev**

Visit:
- `/admin/dashboard` — stat cards + recent activity
- `/admin/deals` — pipeline tabs with kanban view
- `/admin/deals/d0000000-0000-0000-0000-000000000001` — TechVision Platform Upgrade detail
- `/admin/activities` — activity list
- `/admin/tasks` — task list

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement Layer 3 — Sales (deals, activities, tasks, dashboard)"
```
