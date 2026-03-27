/*
  Migration: Fix ACL/RLS alignment

  1. (moved to 00001_foundation.sql — role CHECK constraint now includes customer_success from the start)
  2. Updates RLS write policies to include 'sales_rep' and 'customer_success'
     where the app-level ACL grants them write permissions

  ACL summary (write permissions):
  - sales_rep: accounts, contacts, deals, activities, tasks, communications
  - customer_success: activities, tasks, communications
  - Only admin has delete on accounts, contacts, deals
  - sales_rep has no delete on accounts, contacts, deals
*/

-- ── 1. Role CHECK constraint ──────────────────────────────────────────────
-- (now defined correctly in 00001_foundation.sql — no ALTER needed here)

-- ── 2. Accounts: add sales_rep to INSERT/UPDATE ─────────────────────────────

DROP POLICY accounts_insert ON public.accounts;
CREATE POLICY accounts_insert ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY accounts_update ON public.accounts;
CREATE POLICY accounts_update ON public.accounts
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- accounts DELETE stays admin, sales_manager only (sales_rep has no accounts.delete)

-- ── 3. Account junction tables: add sales_rep to INSERT/UPDATE/DELETE ────────
-- (these follow accounts.write — if you can write accounts, you can manage junctions)

-- account_manual_services
DROP POLICY account_manual_services_insert ON public.account_manual_services;
CREATE POLICY account_manual_services_insert ON public.account_manual_services
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_manual_services_update ON public.account_manual_services;
CREATE POLICY account_manual_services_update ON public.account_manual_services
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_manual_services_delete ON public.account_manual_services;
CREATE POLICY account_manual_services_delete ON public.account_manual_services
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- account_tech_stacks
DROP POLICY account_tech_stacks_insert ON public.account_tech_stacks;
CREATE POLICY account_tech_stacks_insert ON public.account_tech_stacks
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_tech_stacks_update ON public.account_tech_stacks;
CREATE POLICY account_tech_stacks_update ON public.account_tech_stacks
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_tech_stacks_delete ON public.account_tech_stacks;
CREATE POLICY account_tech_stacks_delete ON public.account_tech_stacks
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- account_samenwerkingsvormen
DROP POLICY account_samenwerkingsvormen_insert ON public.account_samenwerkingsvormen;
CREATE POLICY account_samenwerkingsvormen_insert ON public.account_samenwerkingsvormen
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_samenwerkingsvormen_update ON public.account_samenwerkingsvormen;
CREATE POLICY account_samenwerkingsvormen_update ON public.account_samenwerkingsvormen
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_samenwerkingsvormen_delete ON public.account_samenwerkingsvormen;
CREATE POLICY account_samenwerkingsvormen_delete ON public.account_samenwerkingsvormen
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- account_hosting
DROP POLICY account_hosting_insert ON public.account_hosting;
CREATE POLICY account_hosting_insert ON public.account_hosting
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_hosting_update ON public.account_hosting;
CREATE POLICY account_hosting_update ON public.account_hosting
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_hosting_delete ON public.account_hosting;
CREATE POLICY account_hosting_delete ON public.account_hosting
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- account_competence_centers
DROP POLICY account_competence_centers_insert ON public.account_competence_centers;
CREATE POLICY account_competence_centers_insert ON public.account_competence_centers
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_competence_centers_update ON public.account_competence_centers;
CREATE POLICY account_competence_centers_update ON public.account_competence_centers
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_competence_centers_delete ON public.account_competence_centers;
CREATE POLICY account_competence_centers_delete ON public.account_competence_centers
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- account_cc_services
DROP POLICY account_cc_services_insert ON public.account_cc_services;
CREATE POLICY account_cc_services_insert ON public.account_cc_services
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_cc_services_update ON public.account_cc_services;
CREATE POLICY account_cc_services_update ON public.account_cc_services
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_cc_services_delete ON public.account_cc_services;
CREATE POLICY account_cc_services_delete ON public.account_cc_services
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- account_services
DROP POLICY account_services_insert ON public.account_services;
CREATE POLICY account_services_insert ON public.account_services
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_services_update ON public.account_services;
CREATE POLICY account_services_update ON public.account_services
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY account_services_delete ON public.account_services;
CREATE POLICY account_services_delete ON public.account_services
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- ── 4. Contacts: add sales_rep to INSERT/UPDATE ─────────────────────────────

DROP POLICY contacts_insert ON public.contacts;
CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY contacts_update ON public.contacts;
CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- contacts DELETE stays admin, sales_manager only

-- contact_personal_info (follows contacts.write)
DROP POLICY contact_personal_info_insert ON public.contact_personal_info;
CREATE POLICY contact_personal_info_insert ON public.contact_personal_info
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY contact_personal_info_update ON public.contact_personal_info;
CREATE POLICY contact_personal_info_update ON public.contact_personal_info
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- contact_personal_info DELETE stays admin, sales_manager only

-- ── 5. Communications: add sales_rep, customer_success to INSERT/UPDATE ─────

DROP POLICY communications_insert ON public.communications;
CREATE POLICY communications_insert ON public.communications
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

DROP POLICY communications_update ON public.communications;
CREATE POLICY communications_update ON public.communications
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

-- communications DELETE: also add sales_rep, customer_success (communications.write implies full CRUD)
DROP POLICY communications_delete ON public.communications;
CREATE POLICY communications_delete ON public.communications
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

-- ── 6. Deals: add sales_rep to INSERT/UPDATE ────────────────────────────────

DROP POLICY "deals_insert" ON deals;
CREATE POLICY "deals_insert" ON deals
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

DROP POLICY "deals_update" ON deals;
CREATE POLICY "deals_update" ON deals
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- deals DELETE stays admin, sales_manager only

-- ── 7. Activities: add sales_rep, customer_success to INSERT/UPDATE ─────────

DROP POLICY "activities_insert" ON activities;
CREATE POLICY "activities_insert" ON activities
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

DROP POLICY "activities_update" ON activities;
CREATE POLICY "activities_update" ON activities
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

-- activities DELETE: sales_rep has activities.delete, customer_success does not
DROP POLICY "activities_delete" ON activities;
CREATE POLICY "activities_delete" ON activities
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- ── 8. Tasks: add sales_rep, customer_success to INSERT/UPDATE ──────────────

DROP POLICY "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

DROP POLICY "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

-- tasks DELETE: sales_rep has tasks.delete, customer_success does not
DROP POLICY "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

-- ── 9. Update sync_account_fk_relation to include sales_rep ─────────────────

CREATE OR REPLACE FUNCTION public.sync_account_fk_relation(
  p_account_id  uuid,
  p_table       text,
  p_rows        jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role    text;
  v_allowed text[] := ARRAY[
    'account_tech_stacks',
    'account_samenwerkingsvormen',
    'account_services',
    'account_manual_services'
  ];
  v_cols  text;
  v_vals  text;
  v_keys  text[];
  v_key   text;
BEGIN
  -- Auth guard: admin, sales_manager, and sales_rep may call this function
  SELECT role INTO v_role FROM user_profiles WHERE id = (SELECT auth.uid());
  IF v_role NOT IN ('admin', 'sales_manager', 'sales_rep') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Guard against SQL injection via table name
  IF NOT (p_table = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Table "%" is not allowed for sync_account_fk_relation', p_table;
  END IF;

  -- Delete existing rows for this account
  EXECUTE format(
    'DELETE FROM %I WHERE account_id = $1',
    p_table
  ) USING p_account_id;

  -- Insert new rows using only the keys present in the JSON objects
  IF jsonb_array_length(p_rows) > 0 THEN
    SELECT array_agg(k ORDER BY k) INTO v_keys FROM jsonb_object_keys(p_rows->0) AS k;

    SELECT
      string_agg(format('%I', k), ', ' ORDER BY k),
      string_agg(format('(elem->>%L)::%s', k, col.data_type_cast), ', ' ORDER BY k)
    INTO v_cols, v_vals
    FROM unnest(v_keys) AS k
    LEFT JOIN LATERAL (
      SELECT CASE c.udt_name
        WHEN 'uuid' THEN 'uuid'
        WHEN 'timestamptz' THEN 'timestamptz'
        WHEN 'timestamp' THEN 'timestamp'
        ELSE 'text'
      END AS data_type_cast
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = p_table AND c.column_name = k
    ) col ON true;

    EXECUTE format(
      'INSERT INTO %I (%s) SELECT %s FROM jsonb_array_elements($1) AS elem',
      p_table, v_cols, v_vals
    ) USING p_rows;
  END IF;
END;
$$;
