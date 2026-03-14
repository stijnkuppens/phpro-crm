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

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
