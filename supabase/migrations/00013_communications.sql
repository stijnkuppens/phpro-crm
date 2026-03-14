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

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.communications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
