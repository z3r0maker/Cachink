-- Membership lookup at sign-in.
--
-- Every tenant table is behind `tenant_isolation`, which reads
-- `xangarro.current_business_id()`. That is exactly right everywhere except
-- here: sign-in is the query that *decides* which business the session belongs
-- to, so it cannot already be scoped to one. Run as `xangarro_app` with no
-- claim set, `SELECT … FROM business_members` correctly returns zero rows, and
-- the portal concludes the account belongs to no business.
--
-- The fix is not to hand the application a role that bypasses RLS — that would
-- put a BYPASSRLS credential in the app's hands for the sake of one lookup, and
-- every other query would be one mistake away from reading across tenants.
--
-- Instead: one `SECURITY DEFINER` function that answers exactly one question —
-- "which businesses does *this* user belong to" — and returns nothing else. It
-- runs as its owner, so RLS does not apply inside it, and its entire surface is
-- a single user id in and membership rows out.
--
-- `search_path` is pinned and `pg_temp` excluded: without that, a caller can
-- create a shadowing object in a schema earlier on the path and have this
-- function execute it with the owner's privileges. That is the classic
-- SECURITY DEFINER escalation, and the pin is the whole defence.

CREATE OR REPLACE FUNCTION xangarro.memberships_for_user(p_user_id text)
RETURNS TABLE (business_id text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  -- No soft-delete filter: `business_members` carries `tenantStamps`, which has
  -- no `deleted_at`. Revoking access removes the row. If that ever becomes a
  -- soft delete, this function is the one place that has to learn about it.
  SELECT m.business_id, m.role
  FROM public.business_members m
  WHERE m.user_id = p_user_id
  ORDER BY m.created_at;
$$;

-- EXECUTE only; the function body is what constrains the result, not the grant.
REVOKE ALL ON FUNCTION xangarro.memberships_for_user(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.memberships_for_user(text) TO xangarro_app;
