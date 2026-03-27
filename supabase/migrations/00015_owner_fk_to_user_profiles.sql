/*
  Fix FK references: auth.users → user_profiles

  PostgREST can only follow FK relationships within exposed schemas (public).
  Columns referencing auth.users prevent joins to user_profiles for names.
  Repoint to user_profiles(id) which itself cascades from auth.users.

  Also drop duplicate indexes created by both table migrations and 00013.
*/

-- ── owner_id columns ────────────────────────────────────────────────────────

ALTER TABLE accounts
  DROP CONSTRAINT accounts_owner_id_fkey,
  ADD CONSTRAINT accounts_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE deals
  DROP CONSTRAINT deals_owner_id_fkey,
  ADD CONSTRAINT deals_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE activities
  DROP CONSTRAINT activities_owner_id_fkey,
  ADD CONSTRAINT activities_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE communications
  DROP CONSTRAINT communications_owner_id_fkey,
  ADD CONSTRAINT communications_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- ── other user FK columns ───────────────────────────────────────────────────

ALTER TABLE accounts
  DROP CONSTRAINT accounts_project_manager_id_fkey,
  ADD CONSTRAINT accounts_project_manager_id_fkey
    FOREIGN KEY (project_manager_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE tasks
  DROP CONSTRAINT tasks_assigned_to_fkey,
  ADD CONSTRAINT tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- ── duplicate index cleanup ─────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_consultant_contract_attributions_contact_id;
