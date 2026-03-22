/*
  Migration: Performance indexes

  1. Enables pg_trgm extension for trigram-based similarity search
  2. Creates GIN trigram indexes on text columns used with ILIKE across the app
  3. Creates B-tree indexes on foreign key columns that were not indexed at
     table creation time (required for efficient JOIN and CASCADE operations)
*/

-- ── pg_trgm extension ───────────────────────────────────────────────────────
-- Trigram indexes support fast ILIKE search (e.g. WHERE name ILIKE '%query%')
-- without full table scans. Used by list views for accounts, contacts,
-- consultants, and deals.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Trigram indexes for ILIKE search ────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_accounts_name_trgm
  ON accounts USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_accounts_domain_trgm
  ON accounts USING gin (domain gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contacts_first_name_trgm
  ON contacts USING gin (first_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contacts_last_name_trgm
  ON contacts USING gin (last_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm
  ON contacts USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_consultants_first_name_trgm
  ON consultants USING gin (first_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_consultants_last_name_trgm
  ON consultants USING gin (last_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_consultants_client_name_trgm
  ON consultants USING gin (client_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_deals_title_trgm
  ON deals USING gin (title gin_trgm_ops);

-- ── Foreign key indexes ─────────────────────────────────────────────────────
-- Postgres does not automatically index foreign key columns. Without these,
-- JOIN and ON DELETE CASCADE operations require sequential scans.

CREATE INDEX IF NOT EXISTS idx_account_hosting_environment_id
  ON account_hosting (environment_id);

CREATE INDEX IF NOT EXISTS idx_account_hosting_provider_id
  ON account_hosting (provider_id);

CREATE INDEX IF NOT EXISTS idx_account_competence_centers_cc_id
  ON account_competence_centers (competence_center_id);

CREATE INDEX IF NOT EXISTS idx_consultant_contract_attributions_contact_id
  ON consultant_contract_attributions (contact_id);

-- idx_indexation_drafts_approved_by and idx_indexation_drafts_created_by
-- are already created in 00010_indexation.sql

CREATE INDEX IF NOT EXISTS idx_revenue_client_services_division_id
  ON revenue_client_services (division_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_entries_deal_id
  ON pipeline_entries (deal_id);

-- idx_salary_history_recorded_by and idx_evaluations_recorded_by
-- are already created in 00011_employees.sql

CREATE INDEX IF NOT EXISTS idx_account_cc_services_service_id
  ON account_cc_services (service_id);

CREATE INDEX IF NOT EXISTS idx_account_samenwerkingsvormen_collaboration_type_id
  ON account_samenwerkingsvormen (collaboration_type_id);

CREATE INDEX IF NOT EXISTS idx_account_services_service_id
  ON account_services (service_id);

CREATE INDEX IF NOT EXISTS idx_account_tech_stacks_technology_id
  ON account_tech_stacks (technology_id);
