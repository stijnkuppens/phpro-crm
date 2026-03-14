-- ============================================================================
-- Migration: Bench Consultants
-- ============================================================================

-- ── bench_consultants ────────────────────────────────────────────────────────
CREATE TABLE bench_consultants (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name        text NOT NULL,
  last_name         text NOT NULL,
  city              text,
  priority          text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  available_date    date,
  min_hourly_rate   numeric,
  max_hourly_rate   numeric,
  roles             text[] DEFAULT '{}',
  technologies      text[] DEFAULT '{}',
  description       text,
  cv_pdf_url        text,
  is_archived       bool NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON bench_consultants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_bench_consultants_priority ON bench_consultants(priority);
CREATE INDEX idx_bench_consultants_archived ON bench_consultants(is_archived);

ALTER TABLE bench_consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bench_consultants_select" ON bench_consultants FOR SELECT TO authenticated USING (true);
CREATE POLICY "bench_consultants_insert" ON bench_consultants FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "bench_consultants_update" ON bench_consultants FOR UPDATE TO authenticated USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));
CREATE POLICY "bench_consultants_delete" ON bench_consultants FOR DELETE TO authenticated USING (get_user_role() IN ('admin'));

GRANT INSERT, UPDATE, DELETE ON public.bench_consultants TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE bench_consultants;

-- ── bench_consultant_languages ───────────────────────────────────────────────
CREATE TABLE bench_consultant_languages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bench_consultant_id   uuid NOT NULL REFERENCES bench_consultants(id) ON DELETE CASCADE,
  language              text NOT NULL,
  level                 text NOT NULL CHECK (level IN ('Basis', 'Gevorderd', 'Vloeiend', 'Moedertaal')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON bench_consultant_languages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_bench_consultant_languages_consultant ON bench_consultant_languages(bench_consultant_id);

ALTER TABLE bench_consultant_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bench_consultant_languages_select" ON bench_consultant_languages FOR SELECT TO authenticated USING (true);
CREATE POLICY "bench_consultant_languages_write" ON bench_consultant_languages FOR ALL TO authenticated USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep')) WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep'));

GRANT INSERT, UPDATE, DELETE ON public.bench_consultant_languages TO authenticated;

-- ── FK from deals ─────────────────────────────────────────────────────────────
ALTER TABLE deals ADD CONSTRAINT deals_bench_consultant_id_fkey FOREIGN KEY (bench_consultant_id) REFERENCES bench_consultants(id) ON DELETE SET NULL;
CREATE INDEX idx_deals_bench_consultant ON deals(bench_consultant_id);
