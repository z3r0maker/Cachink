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

  -- The Stripe webhook's writer (B-10, ADR-063). Its grants are in
  -- drizzle/0007_billing_grants.sql, which creates it NOLOGIN where this file
  -- has not run.
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_billing') THEN
    CREATE ROLE xangarro_billing LOGIN PASSWORD 'xangarro_billing';
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

-- auth.users — the identity store.
--
-- Column names and types are Supabase's, so the portal's queries read the same
-- on a hosted project as they do here. What differs is who *writes* the table:
-- locally the seed and the signup action do, on Supabase GoTrue does. That is a
-- change of issuer, not of every query downstream, which is the whole point of
-- keeping the shape.
--
-- `encrypted_password` is bcrypt on both sides, so the login check is identical.
-- No RLS: this table is reached only through the server, never PostgREST, and
-- on Supabase it lives outside the API schema entirely.
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  encrypted_password text,
  email_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, xangarro_app;
GRANT EXECUTE ON FUNCTION auth.jwt(), auth.uid(), auth.role(), auth.email()
  TO anon, authenticated, service_role, xangarro_app;
GRANT SELECT, INSERT, UPDATE ON auth.users TO service_role;
-- The app role may write identities (seed, signup) and read who they are, but
-- **not** `encrypted_password`: a query mistake must not be able to dump every
-- tenant's hashes (audit SEC-AUTH-02). Sign-in reads one account's hash through
-- `xangarro.login_lookup` (drizzle/0005). REVOKE first so a re-apply narrows an
-- older, wider grant.
REVOKE SELECT ON auth.users FROM xangarro_app;
GRANT SELECT (id, email, email_confirmed_at, created_at, updated_at), INSERT, UPDATE
  ON auth.users TO xangarro_app;
