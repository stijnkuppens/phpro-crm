-- Reference table for indexation percentages (e.g. Agoria indices)
CREATE TABLE indexation_indices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_indexation_indices_updated_at
  BEFORE UPDATE ON indexation_indices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE indexation_indices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read indexation indices"
  ON indexation_indices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage indexation indices"
  ON indexation_indices FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Seed
INSERT INTO indexation_indices (name, value) VALUES
  ('Agoria', 3.1),
  ('Agoria Digital', 2.8);
