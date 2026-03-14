-- Drop old contacts table from starter template (00002_contacts_example.sql)
-- Layer 2 will recreate this table with the CRM schema
DROP POLICY IF EXISTS "authenticated_can_read_contacts" ON public.contacts;
DROP POLICY IF EXISTS "editors_can_insert_contacts" ON public.contacts;
DROP POLICY IF EXISTS "editors_can_update_contacts" ON public.contacts;
DROP POLICY IF EXISTS "admins_can_delete_contacts" ON public.contacts;
DROP TABLE IF EXISTS public.contacts CASCADE;
