-- divisions and revenue_clients were missing GRANT statements.
-- Without table-level grants, RLS policies are useless for authenticated users.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.divisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_clients TO authenticated;
