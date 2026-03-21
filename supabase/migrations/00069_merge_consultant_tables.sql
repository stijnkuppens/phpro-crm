-- ============================================================================
-- Migration: Merge bench_consultants + active_consultants → consultants
-- ============================================================================

BEGIN;

-- ── 1. Create unified consultants table ────────────────────────────────────

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

-- ── 2. Migrate data from bench_consultants (non-archived only) ─────────────

INSERT INTO consultants (
  id, first_name, last_name, city, cv_pdf_url,
  status, is_archived,
  priority, available_date, min_hourly_rate, max_hourly_rate,
  roles, technologies, description,
  created_at, updated_at
)
SELECT
  id, first_name, last_name, city, cv_pdf_url,
  'bench', false,
  priority, available_date, min_hourly_rate, max_hourly_rate,
  roles, technologies, description,
  created_at, updated_at
FROM bench_consultants
WHERE is_archived = false;

-- ── 3. Migrate data from active_consultants ────────────────────────────────

INSERT INTO consultants (
  id, first_name, last_name, city, cv_pdf_url,
  status,
  account_id, role, client_name, client_city,
  start_date, end_date, is_indefinite,
  hourly_rate, sow_url, notice_period_days, notes,
  stop_date, stop_reason,
  created_at, updated_at
)
SELECT
  id, first_name, last_name, city, cv_pdf_url,
  CASE WHEN is_stopped THEN 'stopgezet' ELSE 'actief' END,
  account_id, role, client_name, client_city,
  start_date, end_date, is_indefinite,
  hourly_rate, sow_url, notice_period_days, notes,
  stop_date, stop_reason,
  created_at, updated_at
FROM active_consultants;

-- ── 4. Rename bench_consultant_languages → consultant_languages ────────────

ALTER TABLE bench_consultant_languages RENAME TO consultant_languages;

-- Drop old FK + index, rename column, add new FK + index
ALTER TABLE consultant_languages
  DROP CONSTRAINT bench_consultant_languages_bench_consultant_id_fkey;
DROP INDEX idx_bench_consultant_languages_consultant;

ALTER TABLE consultant_languages
  RENAME COLUMN bench_consultant_id TO consultant_id;

ALTER TABLE consultant_languages
  ADD CONSTRAINT consultant_languages_consultant_id_fkey
  FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE;

CREATE INDEX idx_consultant_languages_consultant ON consultant_languages(consultant_id);

-- Rename RLS policies
ALTER POLICY "bench_consultant_languages_select" ON consultant_languages
  RENAME TO "consultant_languages_select";
ALTER POLICY "bench_consultant_languages_write" ON consultant_languages
  RENAME TO "consultant_languages_write";

-- ── 5. Re-point consultant_rate_history FK ─────────────────────────────────

ALTER TABLE consultant_rate_history
  DROP CONSTRAINT consultant_rate_history_active_consultant_id_fkey;
DROP INDEX idx_consultant_rate_history_consultant;

ALTER TABLE consultant_rate_history
  RENAME COLUMN active_consultant_id TO consultant_id;

ALTER TABLE consultant_rate_history
  ADD CONSTRAINT consultant_rate_history_consultant_id_fkey
  FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE;

CREATE INDEX idx_consultant_rate_history_consultant ON consultant_rate_history(consultant_id);

-- ── 6. Re-point consultant_extensions FK ───────────────────────────────────

ALTER TABLE consultant_extensions
  DROP CONSTRAINT consultant_extensions_active_consultant_id_fkey;
DROP INDEX idx_consultant_extensions_consultant;

ALTER TABLE consultant_extensions
  RENAME COLUMN active_consultant_id TO consultant_id;

ALTER TABLE consultant_extensions
  ADD CONSTRAINT consultant_extensions_consultant_id_fkey
  FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE;

CREATE INDEX idx_consultant_extensions_consultant ON consultant_extensions(consultant_id);

-- ── 7. Re-point consultant_contract_attributions FK ────────────────────────

ALTER TABLE consultant_contract_attributions
  DROP CONSTRAINT consultant_contract_attributions_active_consultant_id_fkey;
DROP INDEX idx_consultant_contract_attributions_consultant;

ALTER TABLE consultant_contract_attributions
  RENAME COLUMN active_consultant_id TO consultant_id;

ALTER TABLE consultant_contract_attributions
  ADD CONSTRAINT consultant_contract_attributions_consultant_id_fkey
  FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX idx_consultant_contract_attributions_consultant ON consultant_contract_attributions(consultant_id);

-- ── 8. Re-point deals FK ───────────────────────────────────────────────────

ALTER TABLE deals
  DROP CONSTRAINT deals_bench_consultant_id_fkey;
DROP INDEX idx_deals_bench_consultant;

ALTER TABLE deals
  RENAME COLUMN bench_consultant_id TO consultant_id;

ALTER TABLE deals
  ADD CONSTRAINT deals_consultant_id_fkey
  FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE SET NULL;

CREATE INDEX idx_deals_consultant ON deals(consultant_id);

-- ── 9. Remove old tables from realtime publication ─────────────────────────

ALTER PUBLICATION supabase_realtime DROP TABLE bench_consultants;
ALTER PUBLICATION supabase_realtime DROP TABLE active_consultants;

-- ── 10. Drop old tables ───────────────────────────────────────────────────

DROP TABLE bench_consultants CASCADE;
DROP TABLE active_consultants CASCADE;

-- ── 11. Drop old function ─────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.link_bench_to_account;

-- ── 12. Indexes on consultants ────────────────────────────────────────────

CREATE INDEX idx_consultants_status ON consultants(status);
CREATE INDEX idx_consultants_account ON consultants(account_id);
CREATE INDEX idx_consultants_archived ON consultants(is_archived);

-- ── 13. Trigger ───────────────────────────────────────────────────────────

CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 14. RLS + Grants ──────────────────────────────────────────────────────

ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultants_select" ON consultants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "consultants_insert" ON consultants
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

CREATE POLICY "consultants_update" ON consultants
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager'));

CREATE POLICY "consultants_delete" ON consultants
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON consultants TO authenticated;

-- ── 15. Realtime ──────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE consultants;

-- ── 16. link_consultant_to_account() RPC ──────────────────────────────────

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
AS $$
DECLARE
  v_consultant consultants%ROWTYPE;
  v_account_name TEXT;
  v_effective_role TEXT;
BEGIN
  -- 1. Lock consultant row, verify bench + not archived
  SELECT * INTO v_consultant
  FROM consultants
  WHERE id = p_consultant_id
    AND status = 'bench'
    AND is_archived = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultant niet gevonden, niet op de bench, of gearchiveerd';
  END IF;

  -- 2. Fetch account name for denormalization
  SELECT name INTO v_account_name
  FROM accounts
  WHERE id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account niet gevonden';
  END IF;

  -- 3. Determine role: explicit > first bench role > null
  v_effective_role := COALESCE(p_role, v_consultant.roles[1]);

  -- 4. Update consultant to active status
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

  -- 5. Create initial rate history entry
  INSERT INTO consultant_rate_history (consultant_id, date, rate, reason)
  VALUES (p_consultant_id, p_start_date, p_hourly_rate, 'Initieel tarief');

  RETURN p_consultant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_consultant_to_account TO authenticated;

COMMIT;
