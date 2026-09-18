-- Staff allowlist and audit log for the admin console (N-05, ADR-063).
--
-- Temporary home: see ../schema.ts. When this moves to packages/data-pg it
-- must be applied AFTER 0001_rls.sql, whose ALTER DEFAULT PRIVILEGES would
-- otherwise hand these tables to the portal's role — which is exactly what
-- the REVOKE below undoes if the order is ever wrong.

CREATE TABLE IF NOT EXISTS public.staff_members (
  id          text PRIMARY KEY,
  user_id     text NOT NULL UNIQUE,
  email       text NOT NULL,
  nombre      text NOT NULL,
  created_at  timestamptz NOT NULL,
  revoked_at  timestamptz
);

CREATE TABLE IF NOT EXISTS public.staff_audit_log (
  id           text PRIMARY KEY,
  staff_id     text NOT NULL REFERENCES public.staff_members (id),
  action       text NOT NULL CHECK (action ~ '^[a-z]+(\.[a-z][a-z_]*)+$'),
  business_id  text,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  at           timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS staff_audit_log_at_idx ON public.staff_audit_log (at);
CREATE INDEX IF NOT EXISTS staff_audit_log_business_at_idx
  ON public.staff_audit_log (business_id, at);

-- The customer portal must never see who the staff are or what they did.
-- RLS on with no policy denies every non-owner role; the REVOKE removes the
-- grants 0001_rls.sql's default privileges gave xangarro_app.
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_log FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON public.staff_members, public.staff_audit_log FROM xangarro_app;
  END IF;

  -- The admin console's own login role is provisioned out of band (like
  -- xangarro_app). The audit log is append-only for it: no UPDATE, no DELETE.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT SELECT ON public.staff_members TO xangarro_admin;
    GRANT SELECT, INSERT ON public.staff_audit_log TO xangarro_admin;
    DROP POLICY IF EXISTS staff_admin_read ON public.staff_members;
    DROP POLICY IF EXISTS staff_audit_admin ON public.staff_audit_log;
    EXECUTE 'CREATE POLICY staff_admin_read ON public.staff_members
               FOR SELECT TO xangarro_admin USING (true)';
    EXECUTE 'CREATE POLICY staff_audit_admin ON public.staff_audit_log
               FOR ALL TO xangarro_admin USING (true) WITH CHECK (true)';
  END IF;
END
$$;
