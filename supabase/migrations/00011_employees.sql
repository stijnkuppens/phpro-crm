/*
  Migration: Employees & HR

  Creates the HR module tables:
  - employees: core employee records
  - employee_children: children of employees
  - salary_history: salary change log
  - equipment: assigned equipment tracking
  - hr_documents: HR document references
  - leave_balances: annual leave/PTO tracking
  - evaluations: performance reviews

  All tables are admin-only for ALL operations including SELECT.
*/

-- ── employees ────────────────────────────────────────────────────────────────

CREATE TABLE employees (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name                  text NOT NULL,
  last_name                   text NOT NULL,
  date_of_birth               date,
  city                        text,
  nationality                 text,
  education                   text,
  school                      text,
  marital_status              text,
  emergency_contact_name      text,
  emergency_contact_phone     text,
  emergency_contact_relation  text,
  hire_date                   date NOT NULL,
  termination_date            date,
  job_title                   text,
  department                  text,
  status                      text NOT NULL DEFAULT 'actief' CHECK (status IN ('actief', 'inactief')),
  gross_salary                numeric,
  email                       text,
  phone                       text,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Indexes
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);

-- RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select" ON employees
  FOR SELECT TO authenticated
  USING ((select public.get_user_role()) = 'admin');

CREATE POLICY "employees_insert" ON employees
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "employees_update" ON employees
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) = 'admin')
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "employees_delete" ON employees
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) = 'admin');

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO authenticated;

-- ── employee_children ────────────────────────────────────────────────────────

CREATE TABLE employee_children (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name            text NOT NULL,
  birth_year      int,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON employee_children
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_employee_children_employee ON employee_children(employee_id);

-- RLS
ALTER TABLE employee_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_children_select" ON employee_children
  FOR SELECT TO authenticated
  USING ((select public.get_user_role()) = 'admin');

CREATE POLICY "employee_children_insert" ON employee_children
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "employee_children_update" ON employee_children
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) = 'admin')
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "employee_children_delete" ON employee_children
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) = 'admin');

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_children TO authenticated;

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

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON salary_history
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_salary_history_employee ON salary_history(employee_id);
CREATE INDEX idx_salary_history_recorded_by ON salary_history(recorded_by);

-- RLS
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salary_history_select" ON salary_history
  FOR SELECT TO authenticated
  USING ((select public.get_user_role()) = 'admin');

CREATE POLICY "salary_history_insert" ON salary_history
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "salary_history_update" ON salary_history
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) = 'admin')
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "salary_history_delete" ON salary_history
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) = 'admin');

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON salary_history TO authenticated;

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

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_equipment_employee ON equipment(employee_id);

-- RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipment_select" ON equipment
  FOR SELECT TO authenticated
  USING ((select public.get_user_role()) = 'admin');

CREATE POLICY "equipment_insert" ON equipment
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "equipment_update" ON equipment
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) = 'admin')
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "equipment_delete" ON equipment
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) = 'admin');

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON equipment TO authenticated;

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

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON hr_documents
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_hr_documents_employee ON hr_documents(employee_id);

-- RLS
ALTER TABLE hr_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_documents_select" ON hr_documents
  FOR SELECT TO authenticated
  USING ((select public.get_user_role()) = 'admin');

CREATE POLICY "hr_documents_insert" ON hr_documents
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "hr_documents_update" ON hr_documents
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) = 'admin')
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "hr_documents_delete" ON hr_documents
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) = 'admin');

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON hr_documents TO authenticated;

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

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);

-- RLS
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_balances_select" ON leave_balances
  FOR SELECT TO authenticated
  USING ((select public.get_user_role()) = 'admin');

CREATE POLICY "leave_balances_insert" ON leave_balances
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "leave_balances_update" ON leave_balances
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) = 'admin')
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "leave_balances_delete" ON leave_balances
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) = 'admin');

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_balances TO authenticated;

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

-- Trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- FK indexes
CREATE INDEX idx_evaluations_employee ON evaluations(employee_id);
CREATE INDEX idx_evaluations_recorded_by ON evaluations(recorded_by);

-- RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluations_select" ON evaluations
  FOR SELECT TO authenticated
  USING ((select public.get_user_role()) = 'admin');

CREATE POLICY "evaluations_insert" ON evaluations
  FOR INSERT TO authenticated
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "evaluations_update" ON evaluations
  FOR UPDATE TO authenticated
  USING ((select public.get_user_role()) = 'admin')
  WITH CHECK ((select public.get_user_role()) = 'admin');

CREATE POLICY "evaluations_delete" ON evaluations
  FOR DELETE TO authenticated
  USING ((select public.get_user_role()) = 'admin');

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON evaluations TO authenticated;
