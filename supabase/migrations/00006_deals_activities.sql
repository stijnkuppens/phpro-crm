/*
  Migration: Deals & Activities

  Creates the sales pipeline execution tables:
  - deals: sales opportunities linked to accounts, contacts, pipelines
  - activities: meetings, calls, emails, tasks (type='Taak') linked to deals/accounts

  Also adds deferred FK from communications.deal_id → deals.
*/

-- ── deals ───────────────────────────────────────────────────────────────────

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
  consultant_id       uuid,  -- FK to consultants added in 00007
  consultant_role     text,
  forecast_category   text CHECK (forecast_category IN ('Commit', 'Best Case', 'Pipeline', 'Omit')),
  closed_at           timestamptz,
  closed_type         text CHECK (closed_type IN ('won', 'lost', 'longterm')),
  closed_reason       text,
  closed_notes        text,
  longterm_date       date,
  tags                text[] DEFAULT '{}',
  tarief_gewenst      numeric,
  tarief_aangeboden   numeric,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_deals_account ON deals(account_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_consultant ON deals(consultant_id);
CREATE INDEX idx_deals_closed_type ON deals(closed_type);
CREATE INDEX idx_deals_title_trgm ON deals USING gin (title gin_trgm_ops);

-- RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_select" ON deals
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "deals_insert" ON deals
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY "deals_update" ON deals
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY "deals_delete" ON deals
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON deals TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE deals;

-- Deferred FK: communications.deal_id → deals
ALTER TABLE communications
  ADD CONSTRAINT communications_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

CREATE INDEX idx_communications_deal ON communications(deal_id);

-- ── activities ──────────────────────────────────────────────────────────────

CREATE TABLE activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text NOT NULL CHECK (type IN ('Meeting', 'Demo', 'Call', 'E-mail', 'Lunch', 'Event', 'Taak')),
  subject           text NOT NULL,
  date              timestamptz NOT NULL,
  duration_minutes  int,
  account_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id           uuid REFERENCES deals(id) ON DELETE SET NULL,
  owner_id          uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes             jsonb,
  is_done           bool NOT NULL DEFAULT false,
  priority          text CHECK (priority IN ('High', 'Medium', 'Low')),
  assigned_to       uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_activities_account ON activities(account_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_owner ON activities(owner_id);
CREATE INDEX idx_activities_assigned ON activities(assigned_to);
CREATE INDEX idx_activities_date ON activities(date DESC);

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON activities
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "activities_insert" ON activities
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

CREATE POLICY "activities_update" ON activities
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

CREATE POLICY "activities_delete" ON activities
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;

