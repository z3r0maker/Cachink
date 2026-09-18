-- Emailed sign-in links and password resets (ADR-080, B-14's call site).
--
-- Same shape as the portal sessions in 0005: a table in the `xangarro` schema,
-- where the app role has no privileges, reached only through the SECURITY
-- DEFINER functions below. The link carries 256 random bits; only its SHA-256
-- is stored, so a copy of this table opens nothing.
--
-- A link is single-use and short-lived, and issuing a new one retires every
-- earlier unused link of the same kind for that account: only the newest email
-- works.
CREATE TABLE IF NOT EXISTS xangarro.auth_links (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('reset', 'magic')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE INDEX IF NOT EXISTS auth_links_user_idx ON xangarro.auth_links (user_id, kind);
REVOKE ALL ON xangarro.auth_links FROM PUBLIC;

-- Store a link for the account with `p_email`, if there is one. The return says
-- whether there was — for the caller to decide whether to send the email, never
-- for the response, which must read the same either way.
CREATE OR REPLACE FUNCTION xangarro.link_issue(
  p_hash text, p_email text, p_kind text, p_ttl integer
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT u.id INTO uid FROM auth.users u WHERE u.email = p_email;
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  UPDATE xangarro.auth_links SET used_at = now()
  WHERE user_id = uid AND kind = p_kind AND used_at IS NULL;
  INSERT INTO xangarro.auth_links (token_hash, user_id, kind, expires_at)
  VALUES (p_hash, uid, p_kind, now() + make_interval(secs => p_ttl));
  RETURN true;
END
$$;

-- Spend a sign-in link: the account's id, once, while it is fresh.
CREATE OR REPLACE FUNCTION xangarro.link_consume(p_hash text, p_kind text)
RETURNS text
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  UPDATE xangarro.auth_links SET used_at = now()
  WHERE token_hash = p_hash AND kind = p_kind AND used_at IS NULL AND expires_at > now()
  RETURNING user_id::text;
$$;

-- Spend a reset link and set the new password in one statement's worth of
-- work: the hash is bcrypt, computed by the server; every open portal session
-- of the account ends, so a reset also locks out whoever had the old password.
CREATE OR REPLACE FUNCTION xangarro.password_reset(p_hash text, p_password_hash text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  uid text;
BEGIN
  uid := xangarro.link_consume(p_hash, 'reset');
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;
  UPDATE auth.users SET encrypted_password = p_password_hash WHERE id = uid::uuid;
  UPDATE xangarro.portal_sessions SET revoked_at = now()
  WHERE user_id = uid::uuid AND revoked_at IS NULL;
  RETURN uid;
END
$$;

REVOKE ALL ON FUNCTION
  xangarro.link_issue(text, text, text, integer), xangarro.link_consume(text, text),
  xangarro.password_reset(text, text)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  xangarro.link_issue(text, text, text, integer), xangarro.link_consume(text, text),
  xangarro.password_reset(text, text)
TO xangarro_app;
