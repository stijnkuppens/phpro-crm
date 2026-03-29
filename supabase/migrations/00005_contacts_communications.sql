/*
  Migration: Contacts, contact personal info, and communications
  Creates:
  - contacts: people associated with accounts
  - contact_personal_info: 1:1 extension with private/personal data
  - communications: messages/interactions linked to accounts and contacts
*/

-- ── contacts ────────────────────────────────────────────────────────────────

CREATE TABLE public.contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name  text NOT NULL,
  email      text,
  phone      text,
  title      text,
  role       text CHECK (role IN (
               'Decision Maker', 'Influencer', 'Champion', 'Sponsor',
               'Steerco Lid', 'Technisch', 'Financieel', 'Operationeel', 'Contact'
             )),
  is_steerco bool NOT NULL DEFAULT false,
  is_pinned  bool NOT NULL DEFAULT false,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_contacts_account ON public.contacts(account_id);
CREATE INDEX idx_contacts_name ON public.contacts(last_name, first_name);
CREATE INDEX idx_contacts_first_name_trgm ON contacts USING gin (first_name gin_trgm_ops);
CREATE INDEX idx_contacts_last_name_trgm ON contacts USING gin (last_name gin_trgm_ops);
CREATE INDEX idx_contacts_email_trgm ON contacts USING gin (email gin_trgm_ops);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_select ON public.contacts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;

-- ── contact_personal_info ───────────────────────────────────────────────────

CREATE TABLE public.contact_personal_info (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id         uuid NOT NULL UNIQUE REFERENCES public.contacts(id) ON DELETE CASCADE,
  hobbies            text[] DEFAULT '{}',
  marital_status     text,
  has_children       bool DEFAULT false,
  children_count     int DEFAULT 0,
  children_names     text,
  birthday           text,
  partner_name       text,
  partner_profession text,
  notes              text,
  invite_dinner      bool DEFAULT false,
  invite_event       bool DEFAULT false,
  invite_gift        bool DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_contact_personal_info_updated_at
  BEFORE UPDATE ON public.contact_personal_info
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_contact_personal_info_contact ON public.contact_personal_info(contact_id);

ALTER TABLE public.contact_personal_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY contact_personal_info_select ON public.contact_personal_info
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY contact_personal_info_insert ON public.contact_personal_info
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY contact_personal_info_update ON public.contact_personal_info
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep'));

CREATE POLICY contact_personal_info_delete ON public.contact_personal_info
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_personal_info TO authenticated;

-- ── communications ──────────────────────────────────────────────────────────

CREATE TABLE public.communications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id       uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id       uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id          uuid, -- FK to deals added in 00006_deals_activities.sql
  type             text NOT NULL CHECK (type IN ('email', 'note', 'meeting', 'call')),
  subject          text NOT NULL,
  "to"             text,
  date             timestamptz NOT NULL DEFAULT now(),
  duration_minutes int,
  content          jsonb,
  is_done          bool NOT NULL DEFAULT false,
  owner_id         uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_communications_updated_at
  BEFORE UPDATE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE INDEX idx_communications_account ON public.communications(account_id);
CREATE INDEX idx_communications_contact ON public.communications(contact_id);
CREATE INDEX idx_communications_owner ON public.communications(owner_id);
CREATE INDEX idx_communications_date ON public.communications(date DESC);

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY communications_select ON public.communications
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY communications_insert ON public.communications
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

CREATE POLICY communications_update ON public.communications
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'))
  WITH CHECK ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

CREATE POLICY communications_delete ON public.communications
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) IN ('admin', 'sales_manager', 'sales_rep', 'customer_success'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communications TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.communications;
