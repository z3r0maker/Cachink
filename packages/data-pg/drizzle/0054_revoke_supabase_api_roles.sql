-- 0054: close Supabase's second front door (audit SEC-DATA-01, ADR-138).
--
-- A hosted Supabase project exposes `public` over its Data API (PostgREST) and,
-- by default, grants every table there to `anon` and `authenticated`, and sets
-- default privileges so every new table gets the same. Xangarro never uses that
-- door: the portal, the console and the push API connect as their own
-- restricted logins (`xangarro_app`, `xangarro_billing`, …), whose grants are
-- direct, and the phone's bug reports go through an edge function that writes
-- with the service role. So the two API roles lose everything on Xangarro's
-- tables, sequences and functions, now and for objects created later.
--
-- Turning the Data API off in the dashboard (O-2) is still the first wall; this
-- is the second, so a forgotten toggle or a leaked anon key opens nothing.
--
-- Each step is guarded: the roles exist on Supabase and in the local compat
-- layer, and the default-privilege owners differ between the two. A step the
-- runner may not perform is reported, never fatal, so the file applies on both.

SET LOCAL lock_timeout = '200ms';

DO $$
DECLARE
  api_role text;
  owner_role text;
  target text;
  kind text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    CONTINUE WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role);

    FOREACH target IN ARRAY ARRAY['public', 'xangarro'] LOOP
      FOREACH kind IN ARRAY ARRAY['TABLES', 'SEQUENCES', 'FUNCTIONS'] LOOP
        EXECUTE format('REVOKE ALL ON ALL %s IN SCHEMA %I FROM %I', kind, target, api_role);
      END LOOP;
    END LOOP;
    -- `xangarro` is Xangarro's alone; `public` keeps USAGE, which Supabase's own
    -- tooling expects, and holds nothing these roles may touch.
    EXECUTE format('REVOKE ALL ON SCHEMA xangarro FROM %I', api_role);

    -- Objects created later: Supabase sets default privileges for the roles
    -- that create tables (`postgres`, `supabase_admin`); the local runner is
    -- `postgres` too.
    FOR owner_role IN
      SELECT rolname FROM pg_roles WHERE rolname IN ('postgres', 'supabase_admin')
    LOOP
      FOREACH kind IN ARRAY ARRAY['TABLES', 'SEQUENCES', 'FUNCTIONS'] LOOP
        BEGIN
          EXECUTE format(
            'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON %s FROM %I',
            owner_role, kind, api_role);
        EXCEPTION WHEN insufficient_privilege THEN
          RAISE NOTICE 'default privileges of % on % left to the dashboard (O-2)', owner_role, kind;
        END;
      END LOOP;
    END LOOP;
  END LOOP;
END
$$;
