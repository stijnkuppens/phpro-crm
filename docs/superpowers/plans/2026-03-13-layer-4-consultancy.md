# Layer 4: Consultancy — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement bench consultants, active consultants, contracts, hourly rates, SLA rates, and the full indexeringssimulator workflow — the complete consultancy management system.

**Architecture:** Bench consultants are standalone entities that can be linked to deals. Active consultants belong to accounts and have rate history, extensions, and contract attributions. Contracts are 1:1 per account. Hourly rates and SLA rates are per-account per-year. The indexeringssimulator is a 4-step server-side workflow with drafts and approval gating. This layer populates the "Contracten & Tarieven" and "Consultants" tabs on account detail.

**Tech Stack:** Supabase (PostgreSQL, RLS), React 19, Zod, shadcn/ui, Supabase Storage (PDF uploads)

**Spec:** `docs/superpowers/specs/2026-03-13-crm-port-design.md`

**IMPORTANT — Cross-cutting pattern:** Every server action that performs a write (create/update/delete) MUST call `revalidatePath('/admin/<entity>')` before returning. Import: `import { revalidatePath } from 'next/cache';`

**Depends on:** Layer 1 (Foundation), Layer 2 (Core CRM), Layer 3 (Sales — deals FK)

---

## Task 1: Database Migration — Bench Consultants

**Files:**
- Create: `supabase/migrations/00030_bench_consultants.sql`

**Steps:**

- [ ] **Step 1: Create the migration file:**

```sql
-- ============================================================================
-- Migration: Bench consultants and languages
-- ============================================================================

CREATE TABLE bench_consultants (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name        text NOT NULL,
  last_name         text NOT NULL,
  city              text,
  priority          text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  available_date    date,
  min_hourly_rate   numeric,
  max_hourly_rate   numeric,
  roles             text[] DEFAULT '{}',
  technologies      text[] DEFAULT '{}',
  description       text,
  cv_pdf_url        text,
  is_archived       bool NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON bench_consultants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_bench_consultants_priority ON bench_consultants(priority);
CREATE INDEX idx_bench_consultants_archived ON bench_consultants(is_archived);

ALTER TABLE bench_consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bench_consultants_select" ON bench_consultants FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "bench_consultants_insert" ON bench_consultants FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "bench_consultants_update" ON bench_consultants FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "bench_consultants_delete" ON bench_consultants FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE bench_consultants;

-- ── bench_consultant_languages ──────────────────────────────────────────────
CREATE TABLE bench_consultant_languages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bench_consultant_id   uuid NOT NULL REFERENCES bench_consultants(id) ON DELETE CASCADE,
  language              text NOT NULL,
  level                 text NOT NULL CHECK (level IN ('Basis', 'Gevorderd', 'Vloeiend', 'Moedertaal')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON bench_consultant_languages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_bench_consultant_languages_consultant ON bench_consultant_languages(bench_consultant_id);

ALTER TABLE bench_consultant_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bench_consultant_languages_select" ON bench_consultant_languages FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "bench_consultant_languages_write" ON bench_consultant_languages FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));

-- Add FK from deals to bench_consultants (was deferred from Layer 3)
ALTER TABLE deals
  ADD CONSTRAINT deals_bench_consultant_id_fkey
  FOREIGN KEY (bench_consultant_id) REFERENCES bench_consultants(id) ON DELETE SET NULL;

CREATE INDEX idx_deals_bench_consultant ON deals(bench_consultant_id);
```

- [ ] **Step 2: Run the migration**

```bash
task db:migrate
```

---

## Task 2: Database Migration — Active Consultants and Related Tables

**Files:**
- Create: `supabase/migrations/00031_active_consultants.sql`

**Steps:**

- [ ] **Step 1: Create the migration file:**

```sql
-- ============================================================================
-- Migration: Active consultants, rate history, extensions, contract attributions
-- ============================================================================

CREATE TABLE active_consultants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          uuid REFERENCES accounts(id) ON DELETE SET NULL,
  first_name          text NOT NULL,
  last_name           text NOT NULL,
  role                text,
  city                text,
  cv_pdf_url          text,
  is_active           bool NOT NULL DEFAULT true,
  client_name         text,
  client_city         text,
  start_date          date NOT NULL,
  end_date            date,
  is_indefinite       bool NOT NULL DEFAULT false,
  hourly_rate         numeric NOT NULL,
  sow_url             text,
  notice_period_days  int DEFAULT 30,
  notes               text,
  is_stopped          bool NOT NULL DEFAULT false,
  stop_date           date,
  stop_reason         text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON active_consultants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_active_consultants_account ON active_consultants(account_id);
CREATE INDEX idx_active_consultants_active ON active_consultants(is_active);

ALTER TABLE active_consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active_consultants_select" ON active_consultants FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "active_consultants_insert" ON active_consultants FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "active_consultants_update" ON active_consultants FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "active_consultants_delete" ON active_consultants FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE active_consultants;

-- ── consultant_rate_history ─────────────────────────────────────────────────
CREATE TABLE consultant_rate_history (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_consultant_id  uuid NOT NULL REFERENCES active_consultants(id) ON DELETE CASCADE,
  date                  date NOT NULL,
  rate                  numeric NOT NULL,
  reason                text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_rate_history
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_consultant_rate_history_consultant ON consultant_rate_history(active_consultant_id);

ALTER TABLE consultant_rate_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultant_rate_history_select" ON consultant_rate_history FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "consultant_rate_history_write" ON consultant_rate_history FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- ── consultant_extensions ───────────────────────────────────────────────────
CREATE TABLE consultant_extensions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_consultant_id  uuid NOT NULL REFERENCES active_consultants(id) ON DELETE CASCADE,
  new_end_date          date NOT NULL,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_extensions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_consultant_extensions_consultant ON consultant_extensions(active_consultant_id);

ALTER TABLE consultant_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultant_extensions_select" ON consultant_extensions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "consultant_extensions_write" ON consultant_extensions FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- ── consultant_contract_attributions ────────────────────────────────────────
CREATE TABLE consultant_contract_attributions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_consultant_id  uuid NOT NULL REFERENCES active_consultants(id) ON DELETE CASCADE,
  type                  text NOT NULL CHECK (type IN ('rechtstreeks', 'cronos')),
  contact_id            uuid REFERENCES contacts(id) ON DELETE SET NULL,
  cc_name               text,
  cc_contact_person     text,
  cc_email              text,
  cc_phone              text,
  cc_distribution       text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_contract_attributions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_consultant_contract_attributions_consultant ON consultant_contract_attributions(active_consultant_id);

ALTER TABLE consultant_contract_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultant_contract_attributions_select" ON consultant_contract_attributions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "consultant_contract_attributions_write" ON consultant_contract_attributions FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
```

- [ ] **Step 2: Run the migration**

```bash
task db:migrate
```

---

## Task 3: Database Migration — Contracts, Hourly Rates, SLA Rates

**Files:**
- Create: `supabase/migrations/00032_contracts_rates.sql`

**Steps:**

- [ ] **Step 1: Create the migration file:**

```sql
-- ============================================================================
-- Migration: Contracts, hourly rates, SLA rates, SLA tools
-- ============================================================================

-- ── contracts ───────────────────────────────────────────────────────────────
CREATE TABLE contracts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id              uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  has_framework_contract  bool NOT NULL DEFAULT false,
  framework_pdf_url       text,
  framework_start         date,
  framework_end           date,
  framework_indefinite    bool NOT NULL DEFAULT false,
  has_service_contract    bool NOT NULL DEFAULT false,
  service_pdf_url         text,
  service_start           date,
  service_end             date,
  service_indefinite      bool NOT NULL DEFAULT false,
  purchase_orders_url     text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select" ON contracts FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "contracts_insert" ON contracts FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "contracts_update" ON contracts FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "contracts_delete" ON contracts FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

-- ── hourly_rates ────────────────────────────────────────────────────────────
CREATE TABLE hourly_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  year            int NOT NULL,
  role            text NOT NULL,
  rate            numeric NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, year, role)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON hourly_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_hourly_rates_account_year ON hourly_rates(account_id, year);

ALTER TABLE hourly_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hourly_rates_select" ON hourly_rates FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "hourly_rates_insert" ON hourly_rates FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "hourly_rates_update" ON hourly_rates FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "hourly_rates_delete" ON hourly_rates FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

-- ── sla_rates ───────────────────────────────────────────────────────────────
CREATE TABLE sla_rates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  year                  int NOT NULL,
  fixed_monthly_rate    numeric NOT NULL DEFAULT 0,
  support_hourly_rate   numeric NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, year)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON sla_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_sla_rates_account_year ON sla_rates(account_id, year);

ALTER TABLE sla_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sla_rates_select" ON sla_rates FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "sla_rates_insert" ON sla_rates FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "sla_rates_update" ON sla_rates FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "sla_rates_delete" ON sla_rates FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

-- ── sla_tools ───────────────────────────────────────────────────────────────
CREATE TABLE sla_tools (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_rate_id     uuid NOT NULL REFERENCES sla_rates(id) ON DELETE CASCADE,
  tool_name       text NOT NULL,
  monthly_price   numeric NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON sla_tools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_sla_tools_sla_rate ON sla_tools(sla_rate_id);

ALTER TABLE sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sla_tools_select" ON sla_tools FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "sla_tools_write" ON sla_tools FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
```

- [ ] **Step 2: Run the migration**

```bash
task db:migrate
```

---

## Task 4: Database Migration — Indexation Tables

**Files:**
- Create: `supabase/migrations/00033_indexation.sql`

**Steps:**

- [ ] **Step 1: Create the migration file:**

```sql
-- ============================================================================
-- Migration: Indexation (indices, config, drafts, history)
-- ============================================================================

-- ── indexation_indices ───────────────────────────────────────────────────────
-- Already created in Layer 1 (00010_indexation_indices.sql) — do not recreate

-- ── indexation_config ───────────────────────────────────────────────────────
CREATE TABLE indexation_config (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  indexation_type   text,
  start_month       int,
  start_year        int,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE indexation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_config_select" ON indexation_config FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_config_write" ON indexation_config FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- ── indexation_drafts ───────────────────────────────────────────────────────
CREATE TABLE indexation_drafts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id              uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  target_year             int NOT NULL,
  base_year               int NOT NULL,
  percentage              numeric NOT NULL,
  status                  text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  info                    text,
  adjustment_pct_hourly   numeric,
  adjustment_pct_sla      numeric,
  created_by              uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_by             uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_drafts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_drafts_account ON indexation_drafts(account_id);
CREATE INDEX idx_indexation_drafts_status ON indexation_drafts(status);

ALTER TABLE indexation_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_drafts_select" ON indexation_drafts FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_drafts_insert" ON indexation_drafts FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "indexation_drafts_update" ON indexation_drafts FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));
CREATE POLICY "indexation_drafts_delete" ON indexation_drafts FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

-- ── indexation_draft_rates ──────────────────────────────────────────────────
CREATE TABLE indexation_draft_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id        uuid NOT NULL REFERENCES indexation_drafts(id) ON DELETE CASCADE,
  role            text NOT NULL,
  current_rate    numeric NOT NULL,
  proposed_rate   numeric NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_draft_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_draft_rates_draft ON indexation_draft_rates(draft_id);

ALTER TABLE indexation_draft_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_draft_rates_select" ON indexation_draft_rates FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_draft_rates_write" ON indexation_draft_rates FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- ── indexation_draft_sla ────────────────────────────────────────────────────
CREATE TABLE indexation_draft_sla (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id              uuid NOT NULL UNIQUE REFERENCES indexation_drafts(id) ON DELETE CASCADE,
  fixed_monthly_rate    numeric NOT NULL DEFAULT 0,
  support_hourly_rate   numeric NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_draft_sla
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE indexation_draft_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_draft_sla_select" ON indexation_draft_sla FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_draft_sla_write" ON indexation_draft_sla FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- ── indexation_draft_sla_tools ──────────────────────────────────────────────
CREATE TABLE indexation_draft_sla_tools (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id        uuid NOT NULL REFERENCES indexation_drafts(id) ON DELETE CASCADE,
  tool_name       text NOT NULL,
  proposed_price  numeric NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_draft_sla_tools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_draft_sla_tools_draft ON indexation_draft_sla_tools(draft_id);

ALTER TABLE indexation_draft_sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_draft_sla_tools_select" ON indexation_draft_sla_tools FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_draft_sla_tools_write" ON indexation_draft_sla_tools FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- ── indexation_history ──────────────────────────────────────────────────────
CREATE TABLE indexation_history (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id              uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date                    date NOT NULL DEFAULT CURRENT_DATE,
  target_year             int NOT NULL,
  percentage              numeric NOT NULL,
  scenario                text,
  info                    text,
  adjustment_pct_hourly   numeric,
  adjustment_pct_sla      numeric,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_history_account ON indexation_history(account_id);

ALTER TABLE indexation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_select" ON indexation_history FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_history_write" ON indexation_history FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- ── indexation_history_rates ────────────────────────────────────────────────
CREATE TABLE indexation_history_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id      uuid NOT NULL REFERENCES indexation_history(id) ON DELETE CASCADE,
  role            text NOT NULL,
  rate            numeric NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_history_rates_history ON indexation_history_rates(history_id);

ALTER TABLE indexation_history_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_rates_select" ON indexation_history_rates FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_history_rates_write" ON indexation_history_rates FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- ── indexation_history_sla ──────────────────────────────────────────────────
CREATE TABLE indexation_history_sla (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id            uuid NOT NULL UNIQUE REFERENCES indexation_history(id) ON DELETE CASCADE,
  fixed_monthly_rate    numeric NOT NULL DEFAULT 0,
  support_hourly_rate   numeric NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history_sla
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE indexation_history_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_sla_select" ON indexation_history_sla FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_history_sla_write" ON indexation_history_sla FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- ── indexation_history_sla_tools ────────────────────────────────────────────
CREATE TABLE indexation_history_sla_tools (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id      uuid NOT NULL REFERENCES indexation_history(id) ON DELETE CASCADE,
  tool_name       text NOT NULL,
  price           numeric NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON indexation_history_sla_tools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_indexation_history_sla_tools_history ON indexation_history_sla_tools(history_id);

ALTER TABLE indexation_history_sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indexation_history_sla_tools_select" ON indexation_history_sla_tools FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "indexation_history_sla_tools_write" ON indexation_history_sla_tools FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

-- indexation_indices seed already in Layer 1 (00010_indexation_indices.sql)
```

- [ ] **Step 2: Run the migration and regenerate types**

```bash
task db:migrate && task types:generate
```

---

## Task 5: Bench Feature — Types, Queries, Actions

**Files:**
- Create: `src/features/bench/types.ts`
- Create: `src/features/bench/queries/get-bench-consultants.ts`
- Create: `src/features/bench/queries/get-bench-consultant.ts`
- Create: `src/features/bench/actions/create-bench-consultant.ts`
- Create: `src/features/bench/actions/update-bench-consultant.ts`
- Create: `src/features/bench/actions/archive-bench-consultant.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/bench/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

export type BenchConsultant = Database['public']['Tables']['bench_consultants']['Row'];
export type BenchConsultantLanguage = Database['public']['Tables']['bench_consultant_languages']['Row'];

export type BenchConsultantWithLanguages = BenchConsultant & {
  languages: BenchConsultantLanguage[];
};

export const benchConsultantFormSchema = z.object({
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  city: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  available_date: z.string().optional().nullable(),
  min_hourly_rate: z.coerce.number().optional().nullable(),
  max_hourly_rate: z.coerce.number().optional().nullable(),
  roles: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  description: z.string().optional(),
  cv_pdf_url: z.string().optional().nullable(),
});

export type BenchConsultantFormValues = z.infer<typeof benchConsultantFormSchema>;

export const languageFormSchema = z.object({
  language: z.string().min(1),
  level: z.enum(['Basis', 'Gevorderd', 'Vloeiend', 'Moedertaal']),
});

export type LanguageFormValues = z.infer<typeof languageFormSchema>;
```

- [ ] **Step 2: Create `src/features/bench/queries/get-bench-consultants.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { BenchConsultantWithLanguages } from '../types';

export const getBenchConsultants = cache(
  async (includeArchived = false): Promise<BenchConsultantWithLanguages[]> => {
    const supabase = await createServerClient();

    let query = supabase
      .from('bench_consultants')
      .select(`
        *,
        languages:bench_consultant_languages(*)
      `)
      .order('priority', { ascending: true })
      .order('available_date', { ascending: true });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch bench consultants:', error.message);
      return [];
    }

    return (data as unknown as BenchConsultantWithLanguages[]) ?? [];
  },
);
```

- [ ] **Step 3: Create `src/features/bench/queries/get-bench-consultant.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { BenchConsultantWithLanguages } from '../types';

export const getBenchConsultant = cache(
  async (id: string): Promise<BenchConsultantWithLanguages | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('bench_consultants')
      .select(`
        *,
        languages:bench_consultant_languages(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch bench consultant:', error.message);
      return null;
    }

    return data as unknown as BenchConsultantWithLanguages;
  },
);
```

- [ ] **Step 4: Create `src/features/bench/actions/create-bench-consultant.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { benchConsultantFormSchema, type BenchConsultantFormValues, type LanguageFormValues } from '../types';

export async function createBenchConsultant(
  values: BenchConsultantFormValues,
  languages: LanguageFormValues[],
) {
  await requirePermission('bench.write');

  const parsed = benchConsultantFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('bench_consultants')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Insert languages
  if (languages.length > 0) {
    await supabase.from('bench_consultant_languages').insert(
      languages.map((l) => ({ bench_consultant_id: data.id, ...l })),
    );
  }

  await logAction({
    action: 'bench_consultant.created',
    entityType: 'bench_consultant',
    entityId: data.id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/bench');
  return { data };
}
```

- [ ] **Step 5: Create `src/features/bench/actions/update-bench-consultant.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { benchConsultantFormSchema, type BenchConsultantFormValues, type LanguageFormValues } from '../types';

export async function updateBenchConsultant(
  id: string,
  values: BenchConsultantFormValues,
  languages: LanguageFormValues[],
) {
  await requirePermission('bench.write');

  const parsed = benchConsultantFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('bench_consultants')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  // Sync languages: delete all, re-insert
  await supabase.from('bench_consultant_languages').delete().eq('bench_consultant_id', id);
  if (languages.length > 0) {
    await supabase.from('bench_consultant_languages').insert(
      languages.map((l) => ({ bench_consultant_id: id, ...l })),
    );
  }

  await logAction({
    action: 'bench_consultant.updated',
    entityType: 'bench_consultant',
    entityId: id,
  });

  revalidatePath('/admin/bench');
  return { success: true };
}
```

- [ ] **Step 6: Create `src/features/bench/actions/archive-bench-consultant.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function archiveBenchConsultant(id: string, archive = true) {
  await requirePermission('bench.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('bench_consultants')
    .update({ is_archived: archive })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: archive ? 'bench_consultant.archived' : 'bench_consultant.unarchived',
    entityType: 'bench_consultant',
    entityId: id,
  });

  revalidatePath('/admin/bench');
  return { success: true };
}
```

---

## Task 6: Active Consultants Feature — Types, Queries, Actions

**Files:**
- Create: `src/features/consultants/types.ts`
- Create: `src/features/consultants/queries/get-active-consultants.ts`
- Create: `src/features/consultants/queries/get-consultants-by-account.ts`
- Create: `src/features/consultants/actions/create-active-consultant.ts`
- Create: `src/features/consultants/actions/update-active-consultant.ts`
- Create: `src/features/consultants/actions/stop-consultant.ts`
- Create: `src/features/consultants/actions/extend-consultant.ts`
- Create: `src/features/consultants/actions/add-rate-change.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/consultants/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

export type ActiveConsultant = Database['public']['Tables']['active_consultants']['Row'];
export type ConsultantRateHistory = Database['public']['Tables']['consultant_rate_history']['Row'];
export type ConsultantExtension = Database['public']['Tables']['consultant_extensions']['Row'];
export type ConsultantContractAttribution = Database['public']['Tables']['consultant_contract_attributions']['Row'];

export type ActiveConsultantWithDetails = ActiveConsultant & {
  account: { id: string; name: string } | null;
  rate_history: ConsultantRateHistory[];
  extensions: ConsultantExtension[];
  contract_attribution: ConsultantContractAttribution | null;
};

export type ContractStatus = 'stopgezet' | 'onbepaald' | 'verlopen' | 'kritiek' | 'waarschuwing' | 'actief';

export function getContractStatus(consultant: ActiveConsultant): ContractStatus {
  if (consultant.is_stopped) return 'stopgezet';
  if (consultant.is_indefinite || !consultant.end_date) return 'onbepaald';
  const days = Math.ceil(
    (new Date(consultant.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return 'verlopen';
  if (days <= 60) return 'kritiek';
  if (days <= 120) return 'waarschuwing';
  return 'actief';
}

export function getCurrentRate(consultant: ActiveConsultantWithDetails): number {
  if (!consultant.rate_history || consultant.rate_history.length === 0) {
    return Number(consultant.hourly_rate ?? 0);
  }
  const sorted = [...consultant.rate_history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return Number(sorted[0].rate);
}

export const activeConsultantFormSchema = z.object({
  account_id: z.string().uuid().optional().nullable(),
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  role: z.string().optional(),
  city: z.string().optional(),
  cv_pdf_url: z.string().optional().nullable(),
  client_name: z.string().optional(),
  client_city: z.string().optional(),
  start_date: z.string().min(1, 'Startdatum is verplicht'),
  end_date: z.string().optional().nullable(),
  is_indefinite: z.boolean().optional(),
  hourly_rate: z.coerce.number().min(0, 'Uurtarief is verplicht'),
  sow_url: z.string().optional(),
  notice_period_days: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type ActiveConsultantFormValues = z.infer<typeof activeConsultantFormSchema>;
```

- [ ] **Step 2: Create `src/features/consultants/queries/get-active-consultants.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ActiveConsultantWithDetails } from '../types';

export const getActiveConsultants = cache(
  async (): Promise<ActiveConsultantWithDetails[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('active_consultants')
      .select(`
        *,
        account:accounts!account_id(id, name),
        rate_history:consultant_rate_history(*),
        extensions:consultant_extensions(*),
        contract_attribution:consultant_contract_attributions(*)
      `)
      .order('is_stopped', { ascending: true })
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch active consultants:', error.message);
      return [];
    }

    return (data as unknown as ActiveConsultantWithDetails[]) ?? [];
  },
);
```

- [ ] **Step 3: Create `src/features/consultants/queries/get-consultants-by-account.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { ActiveConsultantWithDetails } from '../types';

export const getConsultantsByAccount = cache(
  async (accountId: string): Promise<ActiveConsultantWithDetails[]> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('active_consultants')
      .select(`
        *,
        account:accounts!account_id(id, name),
        rate_history:consultant_rate_history(*),
        extensions:consultant_extensions(*),
        contract_attribution:consultant_contract_attributions(*)
      `)
      .eq('account_id', accountId)
      .order('is_stopped', { ascending: true })
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Failed to fetch consultants by account:', error.message);
      return [];
    }

    return (data as unknown as ActiveConsultantWithDetails[]) ?? [];
  },
);
```

- [ ] **Step 4: Create `src/features/consultants/actions/create-active-consultant.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { activeConsultantFormSchema, type ActiveConsultantFormValues } from '../types';

export async function createActiveConsultant(values: ActiveConsultantFormValues) {
  await requirePermission('consultants.write');

  const parsed = activeConsultantFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('active_consultants')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Create initial rate history entry
  await supabase.from('consultant_rate_history').insert({
    active_consultant_id: data.id,
    date: parsed.data.start_date,
    rate: parsed.data.hourly_rate,
    reason: 'Startdatum',
  });

  await logAction({
    action: 'active_consultant.created',
    entityType: 'active_consultant',
    entityId: data.id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/consultants');
  return { data };
}
```

- [ ] **Step 4b: Create `src/features/consultants/actions/update-active-consultant.ts`**

Standard update pattern: `requirePermission('consultants.write')` → Zod parse → `supabase.from('active_consultants').update(parsed).eq('id', id)` → `logAction` → `revalidatePath('/admin/consultants')`.

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { activeConsultantFormSchema, type ActiveConsultantFormValues } from '../types';

export async function updateActiveConsultant(id: string, values: ActiveConsultantFormValues) {
  await requirePermission('consultants.write');

  const parsed = activeConsultantFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('active_consultants')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'active_consultant.updated',
    entityType: 'active_consultant',
    entityId: id,
    metadata: { name: `${parsed.data.first_name} ${parsed.data.last_name}` },
  });

  revalidatePath('/admin/consultants');
  return { success: true };
}
```

- [ ] **Step 5: Create `src/features/consultants/actions/stop-consultant.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function stopConsultant(id: string, stopDate: string, reason: string) {
  await requirePermission('consultants.write');

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('active_consultants')
    .update({
      is_stopped: true,
      stop_date: stopDate,
      stop_reason: reason,
      is_active: false,
    })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'active_consultant.stopped',
    entityType: 'active_consultant',
    entityId: id,
    metadata: { stop_date: stopDate, reason },
  });

  revalidatePath('/admin/consultants');
  return { success: true };
}
```

- [ ] **Step 6: Create `src/features/consultants/actions/extend-consultant.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function extendConsultant(id: string, newEndDate: string, notes?: string) {
  await requirePermission('consultants.write');

  const supabase = await createServerClient();

  // Create extension record
  const { error: extError } = await supabase
    .from('consultant_extensions')
    .insert({ active_consultant_id: id, new_end_date: newEndDate, notes });

  if (extError) {
    return { error: extError.message };
  }

  // Update the consultant's end_date
  const { error } = await supabase
    .from('active_consultants')
    .update({ end_date: newEndDate })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'active_consultant.extended',
    entityType: 'active_consultant',
    entityId: id,
    metadata: { new_end_date: newEndDate },
  });

  revalidatePath('/admin/consultants');
  return { success: true };
}
```

- [ ] **Step 7: Create `src/features/consultants/actions/add-rate-change.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

export async function addRateChange(
  consultantId: string,
  date: string,
  rate: number,
  reason: string,
  notes?: string,
) {
  await requirePermission('consultants.write');

  const supabase = await createServerClient();

  const { error: histError } = await supabase
    .from('consultant_rate_history')
    .insert({
      active_consultant_id: consultantId,
      date,
      rate,
      reason,
      notes,
    });

  if (histError) {
    return { error: histError.message };
  }

  // Update current rate on consultant
  const { error } = await supabase
    .from('active_consultants')
    .update({ hourly_rate: rate })
    .eq('id', consultantId);

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'active_consultant.rate_changed',
    entityType: 'active_consultant',
    entityId: consultantId,
    metadata: { rate, reason },
  });

  revalidatePath('/admin/consultants');
  return { success: true };
}
```

---

## Task 7: Contracts Feature — Types, Queries, Actions

**Files:**
- Create: `src/features/contracts/types.ts`
- Create: `src/features/contracts/queries/get-contract.ts`
- Create: `src/features/contracts/queries/get-hourly-rates.ts`
- Create: `src/features/contracts/queries/get-sla-rates.ts`
- Create: `src/features/contracts/actions/upsert-contract.ts`
- Create: `src/features/contracts/actions/upsert-hourly-rates.ts`
- Create: `src/features/contracts/actions/upsert-sla-rates.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/contracts/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

export type Contract = Database['public']['Tables']['contracts']['Row'];
export type HourlyRate = Database['public']['Tables']['hourly_rates']['Row'];
export type SlaRate = Database['public']['Tables']['sla_rates']['Row'];
export type SlaTool = Database['public']['Tables']['sla_tools']['Row'];

export type SlaRateWithTools = SlaRate & {
  tools: SlaTool[];
};

export const contractFormSchema = z.object({
  has_framework_contract: z.boolean(),
  framework_pdf_url: z.string().optional().nullable(),
  framework_start: z.string().optional().nullable(),
  framework_end: z.string().optional().nullable(),
  framework_indefinite: z.boolean().optional(),
  has_service_contract: z.boolean(),
  service_pdf_url: z.string().optional().nullable(),
  service_start: z.string().optional().nullable(),
  service_end: z.string().optional().nullable(),
  service_indefinite: z.boolean().optional(),
  purchase_orders_url: z.string().optional().nullable(),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;

export const hourlyRateEntrySchema = z.object({
  role: z.string().min(1),
  rate: z.coerce.number().min(0),
});

export const slaRateFormSchema = z.object({
  fixed_monthly_rate: z.coerce.number().min(0),
  support_hourly_rate: z.coerce.number().min(0),
  tools: z.array(z.object({
    tool_name: z.string().min(1),
    monthly_price: z.coerce.number().min(0),
  })),
});

export type SlaRateFormValues = z.infer<typeof slaRateFormSchema>;
```

- [ ] **Step 2: Create `src/features/contracts/queries/get-contract.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { Contract } from '../types';

export const getContract = cache(
  async (accountId: string): Promise<Contract | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (error) {
      return null;
    }

    return data;
  },
);
```

- [ ] **Step 3: Create `src/features/contracts/queries/get-hourly-rates.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { HourlyRate } from '../types';

/**
 * Get hourly rates for an account across a 3-year sliding window.
 */
export const getHourlyRates = cache(
  async (accountId: string, years?: number[]): Promise<HourlyRate[]> => {
    const supabase = await createServerClient();
    const currentYear = new Date().getFullYear();
    const targetYears = years ?? [currentYear, currentYear - 1, currentYear - 2];

    const { data, error } = await supabase
      .from('hourly_rates')
      .select('*')
      .eq('account_id', accountId)
      .in('year', targetYears)
      .order('year', { ascending: false })
      .order('role', { ascending: true });

    if (error) {
      console.error('Failed to fetch hourly rates:', error.message);
      return [];
    }

    return data ?? [];
  },
);
```

- [ ] **Step 4: Create `src/features/contracts/queries/get-sla-rates.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { SlaRateWithTools } from '../types';

export const getSlaRates = cache(
  async (accountId: string, years?: number[]): Promise<SlaRateWithTools[]> => {
    const supabase = await createServerClient();
    const currentYear = new Date().getFullYear();
    const targetYears = years ?? [currentYear, currentYear - 1, currentYear - 2];

    const { data, error } = await supabase
      .from('sla_rates')
      .select(`
        *,
        tools:sla_tools(*)
      `)
      .eq('account_id', accountId)
      .in('year', targetYears)
      .order('year', { ascending: false });

    if (error) {
      console.error('Failed to fetch SLA rates:', error.message);
      return [];
    }

    return (data as unknown as SlaRateWithTools[]) ?? [];
  },
);
```

- [ ] **Step 5: Create `src/features/contracts/actions/upsert-contract.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { contractFormSchema, type ContractFormValues } from '../types';

export async function upsertContract(accountId: string, values: ContractFormValues) {
  await requirePermission('contracts.write');

  const parsed = contractFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('contracts')
    .upsert(
      { account_id: accountId, ...parsed.data },
      { onConflict: 'account_id' },
    );

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'contract.upserted',
    entityType: 'contract',
    metadata: { account_id: accountId },
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
```

- [ ] **Step 6: Create `src/features/contracts/actions/upsert-hourly-rates.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

type RateEntry = { role: string; rate: number };

export async function upsertHourlyRates(accountId: string, year: number, rates: RateEntry[]) {
  await requirePermission('contracts.write');

  const supabase = await createServerClient();

  // Delete existing rates for this account/year, then insert fresh
  await supabase
    .from('hourly_rates')
    .delete()
    .eq('account_id', accountId)
    .eq('year', year);

  if (rates.length > 0) {
    const rows = rates
      .filter((r) => r.rate > 0)
      .map((r) => ({ account_id: accountId, year, role: r.role, rate: r.rate }));

    const { error } = await supabase.from('hourly_rates').insert(rows);
    if (error) {
      return { error: error.message };
    }
  }

  await logAction({
    action: 'hourly_rates.upserted',
    entityType: 'hourly_rates',
    metadata: { account_id: accountId, year, count: rates.length },
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
```

- [ ] **Step 7: Create `src/features/contracts/actions/upsert-sla-rates.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import type { SlaRateFormValues } from '../types';

export async function upsertSlaRates(accountId: string, year: number, values: SlaRateFormValues) {
  await requirePermission('contracts.write');

  const supabase = await createServerClient();

  // Upsert SLA rate
  const { data: slaRate, error: slaError } = await supabase
    .from('sla_rates')
    .upsert(
      {
        account_id: accountId,
        year,
        fixed_monthly_rate: values.fixed_monthly_rate,
        support_hourly_rate: values.support_hourly_rate,
      },
      { onConflict: 'account_id,year' },
    )
    .select('id')
    .single();

  if (slaError) {
    return { error: slaError.message };
  }

  // Sync tools: delete all, re-insert
  await supabase.from('sla_tools').delete().eq('sla_rate_id', slaRate.id);

  if (values.tools.length > 0) {
    const toolRows = values.tools.map((t) => ({
      sla_rate_id: slaRate.id,
      tool_name: t.tool_name,
      monthly_price: t.monthly_price,
    }));
    await supabase.from('sla_tools').insert(toolRows);
  }

  await logAction({
    action: 'sla_rates.upserted',
    entityType: 'sla_rates',
    metadata: { account_id: accountId, year },
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
```

---

## Task 8: Indexation Feature — Types, Queries, Actions

**Files:**
- Create: `src/features/indexation/types.ts`
- Create: `src/features/indexation/queries/get-indexation-indices.ts`
- Create: `src/features/indexation/queries/get-indexation-draft.ts`
- Create: `src/features/indexation/queries/get-indexation-history.ts`
- Create: `src/features/indexation/actions/simulate-indexation.ts`
- Create: `src/features/indexation/actions/save-indexation-draft.ts`
- Create: `src/features/indexation/actions/approve-indexation.ts`

**Steps:**

- [ ] **Step 1: Create `src/features/indexation/types.ts`**

```ts
import { z } from 'zod';
import type { Database } from '@/types/database';

export type IndexationIndex = Database['public']['Tables']['indexation_indices']['Row'];
export type IndexationDraft = Database['public']['Tables']['indexation_drafts']['Row'];
export type IndexationDraftRate = Database['public']['Tables']['indexation_draft_rates']['Row'];
export type IndexationDraftSla = Database['public']['Tables']['indexation_draft_sla']['Row'];
export type IndexationHistory = Database['public']['Tables']['indexation_history']['Row'];

export type IndexationDraftFull = IndexationDraft & {
  rates: IndexationDraftRate[];
  sla: IndexationDraftSla | null;
  sla_tools: Database['public']['Tables']['indexation_draft_sla_tools']['Row'][];
};

export type SimulationResult = {
  rates: { role: string; current_rate: number; proposed_rate: number }[];
  sla: {
    fixed_monthly_rate: number;
    support_hourly_rate: number;
    proposed_fixed: number;
    proposed_support: number;
  } | null;
};

export const indexationConfigSchema = z.object({
  target_year: z.coerce.number(),
  base_year: z.coerce.number(),
  percentage: z.coerce.number().min(0).max(100),
});

export const indexationDraftSchema = z.object({
  target_year: z.coerce.number(),
  base_year: z.coerce.number(),
  percentage: z.coerce.number(),
  info: z.string().optional(),
  adjustment_pct_hourly: z.coerce.number().optional().nullable(),
  adjustment_pct_sla: z.coerce.number().optional().nullable(),
  rates: z.array(z.object({
    role: z.string(),
    current_rate: z.coerce.number(),
    proposed_rate: z.coerce.number(),
  })),
  sla: z.object({
    fixed_monthly_rate: z.coerce.number(),
    support_hourly_rate: z.coerce.number(),
  }).optional().nullable(),
  sla_tools: z.array(z.object({
    tool_name: z.string(),
    proposed_price: z.coerce.number(),
  })).optional(),
});

export type IndexationDraftValues = z.infer<typeof indexationDraftSchema>;

export type IndexationConfig = Database['public']['Tables']['indexation_config']['Row'];

export const indexationConfigFormSchema = z.object({
  account_id: z.string().uuid(),
  use_cpi: z.boolean().default(true),
  cpi_index_id: z.string().uuid().optional().nullable(),
  custom_percentage: z.coerce.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type IndexationConfigFormValues = z.infer<typeof indexationConfigFormSchema>;
```

- [ ] **Step 1b: Create `src/features/indexation/queries/get-indexation-config.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { IndexationConfig } from '../types';

export const getIndexationConfig = cache(
  async (accountId: string): Promise<IndexationConfig | null> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('indexation_config')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch indexation config:', error.message);
      return null;
    }

    return data;
  },
);
```

- [ ] **Step 1c: Create `src/features/indexation/actions/upsert-indexation-config.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { indexationConfigFormSchema, type IndexationConfigFormValues } from '../types';

export async function upsertIndexationConfig(values: IndexationConfigFormValues) {
  await requirePermission('consultants.write');

  const parsed = indexationConfigFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from('indexation_config')
    .upsert(parsed.data, { onConflict: 'account_id' });

  if (error) {
    return { error: error.message };
  }

  await logAction({
    action: 'indexation_config.upserted',
    entityType: 'indexation_config',
    entityId: parsed.data.account_id,
  });

  revalidatePath('/admin/consultants');
  return { success: true };
}
```

- [ ] **Step 2: Create `src/features/indexation/queries/get-indexation-indices.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { IndexationIndex } from '../types';

export const getIndexationIndices = cache(
  async (): Promise<IndexationIndex[]> => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('indexation_indices')
      .select('*')
      .order('name');

    if (error) {
      console.error('Failed to fetch indexation indices:', error.message);
      return [];
    }

    return data ?? [];
  },
);
```

- [ ] **Step 3: Create `src/features/indexation/queries/get-indexation-draft.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import type { IndexationDraftFull } from '../types';

export const getIndexationDraft = cache(
  async (accountId: string): Promise<IndexationDraftFull | null> => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('indexation_drafts')
      .select(`
        *,
        rates:indexation_draft_rates(*),
        sla:indexation_draft_sla(*),
        sla_tools:indexation_draft_sla_tools(*)
      `)
      .eq('account_id', accountId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch indexation draft:', error.message);
      return null;
    }

    return data as unknown as IndexationDraftFull | null;
  },
);
```

- [ ] **Step 4: Create `src/features/indexation/queries/get-indexation-history.ts`**

```ts
import { cache } from 'react';
import { createServerClient } from '@/lib/supabase/server';

export const getIndexationHistory = cache(
  async (accountId: string) => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('indexation_history')
      .select(`
        *,
        rates:indexation_history_rates(*),
        sla:indexation_history_sla(*),
        sla_tools:indexation_history_sla_tools(*)
      `)
      .eq('account_id', accountId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to fetch indexation history:', error.message);
      return [];
    }

    return data ?? [];
  },
);
```

- [ ] **Step 5: Create `src/features/indexation/actions/simulate-indexation.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import type { SimulationResult } from '../types';

/**
 * Step 2 of the indexeringssimulator: compute projected rates.
 * Read-only — does not write anything to the database.
 */
export async function simulateIndexation(
  accountId: string,
  baseYear: number,
  percentage: number,
): Promise<{ data?: SimulationResult; error?: string }> {
  await requirePermission('indexation.read');

  const supabase = await createServerClient();

  // Get current hourly rates for base year
  const { data: hourlyRates } = await supabase
    .from('hourly_rates')
    .select('role, rate')
    .eq('account_id', accountId)
    .eq('year', baseYear);

  const rates = (hourlyRates ?? []).map((r) => ({
    role: r.role,
    current_rate: Number(r.rate),
    proposed_rate: Math.round(Number(r.rate) * (1 + percentage / 100)),
  }));

  // Get current SLA rates for base year
  const { data: slaRate } = await supabase
    .from('sla_rates')
    .select('fixed_monthly_rate, support_hourly_rate')
    .eq('account_id', accountId)
    .eq('year', baseYear)
    .maybeSingle();

  let sla: SimulationResult['sla'] = null;
  if (slaRate) {
    sla = {
      fixed_monthly_rate: Number(slaRate.fixed_monthly_rate),
      support_hourly_rate: Number(slaRate.support_hourly_rate),
      proposed_fixed: Math.round(Number(slaRate.fixed_monthly_rate) * (1 + percentage / 100)),
      proposed_support: Math.round(Number(slaRate.support_hourly_rate) * (1 + percentage / 100)),
    };
  }

  return { data: { rates, sla } };
}
```

- [ ] **Step 6: Create `src/features/indexation/actions/save-indexation-draft.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';
import { indexationDraftSchema, type IndexationDraftValues } from '../types';

/**
 * Step 3 of the indexeringssimulator: save/update a draft.
 */
export async function saveIndexationDraft(accountId: string, values: IndexationDraftValues) {
  const { userId } = await requirePermission('indexation.write');

  const parsed = indexationDraftSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerClient();

  // Delete existing draft for this account (only one active draft at a time)
  await supabase
    .from('indexation_drafts')
    .delete()
    .eq('account_id', accountId)
    .eq('status', 'draft');

  // Create new draft
  const { data: draft, error: draftError } = await supabase
    .from('indexation_drafts')
    .insert({
      account_id: accountId,
      target_year: parsed.data.target_year,
      base_year: parsed.data.base_year,
      percentage: parsed.data.percentage,
      status: 'draft',
      info: parsed.data.info,
      adjustment_pct_hourly: parsed.data.adjustment_pct_hourly,
      adjustment_pct_sla: parsed.data.adjustment_pct_sla,
      created_by: userId,
    })
    .select('id')
    .single();

  if (draftError) {
    return { error: draftError.message };
  }

  // Insert draft rates
  if (parsed.data.rates.length > 0) {
    await supabase.from('indexation_draft_rates').insert(
      parsed.data.rates.map((r) => ({ draft_id: draft.id, ...r })),
    );
  }

  // Insert draft SLA
  if (parsed.data.sla) {
    await supabase.from('indexation_draft_sla').insert({
      draft_id: draft.id,
      ...parsed.data.sla,
    });
  }

  // Insert draft SLA tools
  if (parsed.data.sla_tools && parsed.data.sla_tools.length > 0) {
    await supabase.from('indexation_draft_sla_tools').insert(
      parsed.data.sla_tools.map((t) => ({ draft_id: draft.id, ...t })),
    );
  }

  await logAction({
    action: 'indexation_draft.saved',
    entityType: 'indexation_draft',
    entityId: draft.id,
    metadata: { account_id: accountId, target_year: parsed.data.target_year },
  });

  revalidatePath('/admin/accounts');
  return { data: draft };
}
```

- [ ] **Step 7: Create `src/features/indexation/actions/approve-indexation.ts`**

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/require-permission';
import { logAction } from '@/features/audit/actions/log-action';
import { revalidatePath } from 'next/cache';

/**
 * Step 4 of the indexeringssimulator: approve a draft.
 * Writes new hourly_rates + sla_rates, creates indexation_history, deletes draft.
 * Requires indexation.approve permission (admin/sales_manager only).
 */
export async function approveIndexation(draftId: string) {
  const { userId } = await requirePermission('indexation.approve');

  const supabase = await createServerClient();

  // Fetch the full draft
  const { data: draft, error: fetchError } = await supabase
    .from('indexation_drafts')
    .select(`
      *,
      rates:indexation_draft_rates(*),
      sla:indexation_draft_sla(*),
      sla_tools:indexation_draft_sla_tools(*)
    `)
    .eq('id', draftId)
    .single();

  if (fetchError || !draft) {
    return { error: 'Draft not found' };
  }

  if (draft.status !== 'draft') {
    return { error: 'Draft is not in draft status' };
  }

  const accountId = draft.account_id;
  const targetYear = draft.target_year;

  // 1. Write new hourly rates
  if (draft.rates && draft.rates.length > 0) {
    // Delete existing for target year
    await supabase
      .from('hourly_rates')
      .delete()
      .eq('account_id', accountId)
      .eq('year', targetYear);

    await supabase.from('hourly_rates').insert(
      draft.rates.map((r: any) => ({
        account_id: accountId,
        year: targetYear,
        role: r.role,
        rate: r.proposed_rate,
      })),
    );
  }

  // 2. Write new SLA rates
  if (draft.sla) {
    const sla = Array.isArray(draft.sla) ? draft.sla[0] : draft.sla;
    if (sla) {
      const { data: slaRate } = await supabase
        .from('sla_rates')
        .upsert(
          {
            account_id: accountId,
            year: targetYear,
            fixed_monthly_rate: sla.fixed_monthly_rate,
            support_hourly_rate: sla.support_hourly_rate,
          },
          { onConflict: 'account_id,year' },
        )
        .select('id')
        .single();

      // Write SLA tools
      if (slaRate && draft.sla_tools && draft.sla_tools.length > 0) {
        await supabase.from('sla_tools').delete().eq('sla_rate_id', slaRate.id);
        await supabase.from('sla_tools').insert(
          draft.sla_tools.map((t: any) => ({
            sla_rate_id: slaRate.id,
            tool_name: t.tool_name,
            monthly_price: t.proposed_price,
          })),
        );
      }
    }
  }

  // 3. Create indexation history record
  const { data: history } = await supabase
    .from('indexation_history')
    .insert({
      account_id: accountId,
      target_year: targetYear,
      percentage: draft.percentage,
      scenario: `${draft.percentage}%`,
      info: draft.info,
      adjustment_pct_hourly: draft.adjustment_pct_hourly,
      adjustment_pct_sla: draft.adjustment_pct_sla,
    })
    .select('id')
    .single();

  if (history) {
    // History rates
    if (draft.rates && draft.rates.length > 0) {
      await supabase.from('indexation_history_rates').insert(
        draft.rates.map((r: any) => ({
          history_id: history.id,
          role: r.role,
          rate: r.proposed_rate,
        })),
      );
    }

    // History SLA
    if (draft.sla) {
      const sla = Array.isArray(draft.sla) ? draft.sla[0] : draft.sla;
      if (sla) {
        await supabase.from('indexation_history_sla').insert({
          history_id: history.id,
          fixed_monthly_rate: sla.fixed_monthly_rate,
          support_hourly_rate: sla.support_hourly_rate,
        });
      }
    }

    if (draft.sla_tools && draft.sla_tools.length > 0) {
      await supabase.from('indexation_history_sla_tools').insert(
        draft.sla_tools.map((t: any) => ({
          history_id: history.id,
          tool_name: t.tool_name,
          price: t.proposed_price,
        })),
      );
    }
  }

  // 4. Delete the draft
  await supabase.from('indexation_drafts').delete().eq('id', draftId);

  await logAction({
    action: 'indexation.approved',
    entityType: 'indexation_history',
    entityId: history?.id,
    metadata: { account_id: accountId, target_year: targetYear, percentage: draft.percentage },
  });

  revalidatePath('/admin/accounts');
  return { success: true };
}
```

---

## Task 9: Bench Page and Consultants Page

**Files:**
- Create: `src/app/admin/bench/page.tsx`
- Create: `src/app/admin/bench/loading.tsx`
- Create: `src/app/admin/consultants/page.tsx`
- Create: `src/app/admin/consultants/loading.tsx`
- Create: `src/features/bench/components/bench-grid.tsx`
- Create: `src/features/consultants/components/consultant-list.tsx`

**Steps:**

- [ ] **Step 1: Create loading skeletons**

`src/app/admin/bench/loading.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function BenchLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
```

`src/app/admin/consultants/loading.tsx`:
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function ConsultantsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Create `src/features/bench/components/bench-grid.tsx`**

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BenchConsultantWithLanguages } from '../types';

type Props = {
  consultants: BenchConsultantWithLanguages[];
};

const priorityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-100 text-gray-800',
};

export function BenchGrid({ consultants }: Props) {
  if (consultants.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Geen bench consultants.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {consultants.map((c) => (
        <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {c.first_name} {c.last_name}
              </CardTitle>
              <Badge className={priorityColors[c.priority] ?? ''}>{c.priority}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{c.city}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {c.roles && c.roles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {c.roles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                ))}
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {c.min_hourly_rate && c.max_hourly_rate
                  ? `€${c.min_hourly_rate} - €${c.max_hourly_rate}/u`
                  : ''}
              </span>
              <span>
                {c.available_date
                  ? `Beschikbaar: ${new Date(c.available_date).toLocaleDateString('nl-BE')}`
                  : ''}
              </span>
            </div>
            {c.languages && c.languages.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {c.languages.map((l) => (
                  <span key={l.id} className="text-[10px] text-muted-foreground">
                    {l.language} ({l.level})
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create page files**

`src/app/admin/bench/page.tsx`:
```tsx
import { PageHeader } from '@/components/admin/page-header';
import { getBenchConsultants } from '@/features/bench/queries/get-bench-consultants';
import { BenchGrid } from '@/features/bench/components/bench-grid';

export default async function BenchPage() {
  const consultants = await getBenchConsultants();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bench"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bench' },
        ]}
      />
      <BenchGrid consultants={consultants} />
    </div>
  );
}
```

`src/app/admin/consultants/page.tsx`:
```tsx
import { PageHeader } from '@/components/admin/page-header';
import { getActiveConsultants } from '@/features/consultants/queries/get-active-consultants';
import { ConsultantListView } from '@/features/consultants/components/consultant-list';

export default async function ConsultantsPage() {
  const consultants = await getActiveConsultants();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actieve Consultants"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Consultants' },
        ]}
      />
      <ConsultantListView consultants={consultants} />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/features/consultants/components/consultant-list.tsx`**

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getContractStatus, getCurrentRate, type ActiveConsultantWithDetails, type ContractStatus } from '../types';

type Props = {
  consultants: ActiveConsultantWithDetails[];
};

const statusColors: Record<ContractStatus, string> = {
  actief: 'bg-green-100 text-green-800',
  waarschuwing: 'bg-yellow-100 text-yellow-800',
  kritiek: 'bg-red-100 text-red-800',
  verlopen: 'bg-gray-100 text-gray-800',
  onbepaald: 'bg-blue-100 text-blue-800',
  stopgezet: 'bg-gray-300 text-gray-600',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function ConsultantListView({ consultants }: Props) {
  if (consultants.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Geen actieve consultants.</p>;
  }

  return (
    <div className="space-y-3">
      {consultants.map((c) => {
        const status = getContractStatus(c);
        const rate = getCurrentRate(c);
        return (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium text-sm">{c.first_name} {c.last_name}</div>
                <div className="text-xs text-muted-foreground">{c.role} - {c.city}</div>
              </div>
              <div className="text-sm">{c.account?.name ?? c.client_name ?? ''}</div>
              <div className="text-sm font-medium">{fmt(rate)}/u</div>
              <Badge className={statusColors[status]}>{status}</Badge>
              <div className="text-xs text-muted-foreground">
                {c.start_date ? new Date(c.start_date).toLocaleDateString('nl-BE') : ''} -
                {c.is_indefinite ? ' onbepaald' : c.end_date ? ` ${new Date(c.end_date).toLocaleDateString('nl-BE')}` : ''}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

---

## Task 10: Seed Data — Consultancy

**Files:**
- Create: `supabase/migrations/00034_seed_consultancy.sql`

**Steps:**

- [ ] **Step 1: Create seed migration**

```sql
-- ============================================================================
-- Seed: Consultancy data (bench, active consultants, contracts, rates)
-- ============================================================================

-- ── Bench Consultants ───────────────────────────────────────────────────────
INSERT INTO bench_consultants (id, first_name, last_name, city, priority, available_date, min_hourly_rate, max_hourly_rate, roles, technologies, description, is_archived) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Sander', 'Vermeersch', 'Gent', 'High', '2026-03-01', 85, 110, ARRAY['Dev Senior', 'Tech Lead'], ARRAY['PHP', 'Magento', 'React', 'Docker'], 'Fullstack developer met 8 jaar ervaring.', false),
  ('b0000000-0000-0000-0000-000000000002', 'Nathalie', 'Claeys', 'Antwerpen', 'High', '2026-02-20', 75, 95, ARRAY['Analist', 'PO'], ARRAY['Jira', 'Confluence', 'Akeneo'], 'Ervaren business analist.', false),
  ('b0000000-0000-0000-0000-000000000003', 'Robin', 'Janssens', 'Brussel', 'Low', '2026-04-15', 65, 80, ARRAY['Dev Medior'], ARRAY['Vue.js', 'Node.js', 'MySQL'], 'Frontend developer.', false);

INSERT INTO bench_consultant_languages (bench_consultant_id, language, level) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Nederlands', 'Moedertaal'),
  ('b0000000-0000-0000-0000-000000000001', 'Engels', 'Vloeiend'),
  ('b0000000-0000-0000-0000-000000000002', 'Nederlands', 'Moedertaal'),
  ('b0000000-0000-0000-0000-000000000002', 'Engels', 'Vloeiend'),
  ('b0000000-0000-0000-0000-000000000003', 'Nederlands', 'Moedertaal');

-- ── Active Consultants ──────────────────────────────────────────────────────
INSERT INTO active_consultants (id, account_id, first_name, last_name, role, city, is_active, start_date, end_date, is_indefinite, hourly_rate, notice_period_days, notes, is_stopped) VALUES
  ('cs000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Kevin', 'Martens', 'Dev Senior', 'Brussel', true, '2023-06-01', '2026-05-31', false, 122, 30, 'Kevin is een sterke developer.', false),
  ('cs000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Elien', 'De Wolf', 'Analist', 'Antwerpen', true, '2024-09-01', null, true, 108, 14, '', false),
  ('cs000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Yasmine', 'El Amrani', 'Dev Medior', 'Antwerpen', true, '2024-03-01', '2025-12-31', false, 98, 30, '', false);

-- ── Rate History ────────────────────────────────────────────────────────────
INSERT INTO consultant_rate_history (active_consultant_id, date, rate, reason) VALUES
  ('cs000000-0000-0000-0000-000000000001', '2023-06-01', 108, 'Startdatum'),
  ('cs000000-0000-0000-0000-000000000001', '2024-01-01', 115, 'Jaarlijkse indexering'),
  ('cs000000-0000-0000-0000-000000000001', '2025-01-01', 122, 'Jaarlijkse indexering'),
  ('cs000000-0000-0000-0000-000000000002', '2024-09-01', 108, 'Startdatum'),
  ('cs000000-0000-0000-0000-000000000003', '2024-03-01', 98, 'Startdatum');

-- ── Contracts ───────────────────────────────────────────────────────────────
INSERT INTO contracts (account_id, has_framework_contract, framework_pdf_url, framework_start, framework_end, framework_indefinite, has_service_contract, service_pdf_url, service_start, service_end, service_indefinite, purchase_orders_url) VALUES
  ('a0000000-0000-0000-0000-000000000001', true, 'raamcontract_techvision_2024.pdf', '2024-01-01', '2026-12-31', false, true, 'sla_techvision_2024.pdf', '2024-03-01', null, true, 'https://confluence.phpro.be/display/TV/Bestelbonnen'),
  ('a0000000-0000-0000-0000-000000000003', true, 'raamcontract_medicare_2025.pdf', '2025-01-01', null, true, false, null, null, null, false, 'https://confluence.phpro.be/display/MC/Bestelbonnen');

-- ── Hourly Rates (TechVision) ───────────────────────────────────────────────
INSERT INTO hourly_rates (account_id, year, role, rate) VALUES
  ('a0000000-0000-0000-0000-000000000001', 2025, 'PM', 145), ('a0000000-0000-0000-0000-000000000001', 2025, 'PO', 138), ('a0000000-0000-0000-0000-000000000001', 2025, 'Architect', 155), ('a0000000-0000-0000-0000-000000000001', 2025, 'Tech Lead', 148), ('a0000000-0000-0000-0000-000000000001', 2025, 'Dev Senior', 128), ('a0000000-0000-0000-0000-000000000001', 2025, 'Dev Medior', 108), ('a0000000-0000-0000-0000-000000000001', 2025, 'Dev Junior', 88), ('a0000000-0000-0000-0000-000000000001', 2025, 'Analist', 118), ('a0000000-0000-0000-0000-000000000001', 2025, 'UX Designer', 112), ('a0000000-0000-0000-0000-000000000001', 2025, 'QA Engineer', 98), ('a0000000-0000-0000-0000-000000000001', 2025, 'DevOps', 118), ('a0000000-0000-0000-0000-000000000001', 2025, 'Scrum Master', 125),
  ('a0000000-0000-0000-0000-000000000001', 2024, 'PM', 138), ('a0000000-0000-0000-0000-000000000001', 2024, 'PO', 130), ('a0000000-0000-0000-0000-000000000001', 2024, 'Architect', 148), ('a0000000-0000-0000-0000-000000000001', 2024, 'Tech Lead', 140), ('a0000000-0000-0000-0000-000000000001', 2024, 'Dev Senior', 122), ('a0000000-0000-0000-0000-000000000001', 2024, 'Dev Medior', 102), ('a0000000-0000-0000-0000-000000000001', 2024, 'Dev Junior', 82), ('a0000000-0000-0000-0000-000000000001', 2024, 'Analist', 112), ('a0000000-0000-0000-0000-000000000001', 2024, 'UX Designer', 105), ('a0000000-0000-0000-0000-000000000001', 2024, 'QA Engineer', 92), ('a0000000-0000-0000-0000-000000000001', 2024, 'DevOps', 112), ('a0000000-0000-0000-0000-000000000001', 2024, 'Scrum Master', 118),
  ('a0000000-0000-0000-0000-000000000001', 2023, 'PM', 130), ('a0000000-0000-0000-0000-000000000001', 2023, 'PO', 122), ('a0000000-0000-0000-0000-000000000001', 2023, 'Architect', 140), ('a0000000-0000-0000-0000-000000000001', 2023, 'Tech Lead', 132), ('a0000000-0000-0000-0000-000000000001', 2023, 'Dev Senior', 115), ('a0000000-0000-0000-0000-000000000001', 2023, 'Dev Medior', 96), ('a0000000-0000-0000-0000-000000000001', 2023, 'Dev Junior', 76), ('a0000000-0000-0000-0000-000000000001', 2023, 'Analist', 105), ('a0000000-0000-0000-0000-000000000001', 2023, 'UX Designer', 98), ('a0000000-0000-0000-0000-000000000001', 2023, 'QA Engineer', 86), ('a0000000-0000-0000-0000-000000000001', 2023, 'DevOps', 105), ('a0000000-0000-0000-0000-000000000001', 2023, 'Scrum Master', 110);

-- ── Hourly Rates (MediCare Plus) ────────────────────────────────────────────
INSERT INTO hourly_rates (account_id, year, role, rate) VALUES
  ('a0000000-0000-0000-0000-000000000003', 2025, 'PM', 132), ('a0000000-0000-0000-0000-000000000003', 2025, 'PO', 125), ('a0000000-0000-0000-0000-000000000003', 2025, 'Architect', 142), ('a0000000-0000-0000-0000-000000000003', 2025, 'Tech Lead', 135), ('a0000000-0000-0000-0000-000000000003', 2025, 'Dev Senior', 115), ('a0000000-0000-0000-0000-000000000003', 2025, 'Dev Medior', 98), ('a0000000-0000-0000-0000-000000000003', 2025, 'Dev Junior', 78), ('a0000000-0000-0000-0000-000000000003', 2025, 'Analist', 108), ('a0000000-0000-0000-0000-000000000003', 2025, 'UX Designer', 102), ('a0000000-0000-0000-0000-000000000003', 2025, 'QA Engineer', 88), ('a0000000-0000-0000-0000-000000000003', 2025, 'DevOps', 108), ('a0000000-0000-0000-0000-000000000003', 2025, 'Scrum Master', 115),
  ('a0000000-0000-0000-0000-000000000003', 2024, 'PM', 125), ('a0000000-0000-0000-0000-000000000003', 2024, 'PO', 118), ('a0000000-0000-0000-0000-000000000003', 2024, 'Architect', 135), ('a0000000-0000-0000-0000-000000000003', 2024, 'Tech Lead', 128), ('a0000000-0000-0000-0000-000000000003', 2024, 'Dev Senior', 108), ('a0000000-0000-0000-0000-000000000003', 2024, 'Dev Medior', 92), ('a0000000-0000-0000-0000-000000000003', 2024, 'Dev Junior', 72), ('a0000000-0000-0000-0000-000000000003', 2024, 'Analist', 102), ('a0000000-0000-0000-0000-000000000003', 2024, 'UX Designer', 95), ('a0000000-0000-0000-0000-000000000003', 2024, 'QA Engineer', 82), ('a0000000-0000-0000-0000-000000000003', 2024, 'DevOps', 102), ('a0000000-0000-0000-0000-000000000003', 2024, 'Scrum Master', 108),
  ('a0000000-0000-0000-0000-000000000003', 2023, 'PM', 118), ('a0000000-0000-0000-0000-000000000003', 2023, 'PO', 110), ('a0000000-0000-0000-0000-000000000003', 2023, 'Architect', 126), ('a0000000-0000-0000-0000-000000000003', 2023, 'Tech Lead', 120), ('a0000000-0000-0000-0000-000000000003', 2023, 'Dev Senior', 100), ('a0000000-0000-0000-0000-000000000003', 2023, 'Dev Medior', 85), ('a0000000-0000-0000-0000-000000000003', 2023, 'Dev Junior', 65), ('a0000000-0000-0000-0000-000000000003', 2023, 'Analist', 95), ('a0000000-0000-0000-0000-000000000003', 2023, 'UX Designer', 88), ('a0000000-0000-0000-0000-000000000003', 2023, 'QA Engineer', 76), ('a0000000-0000-0000-0000-000000000003', 2023, 'DevOps', 95), ('a0000000-0000-0000-0000-000000000003', 2023, 'Scrum Master', 100);

-- ── SLA Rates (TechVision) ──────────────────────────────────────────────────
INSERT INTO sla_rates (id, account_id, year, fixed_monthly_rate, support_hourly_rate) VALUES
  ('sla00000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 2025, 3200, 145),
  ('sla00000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2024, 2900, 135),
  ('sla00000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 2023, 2600, 125);

INSERT INTO sla_tools (sla_rate_id, tool_name, monthly_price) VALUES
  ('sla00000-0000-0000-0000-000000000001', 'New Relic', 450),
  ('sla00000-0000-0000-0000-000000000001', 'Graylog', 180),
  ('sla00000-0000-0000-0000-000000000001', 'Pagerduty', 120),
  ('sla00000-0000-0000-0000-000000000002', 'New Relic', 420),
  ('sla00000-0000-0000-0000-000000000002', 'Graylog', 160),
  ('sla00000-0000-0000-0000-000000000003', 'New Relic', 390);
```

- [ ] **Step 2: Run the seed migration**

```bash
task db:migrate
```

---

## Task 10b: Bench and Consultant UI components (detail modals, forms)

**Files:**
- Create: `src/features/bench/components/bench-detail-modal.tsx`
- Create: `src/features/bench/components/bench-form.tsx`
- Create: `src/features/consultants/components/consultant-detail-modal.tsx`
- Create: `src/features/consultants/components/stop-consultant-modal.tsx`
- Create: `src/features/consultants/components/extend-consultant-modal.tsx`
- Create: `src/features/consultants/components/rate-change-modal.tsx`
- Create: `src/features/indexation/components/indexation-wizard.tsx`
- Create: `src/features/contracts/components/contracts-tab.tsx`

- [ ] **Step 1: Create `bench-detail-modal.tsx`**

View/edit bench consultant modal. Accepts `consultant: BenchConsultant` and `onClose`. Renders all consultant fields in read mode; includes an "Bewerken" button that switches to edit mode using `BenchForm`.

- [ ] **Step 2: Create `bench-form.tsx`**

Create/edit bench consultant form using `benchConsultantFormSchema`. Fields: `first_name`, `last_name`, `city`, `priority` (select: High/Medium/Low), `available_date`, `min_hourly_rate`, `max_hourly_rate`, `roles` (tag input), `technologies` (tag input), `description`, `cv_pdf_url`. Use `createBenchConsultant` / `updateBenchConsultant` server actions. Add "Nieuwe Consultant" button to bench page header.

- [ ] **Step 3: Create `consultant-detail-modal.tsx`**

View active consultant details modal. Accepts `consultant: ActiveConsultantWithDetails`. Shows rate history table, extensions list, contract attribution. Include buttons for: "Tarief wijzigen" → opens RateChangeModal, "Verlengd" → opens ExtendConsultantModal, "Stopzetten" → opens StopConsultantModal.

- [ ] **Step 4: Create `stop-consultant-modal.tsx`**

Stop consultant form. Accepts `consultantId: string`. Fields: `stop_date` (date), `reason` (textarea). Calls `stopConsultant` action on submit.

- [ ] **Step 5: Create `extend-consultant-modal.tsx`**

Extend consultant form. Accepts `consultantId: string`. Fields: `new_end_date` (date), `notes` (textarea). Calls `extendConsultant` action on submit.

- [ ] **Step 6: Create `rate-change-modal.tsx`**

Rate change form. Accepts `consultantId: string`. Fields: `date` (date), `rate` (number), `reason` (text), `notes` (textarea). Calls `addRateChange` action on submit.

- [ ] **Step 7: Create `indexation-wizard.tsx`**

4-step modal wizard for the indexation flow:
1. Step 1 — Select index: choose from `IndexationIndex` list or enter custom percentage
2. Step 2 — Simulate: show `SimulationResult` from `simulateIndexation` action
3. Step 3 — Review draft: edit proposed rates if needed, call `saveIndexationDraft`
4. Step 4 — Approve: confirmation screen, call `approveIndexation`

Use `useIndexationConfig` (from `getIndexationConfig`) to pre-fill Step 1.

- [ ] **Step 8: Create `contracts-tab.tsx`**

Create `src/features/contracts/components/contracts-tab.tsx`. This component:
- Accepts `accountId: string`
- Calls `getContract(accountId)`, `getHourlyRates(accountId)`, `getSlaRates(accountId)`
- Renders 3 sections: Framework Contract card, Service Contract card, Hourly Rates table per year
- Add "Bewerken" button opening `UpsertContractForm` modal (inline form, no separate file needed)
- Add "Tarieven importeren" button for future use (disabled for now)

- [ ] **Step 9: Commit**

```bash
git add src/features/bench/components/ src/features/consultants/components/ src/features/indexation/components/ src/features/contracts/components/
git commit -m "feat: add consultancy UI components (bench form, consultant modals, contracts tab, indexation wizard)"
```

---

## Task 10c: Replace account detail stubs with consultancy tabs

**Files:**
- Modify: `src/features/accounts/components/account-detail.tsx`

- [ ] **Step 1: Replace "Contracten & Tarieven" stub**

In `src/features/accounts/components/account-detail.tsx`, replace the "Contracten & Tarieven" tab stub with `<ContractsTab accountId={account.id} />`. Import from `@/features/contracts/components/contracts-tab`.

- [ ] **Step 2: Replace "Consultants" stub**

In the same file, replace the "Consultants" tab stub with `<AccountConsultantsTab accountId={account.id} />`. This component (already created in Task 9 Step 4) renders active consultants filtered by account, with each row opening `ConsultantDetailModal`.

- [ ] **Step 3: Commit**

```bash
git add src/features/accounts/components/account-detail.tsx
git commit -m "feat(accounts): replace consultancy tab stubs with ContractsTab and AccountConsultantsTab"
```

---

## Task 11: Verify and Commit

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
- `/admin/bench` — card grid with 3 bench consultants
- `/admin/consultants` — list with 3 active consultants
Verify contract queries work by running in Supabase Studio:
`SELECT * FROM contracts WHERE account_id = 'a0000000-0000-0000-0000-000000000001';`
Full Contracten tab UI verification deferred to account detail integration.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement Layer 4 — Consultancy (bench, active consultants, contracts, rates, indexation)"
```
