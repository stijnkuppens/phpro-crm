/*
  Migration: Divisions and Revenue
  Creates tables for organizational divisions, revenue tracking, and pipeline:
  - divisions: organizational divisions with color coding and sort order
  - division_services: services offered per division
  - revenue_clients: clients for revenue tracking (optionally linked to accounts)
  - revenue_client_divisions: junction linking revenue clients to divisions
  - revenue_client_services: services per revenue client per division
  - revenue_entries: monthly revenue data per client/division/service
  - account_revenue: account-level annual revenue by category
  - pipeline_entries: pipeline/forecast data per division
  All tables include RLS, moddatetime triggers, grants, and FK indexes.
*/

-- ── divisions ─────────────────────────────────────────────────────────────────

CREATE TABLE public.divisions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  color      text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_divisions_updated_at
  BEFORE UPDATE ON public.divisions
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY divisions_select ON public.divisions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY divisions_insert ON public.divisions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin'));

CREATE POLICY divisions_update ON public.divisions
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin'));

CREATE POLICY divisions_delete ON public.divisions
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.divisions TO authenticated;

-- ── division_services ─────────────────────────────────────────────────────────

CREATE TABLE public.division_services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id  uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_division_services_division ON public.division_services(division_id);

CREATE TRIGGER set_division_services_updated_at
  BEFORE UPDATE ON public.division_services
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.division_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY division_services_select ON public.division_services
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY division_services_insert ON public.division_services
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin'));

CREATE POLICY division_services_update ON public.division_services
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin'));

CREATE POLICY division_services_delete ON public.division_services
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.division_services TO authenticated;

-- ── revenue_clients ───────────────────────────────────────────────────────────

CREATE TABLE public.revenue_clients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_revenue_clients_account ON public.revenue_clients(account_id);

CREATE TRIGGER set_revenue_clients_updated_at
  BEFORE UPDATE ON public.revenue_clients
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.revenue_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY revenue_clients_select ON public.revenue_clients
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY revenue_clients_insert ON public.revenue_clients
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY revenue_clients_update ON public.revenue_clients
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY revenue_clients_delete ON public.revenue_clients
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_clients TO authenticated;

-- ── revenue_client_divisions ──────────────────────────────────────────────────

CREATE TABLE public.revenue_client_divisions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_client_id uuid NOT NULL REFERENCES public.revenue_clients(id) ON DELETE CASCADE,
  division_id       uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_revenue_client_divisions_client ON public.revenue_client_divisions(revenue_client_id);
CREATE INDEX idx_revenue_client_divisions_division ON public.revenue_client_divisions(division_id);

CREATE TRIGGER set_revenue_client_divisions_updated_at
  BEFORE UPDATE ON public.revenue_client_divisions
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.revenue_client_divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY revenue_client_divisions_select ON public.revenue_client_divisions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY revenue_client_divisions_insert ON public.revenue_client_divisions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY revenue_client_divisions_update ON public.revenue_client_divisions
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY revenue_client_divisions_delete ON public.revenue_client_divisions
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_client_divisions TO authenticated;

-- ── revenue_client_services ───────────────────────────────────────────────────

CREATE TABLE public.revenue_client_services (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_client_id uuid NOT NULL REFERENCES public.revenue_clients(id) ON DELETE CASCADE,
  division_id       uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  service_name      text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_revenue_client_services_client ON public.revenue_client_services(revenue_client_id);
CREATE INDEX idx_revenue_client_services_division ON public.revenue_client_services(division_id);

CREATE TRIGGER set_revenue_client_services_updated_at
  BEFORE UPDATE ON public.revenue_client_services
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.revenue_client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY revenue_client_services_select ON public.revenue_client_services
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY revenue_client_services_insert ON public.revenue_client_services
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY revenue_client_services_update ON public.revenue_client_services
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY revenue_client_services_delete ON public.revenue_client_services
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_client_services TO authenticated;

-- ── revenue_entries ───────────────────────────────────────────────────────────

CREATE TABLE public.revenue_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_client_id uuid NOT NULL REFERENCES public.revenue_clients(id) ON DELETE CASCADE,
  division_id       uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  service_name      text NOT NULL,
  year              int NOT NULL,
  month             int NOT NULL CHECK (month >= 0 AND month <= 11),
  amount            numeric NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (revenue_client_id, division_id, service_name, year, month)
);

CREATE INDEX idx_revenue_entries_client ON public.revenue_entries(revenue_client_id);
CREATE INDEX idx_revenue_entries_division ON public.revenue_entries(division_id);
CREATE INDEX idx_revenue_entries_year ON public.revenue_entries(year);
CREATE INDEX idx_revenue_entries_year_month ON public.revenue_entries(year, month);

CREATE TRIGGER set_revenue_entries_updated_at
  BEFORE UPDATE ON public.revenue_entries
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY revenue_entries_select ON public.revenue_entries
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY revenue_entries_insert ON public.revenue_entries
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY revenue_entries_update ON public.revenue_entries
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY revenue_entries_delete ON public.revenue_entries
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_entries TO authenticated;

-- ── account_revenue ───────────────────────────────────────────────────────────

CREATE TABLE public.account_revenue (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  year       int NOT NULL,
  category   text NOT NULL,
  amount     numeric NOT NULL DEFAULT 0,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_revenue_account ON public.account_revenue(account_id);
CREATE INDEX idx_account_revenue_year ON public.account_revenue(account_id, year);

CREATE TRIGGER set_account_revenue_updated_at
  BEFORE UPDATE ON public.account_revenue
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.account_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_revenue_select ON public.account_revenue
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY account_revenue_insert ON public.account_revenue
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_revenue_update ON public.account_revenue
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY account_revenue_delete ON public.account_revenue
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_revenue TO authenticated;

-- ── pipeline_entries ──────────────────────────────────────────────────────────

CREATE TABLE public.pipeline_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  client       text NOT NULL,
  division_id  uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  sold_month   int NOT NULL CHECK (sold_month >= 0 AND sold_month <= 11),
  start_month  int NOT NULL CHECK (start_month >= 0 AND start_month <= 11),
  duration     int NOT NULL DEFAULT 1 CHECK (duration >= 1),
  total        numeric NOT NULL DEFAULT 0,
  year         int NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_entries_deal ON public.pipeline_entries(deal_id);
CREATE INDEX idx_pipeline_entries_division ON public.pipeline_entries(division_id);
CREATE INDEX idx_pipeline_entries_year ON public.pipeline_entries(year);

CREATE TRIGGER set_pipeline_entries_updated_at
  BEFORE UPDATE ON public.pipeline_entries
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY pipeline_entries_select ON public.pipeline_entries
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY pipeline_entries_insert ON public.pipeline_entries
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY pipeline_entries_update ON public.pipeline_entries
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY pipeline_entries_delete ON public.pipeline_entries
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_entries TO authenticated;

-- ── Realtime ──────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.revenue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_entries;
