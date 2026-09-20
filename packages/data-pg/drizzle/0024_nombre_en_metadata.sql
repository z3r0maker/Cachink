-- The display name moves to `auth.users.raw_user_meta_data` (amends ADR-087).
--
-- Hosted Supabase refused 0020's `ALTER TABLE auth.users ADD COLUMN nombre`:
-- `supabase_auth_admin` owns the table and even `postgres` may not alter it —
-- the platform's own place for custom account data is the JSONB column every
-- hosted project already carries. Locally our compat layer must gain it; the
-- ALTER is probe-guarded (no statement touches `auth.users` when the column
-- exists) and exception-guarded, so the same file applies on both sides.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
     WHERE attrelid = 'auth.users'::regclass AND attname = 'raw_user_meta_data' AND NOT attisdropped
  ) THEN
    ALTER TABLE auth.users ADD COLUMN raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'auth.users not alterable; assuming raw_user_meta_data exists (hosted)';
END $$;

-- Local rows that used 0020's column for the brief window it existed.
DO $$
BEGIN
  UPDATE auth.users u
     SET raw_user_meta_data = u.raw_user_meta_data || jsonb_build_object('nombre', u.nombre)
   WHERE u.nombre IS NOT NULL
     AND u.raw_user_meta_data->>'nombre' IS NULL;
EXCEPTION WHEN undefined_column THEN
  RAISE NOTICE 'no nombre column (hosted); nothing to backfill';
END $$;

-- account_create keeps its signature; the name lands in the metadata.
-- The DROPs first: hosted still runs the four-argument form (0020's swap was
-- skipped there), and a signature change is not a REPLACE.
DROP FUNCTION IF EXISTS xangarro.account_create(uuid, text, text, timestamptz);
DROP FUNCTION IF EXISTS xangarro.account_create(uuid, text, text, text, timestamptz);
CREATE FUNCTION xangarro.account_create(
  p_id uuid, p_email text, p_password_hash text, p_nombre text, p_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_meta jsonb;
BEGIN
  IF xangarro.account_email_taken(p_email) THEN
    RETURN false;
  END IF;
  v_meta := CASE
    WHEN NULLIF(btrim(p_nombre), '') IS NULL THEN '{}'::jsonb
    ELSE jsonb_build_object('nombre', btrim(p_nombre))
  END;
  INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
  VALUES (p_id, p_email, p_password_hash, v_meta, p_at, p_at);
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END
$$;

REVOKE ALL ON FUNCTION xangarro.account_create(uuid, text, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.account_create(uuid, text, text, text, timestamptz)
TO xangarro_app;

-- session_resolve reads the name where account_create writes it.
DROP FUNCTION IF EXISTS xangarro.session_resolve(text, integer);
CREATE FUNCTION xangarro.session_resolve(p_hash text, p_idle integer)
RETURNS TABLE (user_id text, email text, nombre text, business_id text, role text)
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
  RETURNING s.user_id::text, u.email,
            NULLIF(btrim(coalesce(u.raw_user_meta_data->>'nombre', '')), ''),
            s.business_id, m.role;
$$;

REVOKE ALL ON FUNCTION xangarro.session_resolve(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.session_resolve(text, integer) TO xangarro_app;

-- The celebraciones half of 0020 applied cleanly on hosted before the ALTER
-- failed (its transaction was rolled back with it); this file re-creates it,
-- idempotently, so both halves land everywhere from one place.
CREATE TABLE IF NOT EXISTS "celebraciones" (
  "clave" text NOT NULL,
  "business_id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "celebraciones_pk" PRIMARY KEY ("business_id", "clave")
);

ALTER TABLE public.celebraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebraciones FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.celebraciones;
CREATE POLICY tenant_isolation ON public.celebraciones
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));

GRANT SELECT, INSERT ON public.celebraciones TO xangarro_app;
REVOKE UPDATE, DELETE ON public.celebraciones FROM xangarro_app;
