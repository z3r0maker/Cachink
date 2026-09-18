-- A member's email for the console's tenant pages (N-06), without any grant on
-- `auth.users`.
--
-- 0004 used to grant SELECT (id, email) ON auth.users to xangarro_admin. On
-- hosted Supabase `auth.users` belongs to supabase_auth_admin and `postgres`
-- holds no GRANT OPTION on it, so that grant cannot be made (db:migrate:hosted
-- preflight blocker). Like data-pg's `xangarro.owner_email` (0011), one
-- SECURITY DEFINER function answers exactly one question — "this user's
-- email" — and nothing else. `search_path` is pinned so a caller cannot shadow
-- the objects it reads. The password hash is never reachable through it.
--
-- EXECUTE goes to xangarro_admin only.

CREATE OR REPLACE FUNCTION xangarro.admin_user_email(p_user_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT u.email FROM auth.users u WHERE u.id::text = p_user_id;
$$;

REVOKE ALL ON FUNCTION xangarro.admin_user_email(text) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT EXECUTE ON FUNCTION xangarro.admin_user_email(text) TO xangarro_admin;
    -- Local databases that applied the old 0004 still carry its column grant;
    -- take it back so every environment converges. Nothing to revoke on hosted.
    BEGIN
      REVOKE SELECT (id, email) ON auth.users FROM xangarro_admin;
      REVOKE USAGE ON SCHEMA auth FROM xangarro_admin;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
  END IF;
END
$$;
