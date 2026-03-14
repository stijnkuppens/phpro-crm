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

CREATE POLICY "accounts_select" ON accounts FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "accounts_insert" ON accounts FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "accounts_update" ON accounts FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "accounts_delete" ON accounts FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
