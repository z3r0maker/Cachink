-- Sign-up's identity row (P-03), without handing the app role `auth.users`.
--
-- Locally the compat layer lets `xangarro_app` insert and select identities;
-- hosted Supabase does not (B-01 found it), and should not: that table holds
-- every account's email and hash. So, as 0005 did for the login lookup and
-- 0015 for resets, two SECURITY DEFINER functions that answer exactly one
-- question each, with a pinned search_path.

-- Whether an account already uses this address (case-insensitive).
CREATE OR REPLACE FUNCTION xangarro.account_email_taken(p_email text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(p_email));
$$;

-- Create the identity; false when the address was taken in the meantime (two
-- sign-ups racing), so the caller can answer EMAIL_TAKEN instead of a 500.
-- The hash is bcrypt, computed by the server; this function never sees a
-- password.
CREATE OR REPLACE FUNCTION xangarro.account_create(
  p_id uuid, p_email text, p_password_hash text, p_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF xangarro.account_email_taken(p_email) THEN
    RETURN false;
  END IF;
  INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
  VALUES (p_id, p_email, p_password_hash, p_at, p_at);
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END
$$;

REVOKE ALL ON FUNCTION
  xangarro.account_email_taken(text), xangarro.account_create(uuid, text, text, timestamptz)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  xangarro.account_email_taken(text), xangarro.account_create(uuid, text, text, timestamptz)
TO xangarro_app;
