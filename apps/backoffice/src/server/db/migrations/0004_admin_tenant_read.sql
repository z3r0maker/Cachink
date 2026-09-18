-- Cross-tenant READ for the admin console's tenant pages (N-06, ADR-063).
--
-- data-pg's 0001_rls.sql isolates every tenant table with a `tenant_isolation`
-- policy keyed on the request's business. Policies are permissive and OR'ed,
-- so a second policy scoped TO xangarro_admin FOR SELECT lets the console read
-- across tenants without touching what xangarro_app sees, and without any
-- write: no INSERT/UPDATE/DELETE grant on tenant data is ever given here.
--
-- Only the three tables N-06 reads. Anything more (usage in N-07, sync
-- health in N-46) adds its table in its own migration, deliberately.
--
-- auth.users: no grant here. Member emails come from the SECURITY DEFINER
-- function in 0010 — hosted `postgres` cannot re-grant auth.users (it has no
-- GRANT OPTION there), so a column grant would block db:migrate:hosted.

DO $$
DECLARE
  t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    RETURN;
  END IF;

  FOREACH t IN ARRAY ARRAY['businesses', 'business_members', 'devices'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO xangarro_admin', t);
    EXECUTE format('DROP POLICY IF EXISTS admin_read ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY admin_read ON public.%I FOR SELECT TO xangarro_admin USING (true)', t
    );
  END LOOP;
END
$$;
