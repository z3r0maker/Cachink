-- Support functions for the throttle and portal sessions of 0005 (B-16).
-- Same pattern: SECURITY DEFINER, pinned search_path, EXECUTE only.

-- Delete what can no longer matter: throttle rows neither locked nor inside
-- any counting window, and sessions a day past expiry or revocation. Expired
-- rows are already inert (every lookup checks times); this only keeps the
-- tables small. Returns how many rows went, for the job's log.
CREATE OR REPLACE FUNCTION xangarro.security_prune()
RETURNS TABLE (throttle_rows integer, session_rows integer)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  t integer;
  s integer;
BEGIN
  DELETE FROM xangarro.throttle
  WHERE coalesce(locked_until, '-infinity') < now()
    AND window_start < now() - interval '1 day';
  GET DIAGNOSTICS t = ROW_COUNT;
  DELETE FROM xangarro.portal_sessions
  WHERE expires_at < now() - interval '1 day'
     OR revoked_at < now() - interval '1 day';
  GET DIAGNOSTICS s = ROW_COUNT;
  RETURN QUERY SELECT t, s;
END
$$;

-- "Sign this person out everywhere": after a password reset, a lost laptop, or
-- removing someone who must not wait for their next request. Returns how many
-- live sessions it ended.
CREATE OR REPLACE FUNCTION xangarro.session_revoke_user(p_user uuid)
RETURNS integer
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  WITH ended AS (
    UPDATE xangarro.portal_sessions SET revoked_at = now()
    WHERE user_id = p_user AND revoked_at IS NULL
    RETURNING 1
  )
  SELECT count(*)::integer FROM ended;
$$;

REVOKE ALL ON FUNCTION xangarro.security_prune(), xangarro.session_revoke_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.security_prune(), xangarro.session_revoke_user(uuid)
  TO xangarro_app;
