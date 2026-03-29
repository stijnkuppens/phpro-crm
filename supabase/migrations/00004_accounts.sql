/*
  Migration: Accounts and junction sub-tables
  Creates the main accounts table (companies/organizations) and six junction
  tables linking accounts to technologies, collaboration types, hosting,
  competence centers, services, and manual services.
*/

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── accounts ────────────────────────────────────────────────────────────────

CREATE TABLE public.accounts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  domain             text,
  type               text NOT NULL DEFAULT 'Prospect'
                     CHECK (type IN ('Klant', 'Prospect', 'Partner', 'Leverancier')),
  status             text NOT NULL DEFAULT 'Actief'
                     CHECK (status IN ('Actief', 'Inactief')),
  industry           text,
  size               text,
  revenue            numeric,
  phone              text,
  website            text,
  address            text,
  country            text,
  vat_number         text,
  owner_id           uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  project_manager_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  health             int DEFAULT 50 CHECK (health >= 0 AND health <= 100),
  managing_partner   text,
  account_director   text,
  team               text,
  about              text,
  logo_url           text,
  phpro_contract     text DEFAULT 'Geen'
                     CHECK (phpro_contract IN ('Geen', 'Actief', 'Inactief', 'In onderhandeling')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_accounts_owner ON public.accounts(owner_id);
CREATE INDEX idx_accounts_project_manager ON public.accounts(project_manager_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);
CREATE INDEX idx_accounts_status ON public.accounts(status);
CREATE INDEX idx_accounts_name ON public.accounts(name);
CREATE INDEX idx_accounts_name_trgm ON accounts USING gin (name gin_trgm_ops);
CREATE INDEX idx_accounts_domain_trgm ON accounts USING gin (domain gin_trgm_ops);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_select ON public.accounts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY accounts_insert ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY accounts_update ON public.accounts
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY accounts_delete ON public.accounts
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;

-- ── account_manual_services ─────────────────────────────────────────────────

CREATE TABLE public.account_manual_services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_account_manual_services_updated_at
  BEFORE UPDATE ON public.account_manual_services
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_account_manual_services_account ON public.account_manual_services(account_id);

ALTER TABLE public.account_manual_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_manual_services_select ON public.account_manual_services
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY account_manual_services_insert ON public.account_manual_services
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_manual_services_update ON public.account_manual_services
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_manual_services_delete ON public.account_manual_services
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_manual_services TO authenticated;

-- ── account_tech_stacks ─────────────────────────────────────────────────────

CREATE TABLE public.account_tech_stacks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  technology_id uuid NOT NULL REFERENCES public.ref_technologies(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_account_tech_stacks_updated_at
  BEFORE UPDATE ON public.account_tech_stacks
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_account_tech_stacks_account ON public.account_tech_stacks(account_id);
CREATE UNIQUE INDEX idx_account_tech_stacks_unique ON public.account_tech_stacks(account_id, technology_id);
CREATE INDEX idx_account_tech_stacks_technology_id ON account_tech_stacks (technology_id);

ALTER TABLE public.account_tech_stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_tech_stacks_select ON public.account_tech_stacks
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY account_tech_stacks_insert ON public.account_tech_stacks
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_tech_stacks_update ON public.account_tech_stacks
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_tech_stacks_delete ON public.account_tech_stacks
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_tech_stacks TO authenticated;

-- ── account_samenwerkingsvormen ─────────────────────────────────────────────

CREATE TABLE public.account_samenwerkingsvormen (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  collaboration_type_id uuid NOT NULL REFERENCES public.ref_collaboration_types(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_account_samenwerkingsvormen_updated_at
  BEFORE UPDATE ON public.account_samenwerkingsvormen
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_account_samenwerkingsvormen_account ON public.account_samenwerkingsvormen(account_id);
CREATE UNIQUE INDEX idx_account_samenwerkingsvormen_unique ON public.account_samenwerkingsvormen(account_id, collaboration_type_id);
CREATE INDEX idx_account_samenwerkingsvormen_collaboration_type_id ON account_samenwerkingsvormen (collaboration_type_id);

ALTER TABLE public.account_samenwerkingsvormen ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_samenwerkingsvormen_select ON public.account_samenwerkingsvormen
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY account_samenwerkingsvormen_insert ON public.account_samenwerkingsvormen
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_samenwerkingsvormen_update ON public.account_samenwerkingsvormen
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_samenwerkingsvormen_delete ON public.account_samenwerkingsvormen
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_samenwerkingsvormen TO authenticated;

-- ── account_hosting ─────────────────────────────────────────────────────────

CREATE TABLE public.account_hosting (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  provider_id    uuid NOT NULL REFERENCES public.ref_hosting_providers(id),
  environment_id uuid REFERENCES public.ref_hosting_environments(id),
  url            text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_account_hosting_updated_at
  BEFORE UPDATE ON public.account_hosting
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_account_hosting_account ON public.account_hosting(account_id);
CREATE INDEX idx_account_hosting_environment_id ON account_hosting (environment_id);
CREATE INDEX idx_account_hosting_provider_id ON account_hosting (provider_id);

ALTER TABLE public.account_hosting ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_hosting_select ON public.account_hosting
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY account_hosting_insert ON public.account_hosting
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_hosting_update ON public.account_hosting
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_hosting_delete ON public.account_hosting
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_hosting TO authenticated;

-- ── account_competence_centers ──────────────────────────────────────────────

CREATE TABLE public.account_competence_centers (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  competence_center_id uuid NOT NULL REFERENCES public.ref_competence_centers(id),
  contact_person       text,
  email                text,
  phone                text,
  distribution         text CHECK (distribution IN ('4%', '50/50')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_account_competence_centers_updated_at
  BEFORE UPDATE ON public.account_competence_centers
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_account_competence_centers_account ON public.account_competence_centers(account_id);
CREATE INDEX idx_account_competence_centers_cc_id ON account_competence_centers (competence_center_id);

ALTER TABLE public.account_competence_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_competence_centers_select ON public.account_competence_centers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY account_competence_centers_insert ON public.account_competence_centers
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_competence_centers_update ON public.account_competence_centers
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_competence_centers_delete ON public.account_competence_centers
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_competence_centers TO authenticated;

-- ── account_cc_services (junction for competence center services) ───────────

CREATE TABLE public.account_cc_services (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_competence_center_id uuid NOT NULL REFERENCES public.account_competence_centers(id) ON DELETE CASCADE,
  service_id                   uuid NOT NULL REFERENCES public.ref_cc_services(id),
  created_at                   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_competence_center_id, service_id)
);

CREATE INDEX idx_account_cc_services_acc_cc ON public.account_cc_services(account_competence_center_id);
CREATE INDEX idx_account_cc_services_service_id ON account_cc_services (service_id);

ALTER TABLE public.account_cc_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_cc_services_select ON public.account_cc_services
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY account_cc_services_insert ON public.account_cc_services
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_cc_services_update ON public.account_cc_services
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_cc_services_delete ON public.account_cc_services
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_cc_services TO authenticated;

-- ── account_services ────────────────────────────────────────────────────────

CREATE TABLE public.account_services (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.ref_cc_services(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_account_services_updated_at
  BEFORE UPDATE ON public.account_services
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_account_services_account ON public.account_services(account_id);
CREATE UNIQUE INDEX idx_account_services_unique ON public.account_services(account_id, service_id);
CREATE INDEX idx_account_services_service_id ON account_services (service_id);

ALTER TABLE public.account_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_services_select ON public.account_services
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY account_services_insert ON public.account_services
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_services_update ON public.account_services
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_services_delete ON public.account_services
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_services TO authenticated;
