-- ============================================================================
-- Migration: Activities and Tasks
-- ============================================================================

-- ── activities ──────────────────────────────────────────────────────────────
CREATE TABLE activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text NOT NULL CHECK (type IN ('Meeting', 'Demo', 'Call', 'E-mail', 'Lunch', 'Event')),
  subject           text NOT NULL,
  date              timestamptz NOT NULL,
  duration_minutes  int,
  account_id        uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  deal_id           uuid REFERENCES deals(id) ON DELETE SET NULL,
  owner_id          uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes             jsonb,
  is_done           bool NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_activities_account ON activities(account_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_owner ON activities(owner_id);
CREATE INDEX idx_activities_date ON activities(date DESC);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON activities FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "activities_insert" ON activities FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "activities_update" ON activities FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "activities_delete" ON activities FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.activities TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE activities;

-- ── tasks ───────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  due_date        date,
  priority        text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status          text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Done')),
  account_id      uuid REFERENCES accounts(id) ON DELETE SET NULL,
  deal_id         uuid REFERENCES deals(id) ON DELETE SET NULL,
  assigned_to     uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_tasks_account ON tasks(account_id);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK (get_user_role() IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated
  USING (get_user_role() IN ('admin', 'sales_manager'));

GRANT INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
