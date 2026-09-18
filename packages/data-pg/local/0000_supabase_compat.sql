-- Supabase compatibility for the local container. LOCAL ONLY — never pushed.
--
-- On a hosted Supabase project the platform provisions, before any migration
-- runs: the `auth` schema; the `anon`, `authenticated` and `service_role`
-- roles; and `auth.uid()` / `auth.jwt()` / `auth.role()`. A plain
-- `postgres:17-alpine` has none of them. Without this file, SQL that is correct
-- in production cannot be applied locally — or, worse, gets written to avoid
-- the production surface and is therefore never exercised anywhere. The
-- `request.jwt.claims` branch of `xangarro.current_business_id()` spent its
-- whole life in exactly that state: no test set it until this layer landed,
-- and the first one that did found a live defect (see `0001_rls.sql`).
--
-- This file lives OUTSIDE `drizzle/` on purpose. `drizzle/` is the migration
-- set a real project receives, where every statement below would either fail
-- (`CREATE ROLE anon`) or do real damage (`CREATE OR REPLACE FUNCTION
-- auth.uid()` replacing the platform's own). `db-local.sh` also applies its
-- globs alphabetically, so a compat file numbered into `drizzle/` would run
-- *after* the migrations — the wrong order for anything that grants to a role
-- defined here.
--
-- The function bodies are transcribed from Supabase's own definitions rather
-- than reinvented: a stub that is merely *similar* is a local-only bug farm.
--
-- Every statement is idempotent — `db-local.sh up` re-applies on each start.

CREATE SCHEMA IF NOT EXISTS auth;

-- Supabase's three request roles, plus the application's own login role.
--
-- `xangarro_app` is provisioned HERE rather than in `drizzle/0001_rls.sql`
-- because a migration carrying `CREATE ROLE … LOGIN PASSWORD 'xangarro_app'`
-- would, the first time anyone ran `supabase db push`, create a login role on
-- the production database with a password published in this repository. Role
-- provisioning is environment-specific; policies are not.
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN NOINHERIT', r);
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    CREATE ROLE xangarro_app LOGIN PASSWORD 'xangarro_app';
  END IF;
END
$$;

-- Membership, not impersonation. Postgres decides whether a policy's
-- `TO <role>` clause applies by role **membership** (`is_member_of_role`), so
-- when B-03 writes `CREATE POLICY … TO authenticated` that policy will bind for
-- the local `xangarro_app` connection exactly as it binds for a PostgREST
-- request on Supabase. It also makes `SET ROLE authenticated` available, which
-- is what lets a test assert the hosted posture locally.
GRANT authenticated TO xangarro_app;

-- auth.jwt() — transcribed from Supabase.
-- The `nullif(…, '')` is not decoration: `''::jsonb` raises 22P02, and an empty
-- `request.jwt.claims` is a state PostgREST produces.
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb;
$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ),
    ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  );
$$;

CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  );
$$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, xangarro_app;
GRANT EXECUTE ON FUNCTION auth.jwt(), auth.uid(), auth.role(), auth.email()
  TO anon, authenticated, service_role, xangarro_app;
