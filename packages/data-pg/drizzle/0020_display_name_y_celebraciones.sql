-- The account's display name (O-24, ADR-087) and the celebrations marker
-- table (P-33). NOTE: the ALTER below is local-only — hosted Supabase refuses
-- it (supabase_auth_admin owns auth.users); 0024 moved the name into
-- raw_user_meta_data, which is where every side reads it now.
--
-- The name belongs to the person, not to any one membership: one account has
-- one name in every business it belongs to. It lives on `auth.users`, which
-- the app role still cannot read or write directly — `account_create` (0018)
-- gains the name as a parameter and `session_resolve` (0005) returns it with
-- the rest of the session, so no new grant on `auth.*` exists here.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
     WHERE attrelid = 'auth.users'::regclass AND attname = 'nombre' AND NOT attisdropped
  ) THEN
    ALTER TABLE auth.users ADD COLUMN nombre text;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'auth.users not alterable (hosted); 0024 stores the name in raw_user_meta_data';
END $$;

-- account_create: the old four-argument form is dropped, not overloaded —
-- an overload would let a caller mint a nameless identity by accident.
DROP FUNCTION IF EXISTS xangarro.account_create(uuid, text, text, timestamptz);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_attribute
     WHERE attrelid = 'auth.users'::regclass AND attname = 'nombre' AND NOT attisdropped
  ) THEN
    CREATE OR REPLACE FUNCTION xangarro.account_create(
      p_id uuid, p_email text, p_password_hash text, p_nombre text, p_at timestamptz
    ) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = pg_catalog
    AS $func$
    BEGIN
      IF xangarro.account_email_taken(p_email) THEN
        RETURN false;
      END IF;
      INSERT INTO auth.users (id, email, encrypted_password, nombre, created_at, updated_at)
      VALUES (p_id, p_email, p_password_hash, NULLIF(btrim(p_nombre), ''), p_at, p_at);
      RETURN true;
    EXCEPTION WHEN unique_violation THEN
      RETURN false;
    END
    $func$;
    REVOKE ALL ON FUNCTION xangarro.account_create(uuid, text, text, text, timestamptz) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION xangarro.account_create(uuid, text, text, text, timestamptz)
      TO xangarro_app;
  END IF;
END $$;

-- session_resolve: the name rides along with the email. CREATE OR REPLACE
-- cannot change a return type, so this is a drop and recreate.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_attribute
     WHERE attrelid = 'auth.users'::regclass AND attname = 'nombre' AND NOT attisdropped
  ) THEN
    DROP FUNCTION IF EXISTS xangarro.session_resolve(text, integer);
    CREATE FUNCTION xangarro.session_resolve(p_hash text, p_idle integer)
    RETURNS TABLE (user_id text, email text, nombre text, business_id text, role text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path = pg_catalog
    AS $func$
      UPDATE xangarro.portal_sessions s SET last_seen_at = now()
      FROM auth.users u, public.business_members m
      WHERE s.token_hash = p_hash
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND s.last_seen_at > now() - make_interval(secs => p_idle)
        AND u.id = s.user_id
        AND m.user_id = s.user_id::text
        AND m.business_id = s.business_id
      RETURNING s.user_id::text, u.email, u.nombre, s.business_id, m.role;
    $func$;
    REVOKE ALL ON FUNCTION xangarro.session_resolve(text, integer) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION xangarro.session_resolve(text, integer) TO xangarro_app;
  END IF;
END $$;

-- Celebrations shown once (P-33, Fase 8): the goal-achieved takeover and the
-- streak-milestone toasts each write one marker row with a deterministic key
-- («meta:{id}», «racha:3»). Write-once: the portal never updates or deletes a
-- celebration, so those rights are never granted.
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
-- 0001's default privileges grant all four DML rights to every new table;
-- a celebration is write-once, so take the other two back (as 0017 did).
REVOKE UPDATE, DELETE ON public.celebraciones FROM xangarro_app;
