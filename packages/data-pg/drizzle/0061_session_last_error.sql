-- 0061: a portal session remembers the last error it was shown (P-48,
-- ADR-162 §8).
--
-- «Algo no funciona» in the portal's Ayuda files a report that names the last
-- error of the person's session. That error's Sentry event id is kept here,
-- with the session and on the server, so it never travels in a URL and the
-- browser never chooses it.
--
-- Same pattern as 0005 and 0057: the table lives in the `xangarro` schema,
-- where the app role has no table privileges, and is reached only through the
-- SECURITY DEFINER functions below, each with a pinned `search_path`.
--
-- `SET LOCAL`: the timeout dies with this file's transaction (R2-13), and the
-- hosted runner retries the whole file when it expires (ADR-119).
SET LOCAL lock_timeout = '200ms';

-- Two nullable columns without a default: no rewrite, and every session that
-- is already open reads as having seen no error.
ALTER TABLE xangarro.portal_sessions ADD COLUMN IF NOT EXISTS last_error_event_id text;
ALTER TABLE xangarro.portal_sessions ADD COLUMN IF NOT EXISTS last_error_at timestamptz;

-- Keep the error a live session was just shown; the newest replaces the one
-- before. False for a session that is not live, and for anything that is not a
-- Sentry event id (32 lower-case hex), so the column only ever names an event.
CREATE OR REPLACE FUNCTION xangarro.session_note_error(p_hash text, p_event_id text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF p_event_id IS NULL OR p_event_id !~ '^[0-9a-f]{32}$' THEN
    RETURN false;
  END IF;
  UPDATE xangarro.portal_sessions
     SET last_error_event_id = p_event_id, last_error_at = now()
   WHERE token_hash = p_hash AND revoked_at IS NULL AND expires_at > now();
  RETURN FOUND;
END
$$;

-- The last error a live session was shown, and when. No row: none, or the
-- session is not live.
CREATE OR REPLACE FUNCTION xangarro.session_last_error(p_hash text)
RETURNS TABLE (event_id text, at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT s.last_error_event_id, s.last_error_at
    FROM xangarro.portal_sessions s
   WHERE s.token_hash = p_hash AND s.revoked_at IS NULL AND s.expires_at > now()
     AND s.last_error_event_id IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION
  xangarro.session_note_error(text, text), xangarro.session_last_error(text)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  xangarro.session_note_error(text, text), xangarro.session_last_error(text)
TO xangarro_app;
