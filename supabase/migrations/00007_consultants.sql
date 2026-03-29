/*
  Migration: Consultants (unified model)

  Creates the unified consultant model merging bench + active consultants:
  - consultants: unified table with status field (bench/actief/stopgezet)
  - consultant_languages: junction table for languages spoken
  - consultant_rate_history: rate change audit trail
  - consultant_extensions: contract extension records
  - consultant_contract_attributions: attribution tracking (rechtstreeks/cronos)

  Also adds deferred FK from deals.consultant_id → consultants,
  and the link_consultant_to_account() RPC function.
*/

-- ── consultants ─────────────────────────────────────────────────────────────

CREATE TABLE consultants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Shared fields
  first_name          text NOT NULL,
  last_name           text NOT NULL,
  city                text,
  cv_pdf_url          text,
  avatar_path         text,

  -- Status
  status              text NOT NULL DEFAULT 'bench'
                        CHECK (status IN ('bench', 'actief', 'stopgezet')),
  is_archived         bool NOT NULL DEFAULT false,

  -- Bench-specific (nullable when active/stopped)
  priority            text CHECK (priority IN ('High', 'Medium', 'Low')),
  available_date      date,
  min_hourly_rate     numeric,
  max_hourly_rate     numeric,
  roles               text[] DEFAULT '{}',
  technologies        text[] DEFAULT '{}',
  description         text,

  -- Active-specific (nullable when bench)
  account_id          uuid REFERENCES accounts(id) ON DELETE SET NULL,
  role                text,
  client_name         text,
  client_city         text,
  start_date          date,
  end_date            date,
  is_indefinite       bool NOT NULL DEFAULT false,
  hourly_rate         numeric,
  sow_url             text,
  notice_period_days  int DEFAULT 30,
  notes               text,

  -- Stop-specific (nullable when not stopped)
  stop_date           date,
  stop_reason         text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultants
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Indexes
CREATE INDEX idx_consultants_status ON consultants(status);
CREATE INDEX idx_consultants_account ON consultants(account_id);
CREATE INDEX idx_consultants_archived ON consultants(is_archived);
CREATE INDEX idx_consultants_first_name_trgm ON consultants USING gin (first_name gin_trgm_ops);
CREATE INDEX idx_consultants_last_name_trgm ON consultants USING gin (last_name gin_trgm_ops);
CREATE INDEX idx_consultants_client_name_trgm ON consultants USING gin (client_name gin_trgm_ops);

-- RLS
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultants_select" ON consultants
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "consultants_insert" ON consultants
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultants_update" ON consultants
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultants_delete" ON consultants
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON consultants TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE consultants;

-- Deferred FK: deals.consultant_id → consultants
ALTER TABLE deals
  ADD CONSTRAINT deals_consultant_id_fkey
  FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE SET NULL;

-- ── consultant_languages ────────────────────────────────────────────────────

CREATE TABLE consultant_languages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id   uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  language        text NOT NULL,
  level           text NOT NULL CHECK (level IN ('Basis', 'Gevorderd', 'Vloeiend', 'Moedertaal')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_languages
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_consultant_languages_consultant ON consultant_languages(consultant_id);

-- RLS
ALTER TABLE consultant_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultant_languages_select" ON consultant_languages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "consultant_languages_insert" ON consultant_languages
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultant_languages_update" ON consultant_languages
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultant_languages_delete" ON consultant_languages
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON consultant_languages TO authenticated;

-- ── consultant_rate_history ─────────────────────────────────────────────────

CREATE TABLE consultant_rate_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id   uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  date            date NOT NULL,
  rate            numeric NOT NULL,
  reason          text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_rate_history
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_consultant_rate_history_consultant ON consultant_rate_history(consultant_id);

-- RLS
ALTER TABLE consultant_rate_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultant_rate_history_select" ON consultant_rate_history
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "consultant_rate_history_insert" ON consultant_rate_history
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultant_rate_history_update" ON consultant_rate_history
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultant_rate_history_delete" ON consultant_rate_history
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON consultant_rate_history TO authenticated;

-- ── consultant_extensions ───────────────────────────────────────────────────

CREATE TABLE consultant_extensions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id   uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  new_end_date    date NOT NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_extensions
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_consultant_extensions_consultant ON consultant_extensions(consultant_id);

-- RLS
ALTER TABLE consultant_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultant_extensions_select" ON consultant_extensions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "consultant_extensions_insert" ON consultant_extensions
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultant_extensions_update" ON consultant_extensions
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultant_extensions_delete" ON consultant_extensions
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON consultant_extensions TO authenticated;

-- ── consultant_contract_attributions ────────────────────────────────────────

CREATE TABLE consultant_contract_attributions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id   uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('rechtstreeks', 'cronos')),
  contact_id      uuid REFERENCES contacts(id) ON DELETE SET NULL,
  cc_name         text,
  cc_contact_person text,
  cc_email        text,
  cc_phone        text,
  cc_distribution text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultant_contract_attributions
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes (unique — one attribution per consultant)
CREATE UNIQUE INDEX idx_consultant_contract_attributions_consultant
  ON consultant_contract_attributions(consultant_id);
CREATE INDEX idx_consultant_contract_attributions_contact
  ON consultant_contract_attributions(contact_id);

-- RLS
ALTER TABLE consultant_contract_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultant_contract_attributions_select" ON consultant_contract_attributions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "consultant_contract_attributions_insert" ON consultant_contract_attributions
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultant_contract_attributions_update" ON consultant_contract_attributions
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'))
  WITH CHECK ((select public.get_user_role()) IN ('admin', 'sales_manager'));

CREATE POLICY "consultant_contract_attributions_delete" ON consultant_contract_attributions
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) IN ('admin', 'sales_manager'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON consultant_contract_attributions TO authenticated;

-- ── link_consultant_to_account() RPC ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.link_consultant_to_account(
  p_consultant_id UUID,
  p_account_id UUID,
  p_role TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_is_indefinite BOOLEAN DEFAULT FALSE,
  p_hourly_rate NUMERIC DEFAULT 0,
  p_notice_period_days INTEGER DEFAULT 30,
  p_sow_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role           text;
  v_consultant     consultants%ROWTYPE;
  v_account_name   TEXT;
  v_effective_role TEXT;
BEGIN
  -- Auth guard: only admin, sales_manager, and customer_success may call this function
  SELECT role INTO v_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_role NOT IN ('admin', 'sales_manager', 'customer_success') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- 1. Validate hourly rate
  IF p_hourly_rate IS NULL OR p_hourly_rate <= 0 THEN
    RAISE EXCEPTION 'Uurtarief moet groter zijn dan 0';
  END IF;

  -- 2. Fetch consultant (lock row to prevent concurrent linking)
  SELECT * INTO v_consultant
  FROM consultants
  WHERE id = p_consultant_id AND status = 'bench' AND is_archived = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultant niet gevonden of niet beschikbaar';
  END IF;

  -- 3. Fetch account name for denormalized field
  SELECT name INTO v_account_name
  FROM accounts
  WHERE id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account niet gevonden';
  END IF;

  -- 4. Determine role: explicit > first bench role > null
  v_effective_role := COALESCE(p_role, v_consultant.roles[1]);

  -- 5. Update consultant: bench → actief
  UPDATE consultants SET
    status             = 'actief',
    account_id         = p_account_id,
    role               = v_effective_role,
    client_name        = v_account_name,
    start_date         = p_start_date,
    end_date           = CASE WHEN p_is_indefinite THEN NULL ELSE p_end_date END,
    is_indefinite      = p_is_indefinite,
    hourly_rate        = p_hourly_rate,
    sow_url            = p_sow_url,
    notice_period_days = p_notice_period_days,
    notes              = p_notes
  WHERE id = p_consultant_id;

  -- 6. Create initial rate history entry
  INSERT INTO consultant_rate_history (consultant_id, date, rate, reason)
  VALUES (p_consultant_id, p_start_date, p_hourly_rate, 'Initieel tarief');

  RETURN p_consultant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_consultant_to_account TO authenticated;
