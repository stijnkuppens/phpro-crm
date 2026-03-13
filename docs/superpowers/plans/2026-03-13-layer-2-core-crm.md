# Layer 2: Core CRM — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement accounts, contacts, communications, and all their sub-tables — the core CRM data model that all subsequent layers depend on.

**Architecture:** Accounts are the central entity. Contacts belong to accounts. Communications link to accounts and optionally to contacts and deals. Several junction/detail tables hang off accounts (tech stacks, hosting, competence centers, samenwerkingsvormen, manual services). Contact personal info is a 1:1 extension table. All queries use `cache()` + `createServerClient()`. All write actions use `requirePermission()` + `logAction()`.

**Tech Stack:** Supabase (PostgreSQL, RLS), React 19 server components, Zod validation, shadcn/ui, Plate rich text editor

**Spec:** `docs/superpowers/specs/2026-03-13-crm-port-design.md`

**IMPORTANT — Cross-cutting pattern:** Every server action that performs a write (create/update/delete) MUST call `revalidatePath('/admin/<entity>')` before returning. Import: `import { revalidatePath } from 'next/cache';`

**Depends on:** Layer 1 (Foundation)

---

## Task 1: Database Migration — Accounts and Sub-Tables

**Files:**
- Create: `supabase/migrations/00011_accounts.sql`

**Steps:**

- [ ] **Step 1: Create the migration file with the following SQL:**

```sql
-- ============================================================================
-- Migration: Accounts and all sub-tables
-- ============================================================================

-- ── accounts ────────────────────────────────────────────────────────────────
CREATE TABLE accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  domain          text,
  type            text NOT NULL DEFAULT 'Prospect' CHECK (type IN ('Klant', 'Prospect', 'Partner')),
  status          text NOT NULL DEFAULT 'Actief' CHECK (status IN ('Actief', 'Inactief')),
  industry        text,
  size            text,
  revenue         numeric,
  phone           text,
  website         text,
  address         text,
  country         text,
  vat_number      text,
  owner_id        uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  health          int DEFAULT 50 CHECK (health >= 0 AND health <= 100),
  managing_partner text,
  account_director text,
  team            text,
  about           text,
  phpro_contract  text DEFAULT 'Geen' CHECK (phpro_contract IN ('Geen', 'Actief', 'Inactief', 'In onderhandeling')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_accounts_owner ON accounts(owner_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_status ON accounts(status);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read accounts
CREATE POLICY "accounts_select" ON accounts FOR SELECT TO authenticated
  USING (true);

-- Admin and sales roles can insert
CREATE POLICY "accounts_insert" ON accounts FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));

-- Admin and sales roles can update
CREATE POLICY "accounts_update" ON accounts FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));

-- Only admin can delete
CREATE POLICY "accounts_delete" ON accounts FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;

-- ── account_manual_services ─────────────────────────────────────────────────
CREATE TABLE account_manual_services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  service_name    text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_manual_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_account_manual_services_account ON account_manual_services(account_id);

ALTER TABLE account_manual_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_manual_services_select" ON account_manual_services FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "account_manual_services_insert" ON account_manual_services FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_manual_services_update" ON account_manual_services FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_manual_services_delete" ON account_manual_services FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));

-- ── account_tech_stacks ─────────────────────────────────────────────────────
CREATE TABLE account_tech_stacks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  technology      text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_tech_stacks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_account_tech_stacks_account ON account_tech_stacks(account_id);

ALTER TABLE account_tech_stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_tech_stacks_select" ON account_tech_stacks FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "account_tech_stacks_insert" ON account_tech_stacks FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_tech_stacks_update" ON account_tech_stacks FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_tech_stacks_delete" ON account_tech_stacks FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));

-- ── account_samenwerkingsvormen ─────────────────────────────────────────────
CREATE TABLE account_samenwerkingsvormen (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('Project', 'Continuous Dev.', 'Ad Hoc', 'Support', 'Consultancy')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_samenwerkingsvormen
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_account_samenwerkingsvormen_account ON account_samenwerkingsvormen(account_id);

ALTER TABLE account_samenwerkingsvormen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_samenwerkingsvormen_select" ON account_samenwerkingsvormen FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "account_samenwerkingsvormen_insert" ON account_samenwerkingsvormen FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_samenwerkingsvormen_update" ON account_samenwerkingsvormen FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_samenwerkingsvormen_delete" ON account_samenwerkingsvormen FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));

-- ── account_hosting ─────────────────────────────────────────────────────────
CREATE TABLE account_hosting (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  environment     text,
  url             text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_hosting
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_account_hosting_account ON account_hosting(account_id);

ALTER TABLE account_hosting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_hosting_select" ON account_hosting FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "account_hosting_insert" ON account_hosting FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_hosting_update" ON account_hosting FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_hosting_delete" ON account_hosting FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));

-- ── account_competence_centers ──────────────────────────────────────────────
CREATE TABLE account_competence_centers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  cc_name         text NOT NULL,
  contact_person  text,
  email           text,
  phone           text,
  distribution    text CHECK (distribution IN ('4%', '50/50')),
  services        text[] DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_competence_centers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_account_competence_centers_account ON account_competence_centers(account_id);

ALTER TABLE account_competence_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_competence_centers_select" ON account_competence_centers FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "account_competence_centers_insert" ON account_competence_centers FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_competence_centers_update" ON account_competence_centers FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_competence_centers_delete" ON account_competence_centers FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));

-- ── account_services ────────────────────────────────────────────────────────
CREATE TABLE account_services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  service_name    text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_account_services_account ON account_services(account_id);

ALTER TABLE account_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_services_select" ON account_services FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "account_services_insert" ON account_services FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_services_update" ON account_services FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "account_services_delete" ON account_services FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
```

- [ ] **Step 2: Run the migration**

```bash
task db:migrate
```

- [ ] **Step 3: Regenerate TypeScript types**

```bash
task types:generate
```

---

## Task 2: Database Migration — Contacts and Personal Info

**Files:**
- Create: `supabase/migrations/00012_contacts.sql`

**Steps:**

- [ ] **Step 1: Create the migration file with the following SQL:**

```sql
-- ============================================================================
-- Migration: Contacts and contact personal info
-- ============================================================================

-- ── contacts ────────────────────────────────────────────────────────────────
CREATE TABLE contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  email           text,
  phone           text,
  title           text,
  role            text CHECK (role IN ('Decision Maker', 'Influencer', 'Champion', 'Sponsor', 'Technisch', 'Financieel', 'Operationeel', 'Contact')),
  is_steerco      bool NOT NULL DEFAULT false,
  is_pinned       bool NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_contacts_account ON contacts(account_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON contacts FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "contacts_insert" ON contacts FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "contacts_update" ON contacts FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "contacts_delete" ON contacts FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

-- Enable realtime for contacts
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;

-- ── contact_personal_info ───────────────────────────────────────────────────
CREATE TABLE contact_personal_info (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id          uuid NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
  hobbies             text[] DEFAULT '{}',
  marital_status      text,
  has_children        bool DEFAULT false,
  children_count      int DEFAULT 0,
  children_names      text,
  birthday            text,
  partner_name        text,
  partner_profession  text,
  notes               text,
  invite_dinner       bool DEFAULT false,
  invite_event        bool DEFAULT false,
  invite_gift         bool DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON contact_personal_info
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_contact_personal_info_contact ON contact_personal_info(contact_id);

ALTER TABLE contact_personal_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_personal_info_select" ON contact_personal_info FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "contact_personal_info_insert" ON contact_personal_info FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "contact_personal_info_update" ON contact_personal_info FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "contact_personal_info_delete" ON contact_personal_info FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));
```

- [ ] **Step 2: Run the migration**

```bash
task db:migrate
```

---

## Task 3: Database Migration — Communications

**Files:**
- Create: `supabase/migrations/00013_communications.sql`

**Steps:**

- [ ] **Step 1: Create the migration file with the following SQL:**

```sql
-- ============================================================================
-- Migration: Communications
-- ============================================================================

CREATE TABLE communications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id        uuid REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id           uuid,  -- FK to deals added in Layer 3 migration
  type              text NOT NULL CHECK (type IN ('email', 'note', 'meeting', 'call')),
  subject           text NOT NULL,
  "to"              text,
  date              timestamptz NOT NULL DEFAULT now(),
  duration_minutes  int,
  content           jsonb,
  is_done           bool NOT NULL DEFAULT false,
  owner_id          uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON communications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_communications_account ON communications(account_id);
CREATE INDEX idx_communications_contact ON communications(contact_id);
CREATE INDEX idx_communications_owner ON communications(owner_id);
CREATE INDEX idx_communications_date ON communications(date DESC);

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communications_select" ON communications FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "communications_insert" ON communications FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "communications_update" ON communications FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "communications_delete" ON communications FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

ALTER PUBLICATION supabase_realtime ADD TABLE communications;
```

- [ ] **Step 2: Run the migration and regenerate types**

```bash
task db:migrate && task types:generate
```

---

## Task 4: Accounts Feature — Types

**Files:**
- Create: `src/features/accounts/types.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/accounts/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

// ── Row types from database ─────────────────────────────────────────────────
export type Account = Database['public']['Tables']['accounts']['Row'];
export type AccountManualService = Database['public']['Tables']['account_manual_services']['Row'];
export type AccountTechStack = Database['public']['Tables']['account_tech_stacks']['Row'];
export type AccountSamenwerkingsvorm = Database['public']['Tables']['account_samenwerkingsvormen']['Row'];
export type AccountHosting = Database['public']['Tables']['account_hosting']['Row'];
export type AccountCompetenceCenter = Database['public']['Tables']['account_competence_centers']['Row'];
export type AccountService = Database['public']['Tables']['account_services']['Row'];

// ── Extended account with relations ─────────────────────────────────────────
export type AccountWithRelations = Account & {
  manual_services: AccountManualService[];
  tech_stacks: AccountTechStack[];
  samenwerkingsvormen: AccountSamenwerkingsvorm[];
  hosting: AccountHosting[];
  competence_centers: AccountCompetenceCenter[];
  services: AccountService[];
  owner: { id: string; full_name: string | null } | null;
};

// ── Zod schemas for form validation ─────────────────────────────────────────
export const accountFormSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  domain: z.string().optional(),
  type: z.enum(['Klant', 'Prospect', 'Partner']),
  status: z.enum(['Actief', 'Inactief']),
  industry: z.string().optional(),
  size: z.string().optional(),
  revenue: z.coerce.number().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  vat_number: z.string().optional(),
  owner_id: z.string().uuid().optional().nullable(),
  health: z.coerce.number().min(0).max(100).optional(),
  managing_partner: z.string().optional(),
  account_director: z.string().optional(),
  team: z.string().optional(),
  about: z.string().optional(),
  phpro_contract: z.enum(['Geen', 'Actief', 'Inactief', 'In onderhandeling']).optional(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const hostingFormSchema = z.object({
  provider: z.string().min(1, 'Provider is verplicht'),
  environment: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
});

export type HostingFormValues = z.infer<typeof hostingFormSchema>;

export const competenceCenterFormSchema = z.object({
  cc_name: z.string().min(1, 'Naam is verplicht'),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  distribution: z.enum(['4%', '50/50']).optional(),
  services: z.array(z.string()).optional(),
});

export type CompetenceCenterFormValues = z.infer<typeof competenceCenterFormSchema>;

// ── Filter types ────────────────────────────────────────────────────────────
export type AccountFilters = {
  search?: string;
  type?: string;
  status?: string;
  owner_id?: string;
  country?: string;
};
```

---

## Task 5: Accounts Feature — Queries

**Files:**
- Create: `src/features/accounts/queries/get-accounts.ts`
- Create: `src/features/accounts/queries/get-account.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/accounts/queries/get-accounts.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Account, AccountFilters } from '../types';

type GetAccountsParams = {
  filters?: AccountFilters;
  page?: number;
  pageSize?: number;
};

export const getAccounts = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetAccountsParams = {}): Promise<{ data: Account[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('accounts')
      .select('*, owner:user_profiles!owner_id(id, full_name)', { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to);

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,domain.ilike.%${filters.search}%`);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.country) {
      query = query.eq('country', filters.country);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch accounts:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as Account[]) ?? [], count: count ?? 0 };
  },
);
```

- [ ] **Step 2: Create `src/features/accounts/queries/get-account.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { AccountWithRelations } from '../types';

export const getAccount = cache(
  async (id: string): Promise<AccountWithRelations | null> => {
    const supabase = await createServerClient();

    const { data: account, error } = await supabase
      .from('accounts')
      .select(`
        *,
        owner:user_profiles!owner_id(id, full_name),
        manual_services:account_manual_services(*),
        tech_stacks:account_tech_stacks(*),
        samenwerkingsvormen:account_samenwerkingsvormen(*),
        hosting:account_hosting(*),
        competence_centers:account_competence_centers(*),
        services:account_services(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch account:', error.message);
      return null;
    }

    return account as unknown as AccountWithRelations;
  },
);
```

---

## Task 6: Accounts Feature — Server Actions

**Files:**
- Create: `src/features/accounts/actions/create-account.ts`
- Create: `src/features/accounts/actions/update-account.ts`
- Create: `src/features/accounts/actions/delete-account.ts`
- Create: `src/features/accounts/actions/manage-account-relations.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/accounts/actions/create-account.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { accountFormSchema, type AccountFormValues } from '../types';

export async function createAccount(values: AccountFormValues) {
  const { userId } = await requirePermission('accounts.write');

  const parsed = accountFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...parsed.data, owner_id: parsed.data.owner_id ?? userId })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'account.created',
    entityType: 'account',
    entityId: data.id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath('/admin/accounts');
  return { data };
}
```

- [ ] **Step 2: Create `src/features/accounts/actions/update-account.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { accountFormSchema, type AccountFormValues } from '../types';

export async function updateAccount(id: string, values: AccountFormValues) {
  await requirePermission('accounts.write');

  const parsed = accountFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('accounts')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'account.updated',
    entityType: 'account',
    entityId: id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
```

- [ ] **Step 3: Create `src/features/accounts/actions/delete-account.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function deleteAccount(id: string) {
  await requirePermission('accounts.delete');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'account.deleted',
    entityType: 'account',
    entityId: id,
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
```

- [ ] **Step 4: Create `src/features/accounts/actions/manage-account-relations.ts`**

This action handles CRUD for all account sub-tables (tech stacks, hosting, competence centers, samenwerkingsvormen, manual services).

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';

type SubTable =
  | 'account_tech_stacks'
  | 'account_hosting'
  | 'account_competence_centers'
  | 'account_samenwerkingsvormen'
  | 'account_manual_services'
  | 'account_services';

export async function addAccountRelation(
  accountId: string,
  table: SubTable,
  values: Record<string, unknown>,
) {
  await requirePermission('accounts.write');

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from(table)
    .insert({ ...values, account_id: accountId })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: `${table}.created`,
    entityType: table,
    entityId: data.id,
    metadata: { account_id: accountId },
  });

  return { data };
}

export async function updateAccountRelation(
  table: SubTable,
  id: string,
  values: Record<string, unknown>,
) {
  await requirePermission('accounts.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from(table)
    .update(values)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: `${table}.updated`,
    entityType: table,
    entityId: id,
  });

  return { success: true };
}

export async function deleteAccountRelation(
  table: SubTable,
  id: string,
) {
  await requirePermission('accounts.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: `${table}.deleted`,
    entityType: table,
    entityId: id,
  });

  return { success: true };
}

/**
 * Sync a list of simple string values for a sub-table.
 * Used for tech_stacks, samenwerkingsvormen, manual_services, account_services.
 * Deletes all existing rows and inserts new ones.
 */
export async function syncAccountStringRelation(
  accountId: string,
  table: 'account_tech_stacks' | 'account_samenwerkingsvormen' | 'account_manual_services' | 'account_services',
  field: string,
  values: string[],
) {
  await requirePermission('accounts.write');

  const supabase = await createServerClient();

  // Delete existing
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq('account_id', accountId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Insert new
  if (values.length > 0) {
    const rows = values.map((v) => ({ account_id: accountId, [field]: v }));
    const { error: insertError } = await supabase
      .from(table)
      .insert(rows);

    if (insertError) {
      return { error: insertError.message };
    }
  }

  await logAction({
    action: `${table}.synced`,
    entityType: table,
    metadata: { account_id: accountId, count: values.length },
  });

  return { success: true };
}
```

---

## Task 7: Contacts Feature — Types

**Files:**
- Create: `src/features/contacts/types.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/contacts/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

// ── Row types ───────────────────────────────────────────────────────────────
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactPersonalInfo = Database['public']['Tables']['contact_personal_info']['Row'];

// ── Extended type ───────────────────────────────────────────────────────────
export type ContactWithDetails = Contact & {
  personal_info: ContactPersonalInfo | null;
  account: { id: string; name: string } | null;
};

// ── Zod schemas ─────────────────────────────────────────────────────────────
export const contactFormSchema = z.object({
  account_id: z.string().uuid('Account is verplicht'),
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  role: z.enum([
    'Decision Maker', 'Influencer', 'Champion', 'Sponsor',
    'Technisch', 'Financieel', 'Operationeel', 'Contact',
  ]).optional(),
  is_steerco: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const personalInfoFormSchema = z.object({
  hobbies: z.array(z.string()).optional(),
  marital_status: z.string().optional(),
  has_children: z.boolean().optional(),
  children_count: z.coerce.number().optional(),
  children_names: z.string().optional(),
  birthday: z.string().optional(),
  partner_name: z.string().optional(),
  partner_profession: z.string().optional(),
  notes: z.string().optional(),
  invite_dinner: z.boolean().optional(),
  invite_event: z.boolean().optional(),
  invite_gift: z.boolean().optional(),
});

export type PersonalInfoFormValues = z.infer<typeof personalInfoFormSchema>;

// ── Filter types ────────────────────────────────────────────────────────────
export type ContactFilters = {
  search?: string;
  account_id?: string;
  role?: string;
  is_steerco?: boolean;
};
```

---

## Task 8: Contacts Feature — Queries

**Files:**
- Create: `src/features/contacts/queries/get-contacts.ts`
- Create: `src/features/contacts/queries/get-contact.ts`
- Create: `src/features/contacts/queries/get-contacts-by-account.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/contacts/queries/get-contacts.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ContactWithDetails, ContactFilters } from '../types';

type GetContactsParams = {
  filters?: ContactFilters;
  page?: number;
  pageSize?: number;
};

export const getContacts = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetContactsParams = {}): Promise<{ data: ContactWithDetails[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('contacts')
      .select(`
        *,
        personal_info:contact_personal_info(*),
        account:accounts!account_id(id, name)
      `, { count: 'exact' })
      .order('last_name', { ascending: true })
      .range(from, to);

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    if (filters?.account_id) {
      query = query.eq('account_id', filters.account_id);
    }
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.is_steerco !== undefined) {
      query = query.eq('is_steerco', filters.is_steerco);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch contacts:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as ContactWithDetails[]) ?? [], count: count ?? 0 };
  },
);
```

- [ ] **Step 2: Create `src/features/contacts/queries/get-contact.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ContactWithDetails } from '../types';

export const getContact = cache(
  async (id: string): Promise<ContactWithDetails | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        personal_info:contact_personal_info(*),
        account:accounts!account_id(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch contact:', error.message);
      return null;
    }

    return data as unknown as ContactWithDetails;
  },
);
```

- [ ] **Step 3: Create `src/features/contacts/queries/get-contacts-by-account.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ContactWithDetails } from '../types';

export const getContactsByAccount = cache(
  async (accountId: string): Promise<ContactWithDetails[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        personal_info:contact_personal_info(*)
      `)
      .eq('account_id', accountId)
      .order('is_pinned', { ascending: false })
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch contacts by account:', error.message);
      return [];
    }

    return (data as unknown as ContactWithDetails[]) ?? [];
  },
);
```

---

## Task 9: Contacts Feature — Server Actions

**Files:**
- Create: `src/features/contacts/actions/create-contact.ts`
- Create: `src/features/contacts/actions/update-contact.ts`
- Create: `src/features/contacts/actions/delete-contact.ts`
- Create: `src/features/contacts/actions/update-personal-info.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/contacts/actions/create-contact.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { contactFormSchema, type ContactFormValues } from '../types';

export async function createContact(values: ContactFormValues) {
  await requirePermission('contacts.write');

  const parsed = contactFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('contacts')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Create empty personal info record
  await supabase
    .from('contact_personal_info')
    .insert({ contact_id: data.id });

  await logAction({
    action: 'contact.created',
    entityType: 'contact',
    entityId: data.id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/contacts');
  return { data };
}
```

- [ ] **Step 2: Create `src/features/contacts/actions/update-contact.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { contactFormSchema, type ContactFormValues } from '../types';

export async function updateContact(id: string, values: ContactFormValues) {
  await requirePermission('contacts.write');

  const parsed = contactFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('contacts')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'contact.updated',
    entityType: 'contact',
    entityId: id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/contacts');
  return { success: true };
}
```

- [ ] **Step 3: Create `src/features/contacts/actions/delete-contact.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function deleteContact(id: string) {
  await requirePermission('contacts.delete');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'contact.deleted',
    entityType: 'contact',
    entityId: id,
  });

  revalidatePath('/admin/contacts');
  return { success: true };
}
```

- [ ] **Step 4: Create `src/features/contacts/actions/update-personal-info.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { personalInfoFormSchema, type PersonalInfoFormValues } from '../types';

export async function updatePersonalInfo(contactId: string, values: PersonalInfoFormValues) {
  await requirePermission('contacts.write');

  const parsed = personalInfoFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();

  // Upsert: create if not exists, update if exists
  const { error } = await supabase
    .from('contact_personal_info')
    .upsert(
      { contact_id: contactId, ...parsed.data },
      { onConflict: 'contact_id' },
    );

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'contact_personal_info.updated',
    entityType: 'contact',
    entityId: contactId,
  });

  return { success: true };
}
```

---

## Task 10: Communications Feature — Types

**Files:**
- Create: `src/features/communications/types.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/communications/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

// ── Row types ───────────────────────────────────────────────────────────────
export type Communication = Database['public']['Tables']['communications']['Row'];

// ── Extended type ───────────────────────────────────────────────────────────
export type CommunicationWithDetails = Communication & {
  contact: { id: string; first_name: string; last_name: string } | null;
  owner: { id: string; full_name: string | null } | null;
};

// ── Zod schema ──────────────────────────────────────────────────────────────
export const communicationFormSchema = z.object({
  account_id: z.string().uuid(),
  contact_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  type: z.enum(['email', 'note', 'meeting', 'call']),
  subject: z.string().min(1, 'Onderwerp is verplicht'),
  to: z.string().optional().nullable(),
  date: z.string().min(1, 'Datum is verplicht'),
  duration_minutes: z.coerce.number().optional().nullable(),
  content: z.any().optional().nullable(), // Plate JSON
  is_done: z.boolean().optional(),
});

export type CommunicationFormValues = z.infer<typeof communicationFormSchema>;

// ── Filter types ────────────────────────────────────────────────────────────
export type CommunicationFilters = {
  account_id?: string;
  type?: string;
  contact_id?: string;
};
```

---

## Task 11: Communications Feature — Queries

**Files:**
- Create: `src/features/communications/queries/get-communications.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/communications/queries/get-communications.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { CommunicationWithDetails, CommunicationFilters } from '../types';

type GetCommunicationsParams = {
  filters?: CommunicationFilters;
  page?: number;
  pageSize?: number;
};

export const getCommunications = cache(
  async ({
    filters,
    page = 1,
    pageSize = 25,
  }: GetCommunicationsParams = {}): Promise<{ data: CommunicationWithDetails[]; count: number }> => {
    const supabase = await createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('communications')
      .select(`
        *,
        contact:contacts!contact_id(id, first_name, last_name),
        owner:user_profiles!owner_id(id, full_name)
      `, { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to);

    if (filters?.account_id) {
      query = query.eq('account_id', filters.account_id);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to fetch communications:', error.message);
      return { data: [], count: 0 };
    }

    return { data: (data as unknown as CommunicationWithDetails[]) ?? [], count: count ?? 0 };
  },
);
```

---

## Task 12: Communications Feature — Server Actions

**Files:**
- Create: `src/features/communications/actions/create-communication.ts`
- Create: `src/features/communications/actions/update-communication.ts`
- Create: `src/features/communications/actions/delete-communication.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/communications/actions/create-communication.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { communicationFormSchema, type CommunicationFormValues } from '../types';

export async function createCommunication(values: CommunicationFormValues) {
  const { userId } = await requirePermission('communications.write');

  const parsed = communicationFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('communications')
    .insert({ ...parsed.data, owner_id: userId })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'communication.created',
    entityType: 'communication',
    entityId: data.id,
    metadata: { subject: parsed.data.subject, type: parsed.data.type },
  });

  revalidatePath('/admin/accounts');
  return { data };
}
```

- [ ] **Step 2: Create `src/features/communications/actions/update-communication.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { communicationFormSchema, type CommunicationFormValues } from '../types';

export async function updateCommunication(id: string, values: CommunicationFormValues) {
  await requirePermission('communications.write');

  const parsed = communicationFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('communications')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'communication.updated',
    entityType: 'communication',
    entityId: id,
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
```

- [ ] **Step 3: Create `src/features/communications/actions/delete-communication.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function deleteCommunication(id: string) {
  await requirePermission('communications.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('communications')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'communication.deleted',
    entityType: 'communication',
    entityId: id,
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
```

---

## Task 13: Accounts List Page

**Files:**
- Create: `src/app/admin/accounts/page.tsx`
- Create: `src/app/admin/accounts/loading.tsx`
- Create: `src/features/accounts/components/account-list.tsx`
- Create: `src/features/accounts/components/account-filters.tsx`
- Create: `src/features/accounts/columns.ts`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/accounts/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/accounts/columns.ts`**

Define the DataTable column definitions:

```ts
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Account } from './types';

export const accountColumns: ColumnDef<Account>[] = [
  {
    accessorKey: 'name',
    header: 'Naam',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'industry',
    header: 'Sector',
  },
  {
    accessorKey: 'country',
    header: 'Land',
  },
  {
    accessorKey: 'health',
    header: 'Health',
  },
  {
    accessorKey: 'phpro_contract',
    header: 'Contract',
  },
];
```

- [ ] **Step 3: Create `src/features/accounts/components/account-filters.tsx`**

```tsx
'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AccountFilters } from '../types';

type Props = {
  filters: AccountFilters;
  onFilterChange: (filters: AccountFilters) => void;
};

export function AccountFiltersBar({ filters, onFilterChange }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      <Input
        placeholder="Zoeken op naam of domein..."
        value={filters.search ?? ''}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        className="w-64"
      />
      <Select
        value={filters.type ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filters, type: v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle types</SelectItem>
          <SelectItem value="Klant">Klant</SelectItem>
          <SelectItem value="Prospect">Prospect</SelectItem>
          <SelectItem value="Partner">Partner</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.status ?? 'all'}
        onValueChange={(v) => onFilterChange({ ...filters, status: v === 'all' ? undefined : v })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle</SelectItem>
          <SelectItem value="Actief">Actief</SelectItem>
          <SelectItem value="Inactief">Inactief</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/features/accounts/components/account-list.tsx`**

```tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEntity } from '@/lib/hooks/use-entity';
import { DataTable } from '@/components/admin/data-table';
import { AccountFiltersBar } from './account-filters';
import { accountColumns } from '../columns';
import type { Account, AccountFilters } from '../types';

const PAGE_SIZE = 25;

export function AccountList() {
  const router = useRouter();
  const { data, total, loading, fetchList } = useEntity<Account>({
    table: 'accounts',
    pageSize: PAGE_SIZE,
  });

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AccountFilters>({});

  const load = useCallback(() => {
    fetchList({ page });
  }, [fetchList, page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = data.filter((a) => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!a.name.toLowerCase().includes(s) && !(a.domain ?? '').toLowerCase().includes(s)) return false;
    }
    if (filters.type && a.type !== filters.type) return false;
    if (filters.status && a.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <AccountFiltersBar filters={filters} onFilterChange={setFilters} />
      <DataTable
        columns={accountColumns}
        data={filtered}
        onRowClick={(row) => router.push(`/admin/accounts/${row.id}`)}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
```

- [ ] **Step 5: Create `src/app/admin/accounts/page.tsx`**

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { AccountList } from '@/features/accounts/components/account-list';

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts' },
        ]}
      />
      <AccountList />
    </div>
  );
}
```

---

## Task 14: Account Detail Page (Tabbed Layout)

**Files:**
- Create: `src/app/admin/accounts/[id]/page.tsx`
- Create: `src/app/admin/accounts/[id]/loading.tsx`
- Create: `src/features/accounts/components/account-detail.tsx`
- Create: `src/features/accounts/components/account-overview-tab.tsx`
- Create: `src/features/accounts/components/account-contacts-tab.tsx`
- Create: `src/features/accounts/components/account-communications-tab.tsx`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/accounts/[id]/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28" />
        ))}
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/admin/accounts/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { getAccount } from '@/features/accounts/queries/get-account';
import { AccountDetail } from '@/features/accounts/components/account-detail';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetailPage({ params }: Props) {
  const { id } = await params;
  const account = await getAccount(id);

  if (!account) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Accounts', href: '/admin/accounts' },
          { label: account.name },
        ]}
      />
      <AccountDetail account={account} />
    </div>
  );
}
```

- [ ] **Step 3: Create `src/features/accounts/components/account-detail.tsx`**

This is a client component that renders 6 tabs: Overview, Communicatie, Contracten & Tarieven, Consultants, Contacts, Deals. The Contracten, Consultants, and Deals tabs are stubs that will be populated by Layers 3 and 4.

```tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountOverviewTab } from './account-overview-tab';
import { AccountContactsTab } from './account-contacts-tab';
import { AccountCommunicationsTab } from './account-communications-tab';
import type { AccountWithRelations } from '../types';

type Props = {
  account: AccountWithRelations;
};

export function AccountDetail({ account }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="communicatie">Communicatie</TabsTrigger>
        <TabsTrigger value="contracten">Contracten & Tarieven</TabsTrigger>
        <TabsTrigger value="consultants">Consultants</TabsTrigger>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="deals">Deals</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <AccountOverviewTab account={account} />
      </TabsContent>
      <TabsContent value="communicatie">
        <AccountCommunicationsTab accountId={account.id} />
      </TabsContent>
      <TabsContent value="contracten">
        <div className="py-8 text-center text-muted-foreground">
          Contracten & Tarieven — beschikbaar na Layer 4
        </div>
      </TabsContent>
      <TabsContent value="consultants">
        <div className="py-8 text-center text-muted-foreground">
          Consultants — beschikbaar na Layer 4
        </div>
      </TabsContent>
      <TabsContent value="contacts">
        <AccountContactsTab accountId={account.id} />
      </TabsContent>
      <TabsContent value="deals">
        <div className="py-8 text-center text-muted-foreground">
          Deals — beschikbaar na Layer 3
        </div>
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 4: Create `src/features/accounts/components/account-overview-tab.tsx`**

Displays account info, tech stack chips, hosting entries, competence centers, samenwerkingsvormen, health bar, and about section.

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AccountWithRelations } from '../types';

type Props = {
  account: AccountWithRelations;
};

export function AccountOverviewTab({ account }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Bedrijfsinformatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Type" value={account.type} />
          <InfoRow label="Status" value={account.status} />
          <InfoRow label="Sector" value={account.industry} />
          <InfoRow label="Grootte" value={account.size} />
          <InfoRow label="Omzet" value={account.revenue ? `€${Number(account.revenue).toLocaleString('nl-BE')}` : undefined} />
          <InfoRow label="Telefoon" value={account.phone} />
          <InfoRow label="Website" value={account.website} />
          <InfoRow label="Adres" value={account.address} />
          <InfoRow label="Land" value={account.country} />
          <InfoRow label="BTW" value={account.vat_number} />
          <InfoRow label="PHPro Contract" value={account.phpro_contract} />
        </CardContent>
      </Card>

      {/* Team & Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Team & Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Managing Partner" value={account.managing_partner} />
          <InfoRow label="Account Director" value={account.account_director} />
          <InfoRow label="Team" value={account.team} />
          <InfoRow label="Owner" value={account.owner?.full_name} />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-32">Health</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${account.health ?? 0}%`,
                  backgroundColor: (account.health ?? 0) >= 70 ? '#22c55e' : (account.health ?? 0) >= 40 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <span className="text-xs font-medium">{account.health ?? 0}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      {account.tech_stacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {account.tech_stacks.map((t) => (
              <Badge key={t.id} variant="secondary">{t.technology}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {account.manual_services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Services</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {account.manual_services.map((s) => (
              <Badge key={s.id} variant="outline">{s.service_name}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Samenwerkingsvormen */}
      {account.samenwerkingsvormen.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Samenwerkingsvormen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {account.samenwerkingsvormen.map((s) => (
              <Badge key={s.id} variant="secondary">{s.type}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Hosting */}
      {account.hosting.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Hosting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {account.hosting.map((h) => (
                <div key={h.id} className="flex items-center gap-4 text-sm">
                  <span className="font-medium">{h.provider}</span>
                  <span className="text-muted-foreground">{h.environment}</span>
                  {h.url && <a href={h.url} target="_blank" rel="noopener" className="text-blue-600 underline text-xs">{h.url}</a>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* About */}
      {account.about && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Over</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{account.about}</p>
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

- [ ] **Step 5: Create `src/features/accounts/components/account-contacts-tab.tsx`**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { Badge } from '@/components/ui/badge';
import type { Contact } from '@/features/contacts/types';

type Props = {
  accountId: string;
};

export function AccountContactsTab({ accountId }: Props) {
  const { data, loading, fetchList } = useEntity<Contact>({
    table: 'contacts',
    pageSize: 100,
  });

  const load = useCallback(() => {
    fetchList({ page: 1 });
  }, [fetchList]);

  useEffect(() => {
    load();
  }, [load]);

  const contacts = data.filter((c) => c.account_id === accountId);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Laden...</div>;
  }

  if (contacts.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">Geen contacten gevonden.</div>;
  }

  return (
    <div className="mt-4 space-y-3">
      {contacts.map((contact) => (
        <div key={contact.id} className="flex items-center gap-4 p-3 border rounded-lg">
          <div className="flex-1">
            <div className="font-medium text-sm">
              {contact.first_name} {contact.last_name}
              {contact.is_pinned && <span className="ml-1 text-yellow-500">★</span>}
            </div>
            <div className="text-xs text-muted-foreground">{contact.title}</div>
          </div>
          <div className="flex items-center gap-2">
            {contact.role && <Badge variant="outline">{contact.role}</Badge>}
            {contact.is_steerco && <Badge variant="secondary">Steerco</Badge>}
          </div>
          <div className="text-xs text-muted-foreground">{contact.email}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create `src/features/accounts/components/account-communications-tab.tsx`**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { Badge } from '@/components/ui/badge';
import type { Communication } from '@/features/communications/types';

type Props = {
  accountId: string;
};

const TYPE_LABELS: Record<string, string> = {
  email: 'E-mail',
  note: 'Notitie',
  meeting: 'Meeting',
  call: 'Telefoongesprek',
};

export function AccountCommunicationsTab({ accountId }: Props) {
  const { data, loading, fetchList } = useEntity<Communication>({
    table: 'communications',
    pageSize: 100,
  });

  const load = useCallback(() => {
    fetchList({ page: 1 });
  }, [fetchList]);

  useEffect(() => {
    load();
  }, [load]);

  const comms = data.filter((c) => c.account_id === accountId);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Laden...</div>;
  }

  if (comms.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">Geen communicatie gevonden.</div>;
  }

  return (
    <div className="mt-4 space-y-3">
      {comms.map((comm) => (
        <div key={comm.id} className="p-3 border rounded-lg">
          <div className="flex items-center gap-3 mb-1">
            <Badge variant="outline">{TYPE_LABELS[comm.type] ?? comm.type}</Badge>
            <span className="font-medium text-sm">{comm.subject}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(comm.date).toLocaleDateString('nl-BE')}
            </span>
          </div>
          {comm.is_done && (
            <span className="text-xs text-green-600">Afgerond</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Task 15: Contacts List Page

**Files:**
- Create: `src/app/admin/contacts/page.tsx`
- Create: `src/app/admin/contacts/loading.tsx`
- Create: `src/features/contacts/components/contact-list.tsx`
- Create: `src/features/contacts/columns.ts`

**Steps:**

- [ ] **Step 1: Create `src/app/admin/contacts/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function ContactsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/contacts/columns.ts`**

```ts
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ContactWithDetails } from './types';

export const contactColumns: ColumnDef<ContactWithDetails>[] = [
  {
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    id: 'name',
    header: 'Naam',
  },
  {
    accessorKey: 'email',
    header: 'E-mail',
  },
  {
    accessorKey: 'phone',
    header: 'Telefoon',
  },
  {
    accessorKey: 'title',
    header: 'Functie',
  },
  {
    accessorKey: 'role',
    header: 'Rol',
  },
  {
    accessorFn: (row) => row.account?.name ?? '',
    id: 'account',
    header: 'Account',
  },
];
```

- [ ] **Step 3: Create `src/features/contacts/components/contact-list.tsx`**

```tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEntity } from '@/lib/hooks/use-entity';
import { DataTable } from '@/components/admin/data-table';
import { Input } from '@/components/ui/input';
import { contactColumns } from '../columns';
import type { Contact } from '../types';

const PAGE_SIZE = 25;

export function ContactList() {
  const { data, total, loading, fetchList } = useEntity<Contact>({
    table: 'contacts',
    pageSize: PAGE_SIZE,
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    fetchList({ page });
  }, [fetchList, page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = data.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(s) ||
      c.last_name.toLowerCase().includes(s) ||
      (c.email ?? '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Zoeken op naam of e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64"
      />
      <DataTable
        columns={contactColumns as any}
        data={filtered}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/admin/contacts/page.tsx`**

```tsx
import { PageHeader } from '@/components/admin/page-header';
import { ContactList } from '@/features/contacts/components/contact-list';

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Contacts' },
        ]}
      />
      <ContactList />
    </div>
  );
}
```

---

## Task 16: Seed Data

**Files:**
- Create: `supabase/migrations/00014_seed_core_crm.sql`

**Steps:**

- [ ] **Step 1: Create seed migration**

Note: UUIDs below are deterministic so other layers can reference them. The seed runs after all Layer 2 tables exist.

```sql
-- ============================================================================
-- Seed: Core CRM data (accounts, contacts, communications)
-- Must run after user profile seed from Layer 1
-- ============================================================================

-- ── Accounts ────────────────────────────────────────────────────────────────
-- IDs reference Layer 1 user seeds: u1=Jan(admin), u2=Sophie(sales_manager), u3=Pieter(sales_rep)

INSERT INTO accounts (id, name, domain, type, status, industry, size, revenue, phone, website, address, country, vat_number, owner_id, health, managing_partner, account_director, team, about, phpro_contract)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'TechVision NV', 'techvision.be', 'Klant', 'Actief', 'Technology', '51-200', 2500000,
  '+32 2 123 45 67', 'www.techvision.be', 'Kunstlaan 56, 1000 Brussel', 'BE', 'BE0123.456.789',
  up.id, 85, 'Jeroen', 'Bert', 'Team 1',
  'TechVision is een Belgische enterprise software company gespecialiseerd in e-commerce en ERP-integraties.',
  'Actief'
FROM user_profiles up WHERE up.full_name = 'Sophie Willems'
ON CONFLICT DO NOTHING;

INSERT INTO accounts (id, name, domain, type, status, industry, size, revenue, phone, website, address, country, vat_number, owner_id, health, managing_partner, account_director, team, about, phpro_contract)
SELECT
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'GreenLogistics BV', 'greenlogistics.nl', 'Prospect', 'Actief', 'Logistics', '201-1000', 8000000,
  '+31 20 987 65 43', 'www.greenlogistics.nl', 'Keizersgracht 112, 1017 Amsterdam', 'NL', 'NL123456789B01',
  up.id, 45, 'Nathalie', 'Jeroen', 'Team 2',
  '',
  'Geen'
FROM user_profiles up WHERE up.full_name = 'Pieter Claes'
ON CONFLICT DO NOTHING;

INSERT INTO accounts (id, name, domain, type, status, industry, size, revenue, phone, website, address, country, vat_number, owner_id, health, managing_partner, account_director, team, about, phpro_contract)
SELECT
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'MediCare Plus', 'medicareplus.be', 'Klant', 'Actief', 'Healthcare', '11-50', 750000,
  '+32 3 456 78 90', 'www.medicareplus.be', 'Mechelsesteenweg 271, 2018 Antwerpen', 'BE', 'BE0987.654.321',
  up.id, 72, 'Wim', 'Nathalie', 'Team 1',
  'MediCare Plus is een toonaangevende zorginstelling in de Antwerpse regio.',
  'Actief'
FROM user_profiles up WHERE up.full_name = 'Pieter Claes'
ON CONFLICT DO NOTHING;

-- ── Account Tech Stacks ────────────────────────────────────────────────────
INSERT INTO account_tech_stacks (account_id, technology) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'SAP'),
  ('a0000000-0000-0000-0000-000000000001', 'PIMCore'),
  ('a0000000-0000-0000-0000-000000000001', 'Magento'),
  ('a0000000-0000-0000-0000-000000000002', 'SAP'),
  ('a0000000-0000-0000-0000-000000000002', 'Microsoft Dynamics'),
  ('a0000000-0000-0000-0000-000000000003', 'Akeneo'),
  ('a0000000-0000-0000-0000-000000000003', 'Shopware');

-- ── Account Manual Services ────────────────────────────────────────────────
INSERT INTO account_manual_services (account_id, service_name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Adobe Commerce'),
  ('a0000000-0000-0000-0000-000000000003', 'Magento Open Source');

-- ── Account Samenwerkingsvormen ────────────────────────────────────────────
INSERT INTO account_samenwerkingsvormen (account_id, type) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Continuous Dev.'),
  ('a0000000-0000-0000-0000-000000000001', 'Support'),
  ('a0000000-0000-0000-0000-000000000003', 'Project'),
  ('a0000000-0000-0000-0000-000000000003', 'Ad Hoc');

-- ── Account Hosting ────────────────────────────────────────────────────────
INSERT INTO account_hosting (account_id, provider, environment, url, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'AWS', 'Productie', 'https://console.aws.amazon.com', ''),
  ('a0000000-0000-0000-0000-000000000001', 'Hosted Power', 'Staging', '', 'Managed hosting staging omgeving'),
  ('a0000000-0000-0000-0000-000000000003', 'Combell', 'Productie', '', 'Shared hosting pakket');

-- ── Contacts ────────────────────────────────────────────────────────────────
INSERT INTO contacts (id, account_id, first_name, last_name, email, phone, title, role, is_steerco, is_pinned) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Marc', 'Vanderberg', 'marc@techvision.be', '+32 475 123', 'CTO', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Lotte', 'Pieters', 'lotte@techvision.be', '+32 476 456', 'Project Manager', 'Operationeel', false, false),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Dirk', 'Van Damme', 'dirk@greenlogistics.nl', '+31 6 123', 'CEO', 'Decision Maker', true, true),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'Sarah', 'Leclercq', 'sarah@medicareplus.be', '+32 477 345', 'Managing Director', 'Decision Maker', true, true);

-- ── Contact Personal Info ───────────────────────────────────────────────────
INSERT INTO contact_personal_info (contact_id, hobbies, marital_status, has_children, children_count, children_names, birthday, partner_name, partner_profession, notes, invite_dinner, invite_event, invite_gift) VALUES
  ('c0000000-0000-0000-0000-000000000001', ARRAY['Fietsen', 'Lopen'], 'Getrouwd', true, 2, 'Lena, Thomas', '15/03', 'Sophie', 'Advocate', 'Houdt van technologie en is een sterke beslisser. Prefers directe communicatie.', true, true, true),
  ('c0000000-0000-0000-0000-000000000002', '{}', '', false, 0, '', '', '', '', '', false, false, false),
  ('c0000000-0000-0000-0000-000000000003', ARRAY['Golf', 'Zeilen'], 'Getrouwd', true, 3, 'Emma, Jonas, Nina', '22/07', '', '', '', true, false, true),
  ('c0000000-0000-0000-0000-000000000005', '{}', 'Single', false, 0, '', '04/11', '', '', '', false, true, false);
```

- [ ] **Step 2: Run the seed migration**

```bash
task db:migrate
```

---

## Task 17: Verify and Commit

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
- `/admin/accounts` — should show the accounts list
- `/admin/accounts/a0000000-0000-0000-0000-000000000001` — should show TechVision NV detail
- `/admin/contacts` — should show the contacts list

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement Layer 2 — Core CRM (accounts, contacts, communications)"
```
