-- ============================================================================
-- Fix Supabase lint warnings: security (mutable search_path) + performance
-- ============================================================================

-- ── Security: pin search_path on public functions ─────────────────────────

ALTER FUNCTION public.approve_indexation SET search_path = public;
ALTER FUNCTION public.save_prognose SET search_path = public;
ALTER FUNCTION public.sync_account_fk_relation SET search_path = public;
ALTER FUNCTION public.upsert_hourly_rates SET search_path = public;

-- ── Performance: add indexes on unindexed foreign keys ────────────────────

CREATE INDEX IF NOT EXISTS idx_account_hosting_environment_id
  ON account_hosting (environment_id);

CREATE INDEX IF NOT EXISTS idx_account_hosting_provider_id
  ON account_hosting (provider_id);

CREATE INDEX IF NOT EXISTS idx_account_competence_centers_cc_id
  ON account_competence_centers (competence_center_id);

CREATE INDEX IF NOT EXISTS idx_consultant_contract_attributions_contact_id
  ON consultant_contract_attributions (contact_id);

CREATE INDEX IF NOT EXISTS idx_indexation_drafts_approved_by
  ON indexation_drafts (approved_by);

CREATE INDEX IF NOT EXISTS idx_indexation_drafts_created_by
  ON indexation_drafts (created_by);

CREATE INDEX IF NOT EXISTS idx_revenue_client_services_division_id
  ON revenue_client_services (division_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_entries_deal_id
  ON pipeline_entries (deal_id);

CREATE INDEX IF NOT EXISTS idx_salary_history_recorded_by
  ON salary_history (recorded_by);

CREATE INDEX IF NOT EXISTS idx_evaluations_recorded_by
  ON evaluations (recorded_by);
