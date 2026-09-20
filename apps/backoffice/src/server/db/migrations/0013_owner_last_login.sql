-- N-06's "Último acceso del dueño" column, real data at last: the portal's
-- own session table (`xangarro.portal_sessions`, data-pg 0005) touches
-- `last_seen_at` on every request `xangarro.session_resolve` accepts, so
-- `max(last_seen_at)` over a business's live sessions IS the owner's last
-- login. The console reads it through one SECURITY DEFINER function that
-- returns nothing but (business_id, last_login) — no session hashes, no
-- user ids, no expiry oracle — and only for the admin role, exactly the
-- `0010_admin_user_email` pattern.

CREATE OR REPLACE FUNCTION xangarro.owner_last_login()
RETURNS TABLE (business_id text, last_login timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT p.business_id, max(p.last_seen_at)
    FROM xangarro.portal_sessions p
   WHERE p.revoked_at IS NULL
     AND p.expires_at > now()
   GROUP BY p.business_id
$$;

REVOKE ALL ON FUNCTION xangarro.owner_last_login() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.owner_last_login() TO xangarro_admin;
