-- 0046: what every portal navigation costs the database (audit DB2-PAGE-01).
--
-- 1. `session_resolve` UPDATEd `last_seen_at` on every request: one row
--    write, one WAL record and one dead tuple per page view. It now reads
--    first and touches the row only when the stored stamp is more than a
--    minute old. Idleness is still judged against the stored stamp, so a
--    session can be ended up to a minute earlier than before, never later.
--    Same signature and result, so every caller is unchanged.
--
-- 2. `negocios_for_user` is `memberships_for_user` plus the business's name.
--    The switcher used to open one tenant transaction per membership just to
--    read that name. It is SECURITY DEFINER for the same reason as its twin:
--    the lookup happens before a tenant is chosen, and it returns only the
--    caller's own memberships.
SET lock_timeout = '3s';

CREATE OR REPLACE FUNCTION xangarro.session_resolve(p_hash text, p_idle integer)
RETURNS TABLE (user_id text, email text, nombre text, business_id text, role text)
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  WITH hit AS (
    SELECT s.token_hash, s.last_seen_at, s.user_id::text AS user_id, u.email,
           NULLIF(btrim(coalesce(u.raw_user_meta_data->>'nombre', '')), '') AS nombre,
           s.business_id, m.role
      FROM xangarro.portal_sessions s
      JOIN auth.users u ON u.id = s.user_id
      JOIN public.business_members m
        ON m.user_id = s.user_id::text AND m.business_id = s.business_id
     WHERE s.token_hash = p_hash
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND s.last_seen_at > now() - make_interval(secs => p_idle)
  ),
  touch AS (
    UPDATE xangarro.portal_sessions s SET last_seen_at = now()
      FROM hit
     WHERE s.token_hash = hit.token_hash
       AND hit.last_seen_at < now() - interval '60 seconds'
  )
  SELECT hit.user_id, hit.email, hit.nombre, hit.business_id, hit.role FROM hit;
$$;

REVOKE ALL ON FUNCTION xangarro.session_resolve(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.session_resolve(text, integer) TO xangarro_app;

CREATE OR REPLACE FUNCTION xangarro.negocios_for_user(p_user_id text)
RETURNS TABLE (business_id text, role text, nombre text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT m.business_id, m.role, b.nombre
  FROM public.business_members m
  JOIN public.businesses b ON b.id = m.business_id AND b.deleted_at IS NULL
  WHERE m.user_id = p_user_id
  ORDER BY m.created_at;
$$;

REVOKE ALL ON FUNCTION xangarro.negocios_for_user(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.negocios_for_user(text) TO xangarro_app;
