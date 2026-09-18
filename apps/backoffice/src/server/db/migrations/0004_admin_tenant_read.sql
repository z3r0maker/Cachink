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
-- auth.users: the owner's email only (column-level grant). last_sign_in_at
-- exists on hosted Supabase but not in data-pg's local compat table, so it is
-- not granted until both sides have it.

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

  GRANT USAGE ON SCHEMA auth TO xangarro_admin;
  GRANT SELECT (id, email) ON auth.users TO xangarro_admin;
END
$$;
