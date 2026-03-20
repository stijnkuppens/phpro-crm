-- ============================================================================
-- Migration: Junction table FK migration (freetext → ref_* FK references)
-- Self-contained: seeds reference data inline before adding FK constraints
-- ============================================================================

-- ============================================================================
-- Step 1: Seed reference data inline (migrations run before seed.sql)
-- ============================================================================

INSERT INTO ref_technologies (name, sort_order) VALUES
  ('PHP', 1), ('JavaScript', 2), ('TypeScript', 3), ('React', 4), ('Vue.js', 5),
  ('Angular', 6), ('Node.js', 7), ('Magento', 8), ('Shopware', 9), ('Akeneo', 10),
  ('OroCommerce', 11), ('Adobe Commerce', 12), ('Hyva', 13), ('Docker', 14),
  ('Kubernetes', 15), ('AWS', 16), ('Azure', 17), ('MySQL', 18), ('PostgreSQL', 19),
  ('Redis', 20), ('Elasticsearch', 21), ('GraphQL', 22), ('REST API', 23),
  ('Git', 24), ('Jira', 25), ('Confluence', 26), ('SAP', 27), ('Salesforce', 28),
  ('PIMcore', 29), ('Marello', 30)
ON CONFLICT (name) DO NOTHING;

INSERT INTO ref_collaboration_types (name, sort_order) VALUES
  ('Project', 1), ('Continuous Dev.', 2), ('Ad Hoc', 3), ('Support', 4), ('Consultancy', 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO ref_hosting_providers (name, sort_order) VALUES
  ('AWS', 1), ('Azure', 2), ('Google Cloud', 3), ('Combell', 4), ('Hosted Power', 5),
  ('OVHcloud', 6), ('Hetzner', 7), ('DigitalOcean', 8), ('Kinsta', 9), ('WP Engine', 10),
  ('Cloudways', 11), ('Vercel', 12), ('Netlify', 13), ('TransIP', 14)
ON CONFLICT (name) DO NOTHING;

INSERT INTO ref_hosting_environments (name, sort_order) VALUES
  ('Productie', 1), ('Staging', 2), ('Development', 3), ('Test', 4), ('Demo', 5)
ON CONFLICT (name) DO NOTHING;

INSERT INTO ref_competence_centers (name, sort_order) VALUES
  ('Induxx', 1), ('Humix', 2), ('Skivvy', 3), ('Enforce', 4), ('Osudio', 5),
  ('Youwe', 6), ('Burst Digital', 7), ('Propel', 8), ('Kodplex', 9), ('Elgenio', 10)
ON CONFLICT (name) DO NOTHING;

INSERT INTO ref_cc_services (name, sort_order) VALUES
  ('PIM', 1), ('UX/UI', 2), ('Strategie', 3), ('Marketing Automation', 4), ('SEO/SEA', 5),
  ('Content', 6), ('Analytics', 7), ('E-commerce', 8), ('ERP', 9), ('Cloud & DevOps', 10),
  ('QA & Testing', 11), ('Mobile', 12)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Step 2: account_tech_stacks — technology text → technology_id uuid
-- ============================================================================

-- Insert any orphan values from existing data
INSERT INTO ref_technologies (name)
SELECT DISTINCT technology FROM account_tech_stacks
WHERE technology NOT IN (SELECT name FROM ref_technologies)
ON CONFLICT (name) DO NOTHING;

-- Add FK column
ALTER TABLE account_tech_stacks ADD COLUMN technology_id uuid REFERENCES ref_technologies(id);

-- Populate from existing text
UPDATE account_tech_stacks ats SET technology_id = rt.id
FROM ref_technologies rt WHERE ats.technology = rt.name;

-- Make NOT NULL, drop old column
ALTER TABLE account_tech_stacks ALTER COLUMN technology_id SET NOT NULL;
ALTER TABLE account_tech_stacks DROP COLUMN technology;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_tech_stacks_unique ON account_tech_stacks (account_id, technology_id);

-- ============================================================================
-- Step 3: account_samenwerkingsvormen — type text → collaboration_type_id uuid
-- ============================================================================

-- MUST drop CHECK constraint first
ALTER TABLE account_samenwerkingsvormen DROP CONSTRAINT account_samenwerkingsvormen_type_check;

-- Insert any orphan values from existing data
INSERT INTO ref_collaboration_types (name)
SELECT DISTINCT type FROM account_samenwerkingsvormen
WHERE type NOT IN (SELECT name FROM ref_collaboration_types)
ON CONFLICT (name) DO NOTHING;

-- Add FK column
ALTER TABLE account_samenwerkingsvormen ADD COLUMN collaboration_type_id uuid REFERENCES ref_collaboration_types(id);

-- Populate from existing text
UPDATE account_samenwerkingsvormen asw SET collaboration_type_id = rct.id
FROM ref_collaboration_types rct WHERE asw.type = rct.name;

-- Make NOT NULL, drop old column
ALTER TABLE account_samenwerkingsvormen ALTER COLUMN collaboration_type_id SET NOT NULL;
ALTER TABLE account_samenwerkingsvormen DROP COLUMN type;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_samenwerkingsvormen_unique ON account_samenwerkingsvormen (account_id, collaboration_type_id);

-- ============================================================================
-- Step 4: account_hosting — provider text → provider_id uuid,
--                           environment text → environment_id uuid
-- ============================================================================

-- Insert any orphan providers
INSERT INTO ref_hosting_providers (name)
SELECT DISTINCT provider FROM account_hosting
WHERE provider NOT IN (SELECT name FROM ref_hosting_providers)
ON CONFLICT (name) DO NOTHING;

-- Insert any orphan environments
INSERT INTO ref_hosting_environments (name)
SELECT DISTINCT environment FROM account_hosting
WHERE environment IS NOT NULL
AND environment NOT IN (SELECT name FROM ref_hosting_environments)
ON CONFLICT (name) DO NOTHING;

-- Add FK columns
ALTER TABLE account_hosting ADD COLUMN provider_id uuid REFERENCES ref_hosting_providers(id);
ALTER TABLE account_hosting ADD COLUMN environment_id uuid REFERENCES ref_hosting_environments(id);

-- Populate from existing text
UPDATE account_hosting ah SET provider_id = rhp.id
FROM ref_hosting_providers rhp WHERE ah.provider = rhp.name;

UPDATE account_hosting ah SET environment_id = rhe.id
FROM ref_hosting_environments rhe WHERE ah.environment = rhe.name;

-- Make provider NOT NULL (environment stays nullable as before), drop old columns
ALTER TABLE account_hosting ALTER COLUMN provider_id SET NOT NULL;
ALTER TABLE account_hosting DROP COLUMN provider;
ALTER TABLE account_hosting DROP COLUMN environment;

-- ============================================================================
-- Step 5: account_competence_centers — cc_name text → competence_center_id uuid,
--                                      services text[] → new junction table
-- ============================================================================

-- Insert any orphan competence center names
INSERT INTO ref_competence_centers (name)
SELECT DISTINCT cc_name FROM account_competence_centers
WHERE cc_name NOT IN (SELECT name FROM ref_competence_centers)
ON CONFLICT (name) DO NOTHING;

-- Add FK column
ALTER TABLE account_competence_centers ADD COLUMN competence_center_id uuid REFERENCES ref_competence_centers(id);

-- Populate from existing text
UPDATE account_competence_centers acc SET competence_center_id = rc.id
FROM ref_competence_centers rc WHERE acc.cc_name = rc.name;

-- Make NOT NULL, drop old column
ALTER TABLE account_competence_centers ALTER COLUMN competence_center_id SET NOT NULL;
ALTER TABLE account_competence_centers DROP COLUMN cc_name;

-- Create junction table for CC services (replacing services text[])
CREATE TABLE account_cc_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_competence_center_id uuid NOT NULL REFERENCES account_competence_centers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES ref_cc_services(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_competence_center_id, service_id)
);

CREATE INDEX idx_account_cc_services_acc_cc ON account_cc_services (account_competence_center_id);

ALTER TABLE account_cc_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_cc_services_select" ON account_cc_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "account_cc_services_insert" ON account_cc_services FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales_rep')));
CREATE POLICY "account_cc_services_update" ON account_cc_services FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales_rep')));
CREATE POLICY "account_cc_services_delete" ON account_cc_services FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales_rep')));

GRANT SELECT, INSERT, UPDATE, DELETE ON account_cc_services TO authenticated;

-- Insert any orphan service values from existing text[] data
INSERT INTO ref_cc_services (name)
SELECT DISTINCT svc FROM account_competence_centers, unnest(services) AS svc
WHERE services IS NOT NULL AND array_length(services, 1) > 0
ON CONFLICT (name) DO NOTHING;

-- Migrate services text[] data: unnest array into junction rows
INSERT INTO account_cc_services (account_competence_center_id, service_id)
SELECT acc.id, rcs.id
FROM account_competence_centers acc
CROSS JOIN LATERAL unnest(acc.services) AS svc(name)
JOIN ref_cc_services rcs ON rcs.name = svc.name
ON CONFLICT DO NOTHING;

-- Drop the old services column
ALTER TABLE account_competence_centers DROP COLUMN services;

-- ============================================================================
-- Step 6: account_services — service_name text → service_id uuid
-- ============================================================================

-- Insert any orphan service names
INSERT INTO ref_cc_services (name)
SELECT DISTINCT service_name FROM account_services
WHERE service_name NOT IN (SELECT name FROM ref_cc_services)
ON CONFLICT (name) DO NOTHING;

-- Add FK column
ALTER TABLE account_services ADD COLUMN service_id uuid REFERENCES ref_cc_services(id);

-- Populate from existing text
UPDATE account_services asv SET service_id = rcs.id
FROM ref_cc_services rcs WHERE asv.service_name = rcs.name;

-- Make NOT NULL, drop old column
ALTER TABLE account_services ALTER COLUMN service_id SET NOT NULL;
ALTER TABLE account_services DROP COLUMN service_name;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_services_unique ON account_services (account_id, service_id);

-- ============================================================================
-- Step 7: GRANT statements for junction tables
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON account_tech_stacks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_samenwerkingsvormen TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_hosting TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_competence_centers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_manual_services TO authenticated;
