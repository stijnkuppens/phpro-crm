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

GRANT INSERT, UPDATE, DELETE ON public.deals TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE deals;

-- Add deal_id FK to communications (was deferred from Layer 2)
ALTER TABLE communications
  ADD CONSTRAINT communications_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

CREATE INDEX idx_communications_deal ON communications(deal_id);
