-- Example entity: contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  notes text,
  avatar_url text,
  created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique email when present
CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_unique ON public.contacts (email) WHERE email IS NOT NULL;

-- Index for common queries
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON public.contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS contacts_name_idx ON public.contacts (name);
CREATE INDEX IF NOT EXISTS contacts_created_by_idx ON public.contacts (created_by);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.contacts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable Realtime (ignore if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
