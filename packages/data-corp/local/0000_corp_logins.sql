-- The corp roles' LOCAL logins. LOCAL ONLY — never pushed (see data-pg's
-- local/0000_supabase_compat.sql for why logins live outside the migrations).
--
-- The migrations create both roles NOLOGIN, so a hosted project gets its
-- logins and secret passwords from the operator (scripts/hosted/roles.ts in
-- data-pg). Here they get the throwaway passwords every local role uses.
-- Applied BEFORE drizzle/, and idempotent: `db-local.sh apply` may re-run it.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_corp') THEN
    CREATE ROLE xangarro_corp LOGIN PASSWORD 'xangarro_corp';
  ELSE
    ALTER ROLE xangarro_corp LOGIN PASSWORD 'xangarro_corp';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_corp_agent') THEN
    CREATE ROLE xangarro_corp_agent LOGIN PASSWORD 'xangarro_corp_agent';
  ELSE
    ALTER ROLE xangarro_corp_agent LOGIN PASSWORD 'xangarro_corp_agent';
  END IF;
END
$$;
