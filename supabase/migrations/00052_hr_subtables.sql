-- ============================================================================
-- Migration: HR sub-tables (salary, equipment, documents, leave, evaluations)
-- ============================================================================

-- ── salary_history ──────────────────────────────────────────────────────────
CREATE TABLE salary_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date            date NOT NULL,
  gross_salary    numeric NOT NULL,
  reason          text,
  recorded_by     uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON salary_history
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_salary_history_employee ON salary_history(employee_id);
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salary_history_select" ON salary_history FOR SELECT TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "salary_history_insert" ON salary_history FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "salary_history_update" ON salary_history FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "salary_history_delete" ON salary_history FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ── equipment ───────────────────────────────────────────────────────────────
CREATE TABLE equipment (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type            text NOT NULL,
  name            text NOT NULL,
  serial_number   text,
  date_issued     date NOT NULL,
  date_returned   date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_equipment_employee ON equipment(employee_id);
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipment_select" ON equipment FOR SELECT TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "equipment_insert" ON equipment FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "equipment_update" ON equipment FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "equipment_delete" ON equipment FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ── hr_documents ────────────────────────────────────────────────────────────
CREATE TABLE hr_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type            text NOT NULL,
  name            text NOT NULL,
  url             text,
  date            date NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON hr_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_hr_documents_employee ON hr_documents(employee_id);
ALTER TABLE hr_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_documents_select" ON hr_documents FOR SELECT TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "hr_documents_insert" ON hr_documents FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "hr_documents_update" ON hr_documents FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "hr_documents_delete" ON hr_documents FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ── leave_balances ──────────────────────────────────────────────────────────
CREATE TABLE leave_balances (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year            int NOT NULL,
  allowance       int NOT NULL DEFAULT 20,
  taken           int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leave_balances_select" ON leave_balances FOR SELECT TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "leave_balances_insert" ON leave_balances FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "leave_balances_update" ON leave_balances FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "leave_balances_delete" ON leave_balances FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ── evaluations ─────────────────────────────────────────────────────────────
CREATE TABLE evaluations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date            date NOT NULL,
  type            text NOT NULL,
  score           text,
  notes           text,
  recorded_by     uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_evaluations_employee ON evaluations(employee_id);
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluations_select" ON evaluations FOR SELECT TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY "evaluations_insert" ON evaluations FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "evaluations_update" ON evaluations FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "evaluations_delete" ON evaluations FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ── GRANT statements ────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON salary_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON equipment TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hr_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_balances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON evaluations TO authenticated;
