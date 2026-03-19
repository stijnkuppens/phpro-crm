-- ============================================================================
-- Migration: Employee children
-- ============================================================================

CREATE TABLE employee_children (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name            text NOT NULL,
  birth_year      int,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON employee_children
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_employee_children_employee ON employee_children(employee_id);

ALTER TABLE employee_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_children_select" ON employee_children FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');
CREATE POLICY "employee_children_insert" ON employee_children FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "employee_children_update" ON employee_children FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "employee_children_delete" ON employee_children FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON employee_children TO authenticated;
