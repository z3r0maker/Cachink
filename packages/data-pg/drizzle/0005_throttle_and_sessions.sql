-- Throttling, server-side portal sessions and the login lookup (B-17; security
-- audit SEC-AUTH-01, SEC-AUTH-02, SEC-DEV-01).
--
-- All three live in the `xangarro` schema, where the app role has no table
-- privileges, and are reached only through the SECURITY DEFINER functions
-- below. Same pattern and the same pinned `search_path` as 0002: the function
-- body is the whole surface.

-- ── Throttle ────────────────────────────────────────────────────────────────
-- `key` is a SHA-256 the server computes, e.g. of "login:email:<address>" —
-- never the email or IP itself, so the table holds no personal data.
CREATE TABLE IF NOT EXISTS xangarro.throttle (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL,
  locked_until timestamptz
);
REVOKE ALL ON xangarro.throttle FROM PUBLIC;

-- Seconds until `p_key` may try again; 0 means go.
CREATE OR REPLACE FUNCTION xangarro.throttle_wait(p_key text)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT coalesce(max(ceil(extract(epoch FROM t.locked_until - now())))::integer, 0)
  FROM xangarro.throttle t
  WHERE t.key = p_key AND t.locked_until > now();
$$;

-- Record one failure. The `p_max`-th failure inside `p_window` seconds locks the
-- key for `p_lockout` seconds; the return is that wait, or 0.
CREATE OR REPLACE FUNCTION xangarro.throttle_fail(
  p_key text, p_max integer, p_window integer, p_lockout integer
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  n integer;
BEGIN
  INSERT INTO xangarro.throttle AS t (key, window_start, hits)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE WHEN t.window_start < now() - make_interval(secs => p_window) THEN 1 ELSE t.hits + 1 END,
    window_start = CASE WHEN t.window_start < now() - make_interval(secs => p_window) THEN now() ELSE t.window_start END
  RETURNING hits INTO n;
  IF n >= p_max THEN
    UPDATE xangarro.throttle SET locked_until = now() + make_interval(secs => p_lockout), hits = 0, window_start = now()
    WHERE key = p_key;
    RETURN p_lockout;
  END IF;
  RETURN 0;
END
$$;

-- A fixed-window allowance: up to `p_max` takes per `p_window` seconds. The
-- return is 0 when this take is allowed, else the seconds left in the window.
CREATE OR REPLACE FUNCTION xangarro.throttle_take(p_key text, p_max integer, p_window integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  n integer;
  started timestamptz;
BEGIN
  INSERT INTO xangarro.throttle AS t (key, window_start, hits)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE WHEN t.window_start < now() - make_interval(secs => p_window) THEN 1 ELSE t.hits + 1 END,
    window_start = CASE WHEN t.window_start < now() - make_interval(secs => p_window) THEN now() ELSE t.window_start END
  RETURNING hits, window_start INTO n, started;
  IF n > p_max THEN
    RETURN greatest(1, ceil(extract(epoch FROM started + make_interval(secs => p_window) - now()))::integer);
  END IF;
  RETURN 0;
END
$$;

CREATE OR REPLACE FUNCTION xangarro.throttle_clear(p_key text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  DELETE FROM xangarro.throttle WHERE key = p_key;
$$;

-- ── Portal sessions ─────────────────────────────────────────────────────────
-- The cookie is 256 random bits; only its SHA-256 is stored, so a copy of this
-- table opens nothing. A session ends at `expires_at`, after `idle` seconds
-- unseen, on logout — and the moment its membership is removed, because
-- `session_resolve` reads the member's role **now**, not the role at sign-in.
CREATE TABLE IF NOT EXISTS xangarro.portal_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL,
  business_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS portal_sessions_user_idx ON xangarro.portal_sessions (user_id);
REVOKE ALL ON xangarro.portal_sessions FROM PUBLIC;

CREATE OR REPLACE FUNCTION xangarro.session_open(
  p_hash text, p_user uuid, p_business text, p_ttl integer
) RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  INSERT INTO xangarro.portal_sessions (token_hash, user_id, business_id, expires_at)
  VALUES (p_hash, p_user, p_business, now() + make_interval(secs => p_ttl));
$$;

CREATE OR REPLACE FUNCTION xangarro.session_resolve(p_hash text, p_idle integer)
RETURNS TABLE (user_id text, email text, business_id text, role text)
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  UPDATE xangarro.portal_sessions s SET last_seen_at = now()
  FROM auth.users u, public.business_members m
  WHERE s.token_hash = p_hash
    AND s.revoked_at IS NULL
    AND s.expires_at > now()
    AND s.last_seen_at > now() - make_interval(secs => p_idle)
    AND u.id = s.user_id
    AND m.user_id = s.user_id::text
    AND m.business_id = s.business_id
  RETURNING s.user_id::text, u.email, s.business_id, m.role;
$$;

CREATE OR REPLACE FUNCTION xangarro.session_revoke(p_hash text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  UPDATE xangarro.portal_sessions SET revoked_at = now()
  WHERE token_hash = p_hash AND revoked_at IS NULL;
$$;

-- ── Login lookup ────────────────────────────────────────────────────────────
-- The app role cannot read `encrypted_password` (column grants in the local
-- compat layer). Sign-in asks for exactly one account's hash, by email.
CREATE OR REPLACE FUNCTION xangarro.login_lookup(p_email text)
RETURNS TABLE (id text, email text, encrypted_password text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT u.id::text, u.email, u.encrypted_password FROM auth.users u WHERE u.email = p_email;
$$;

REVOKE ALL ON FUNCTION
  xangarro.throttle_wait(text), xangarro.throttle_fail(text, integer, integer, integer),
  xangarro.throttle_take(text, integer, integer), xangarro.throttle_clear(text),
  xangarro.session_open(text, uuid, text, integer), xangarro.session_resolve(text, integer),
  xangarro.session_revoke(text), xangarro.login_lookup(text)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  xangarro.throttle_wait(text), xangarro.throttle_fail(text, integer, integer, integer),
  xangarro.throttle_take(text, integer, integer), xangarro.throttle_clear(text),
  xangarro.session_open(text, uuid, text, integer), xangarro.session_resolve(text, integer),
  xangarro.session_revoke(text), xangarro.login_lookup(text)
TO xangarro_app;
