-- ============================================================================
-- Migration: Employees
-- ============================================================================

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

CREATE TRIGGER set_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select" ON employees FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');
CREATE POLICY "employees_insert" ON employees FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "employees_update" ON employees FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "employees_delete" ON employees FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO authenticated;
