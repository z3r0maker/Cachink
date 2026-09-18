-- SELF-TEST ONLY. Makes a throwaway postgres:17 container look like a fresh
-- hosted Supabase project, as far as `db:migrate:hosted` can tell. Run as the
-- container's superuser (`supabase_admin`, as on Supabase).
--
-- What it models: `postgres` is NOT a superuser but has CREATEROLE and
-- BYPASSRLS; the platform roles exist; `auth` is owned by the auth service and
-- `auth.users` has GoTrue's shape (the columns the portal uses, the partial
-- unique email index, nullable timestamps); Supabase's default privileges hand
-- anon/authenticated/service_role ALL on whatever `postgres` creates in public.
--
-- What it assumes and hosted must confirm: that `postgres` holds USAGE on
-- `auth` and SELECT/INSERT/UPDATE on `auth.users` WITH GRANT OPTION. The
-- script's preflight checks exactly that on the real project.
CREATE ROLE postgres LOGIN PASSWORD 'selftest' CREATEROLE CREATEDB REPLICATION BYPASSRLS;
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
CREATE ROLE supabase_auth_admin NOLOGIN;

CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;
CREATE TABLE auth.users (
  instance_id uuid,
  id uuid PRIMARY KEY,
  aud varchar(255),
  role varchar(255),
  email varchar(255),
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  is_sso_user boolean NOT NULL DEFAULT false,
  is_anonymous boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX users_email_partial_key ON auth.users (email) WHERE is_sso_user = false;
ALTER TABLE auth.users OWNER TO supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres WITH GRANT OPTION;
GRANT ALL ON auth.users TO postgres WITH GRANT OPTION;

GRANT CREATE ON DATABASE postgres TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
