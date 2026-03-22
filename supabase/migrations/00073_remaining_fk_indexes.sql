-- Add indexes on remaining unindexed foreign keys (INFO-level lint)

CREATE INDEX IF NOT EXISTS idx_account_cc_services_service_id
  ON account_cc_services (service_id);

CREATE INDEX IF NOT EXISTS idx_account_samenwerkingsvormen_collaboration_type_id
  ON account_samenwerkingsvormen (collaboration_type_id);

CREATE INDEX IF NOT EXISTS idx_account_services_service_id
  ON account_services (service_id);

CREATE INDEX IF NOT EXISTS idx_account_tech_stacks_technology_id
  ON account_tech_stacks (technology_id);
