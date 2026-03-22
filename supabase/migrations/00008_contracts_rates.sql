/*
  Migration: Contracts and Rates
  Creates tables for contract management and rate tracking:
  - contracts: one contract per account (1:1), framework and service contract details
  - hourly_rates: hourly rates per account, year, and role
  - sla_rates: SLA pricing per account per year
  - sla_tools: SLA tool pricing per SLA rate
  All tables include RLS, moddatetime triggers, grants, and FK indexes.
*/

-- ── contracts ─────────────────────────────────────────────────────────────────

CREATE TABLE public.contracts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id             uuid NOT NULL UNIQUE REFERENCES public.accounts(id) ON DELETE CASCADE,
  has_framework_contract bool NOT NULL DEFAULT false,
  framework_pdf_url      text,
  framework_start        date,
  framework_end          date,
  framework_indefinite   bool NOT NULL DEFAULT false,
  has_service_contract   bool NOT NULL DEFAULT false,
  service_pdf_url        text,
  service_start          date,
  service_end            date,
  service_indefinite     bool NOT NULL DEFAULT false,
  purchase_orders_url    text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_account ON public.contracts(account_id);

CREATE TRIGGER set_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contracts_select ON public.contracts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY contracts_insert ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY contracts_update ON public.contracts
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY contracts_delete ON public.contracts
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;

-- ── hourly_rates ──────────────────────────────────────────────────────────────

CREATE TABLE public.hourly_rates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  year       int NOT NULL,
  role       text NOT NULL,
  rate       numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, year, role)
);

CREATE INDEX idx_hourly_rates_account ON public.hourly_rates(account_id);

CREATE TRIGGER set_hourly_rates_updated_at
  BEFORE UPDATE ON public.hourly_rates
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.hourly_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY hourly_rates_select ON public.hourly_rates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY hourly_rates_insert ON public.hourly_rates
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY hourly_rates_update ON public.hourly_rates
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY hourly_rates_delete ON public.hourly_rates
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hourly_rates TO authenticated;

-- ── sla_rates ─────────────────────────────────────────────────────────────────

CREATE TABLE public.sla_rates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  year                int NOT NULL,
  fixed_monthly_rate  numeric NOT NULL DEFAULT 0,
  support_hourly_rate numeric NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, year)
);

CREATE INDEX idx_sla_rates_account_year ON public.sla_rates(account_id, year);

CREATE TRIGGER set_sla_rates_updated_at
  BEFORE UPDATE ON public.sla_rates
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.sla_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY sla_rates_select ON public.sla_rates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY sla_rates_insert ON public.sla_rates
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY sla_rates_update ON public.sla_rates
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY sla_rates_delete ON public.sla_rates
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sla_rates TO authenticated;

-- ── sla_tools ─────────────────────────────────────────────────────────────────

CREATE TABLE public.sla_tools (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_rate_id   uuid NOT NULL REFERENCES public.sla_rates(id) ON DELETE CASCADE,
  tool_name     text NOT NULL,
  monthly_price numeric NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_tools_sla_rate ON public.sla_tools(sla_rate_id);

CREATE TRIGGER set_sla_tools_updated_at
  BEFORE UPDATE ON public.sla_tools
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.sla_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY sla_tools_select ON public.sla_tools
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY sla_tools_insert ON public.sla_tools
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY sla_tools_update ON public.sla_tools
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY sla_tools_delete ON public.sla_tools
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sla_tools TO authenticated;

-- ── Realtime ──────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
