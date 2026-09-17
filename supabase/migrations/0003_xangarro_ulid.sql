-- 0003 — rename the ULID generator for the Cachink → Xangarro rebrand (ADR-056).
--
-- `cachink_generate_ulid` below is an intentional legacy reference: it is
-- the name 0001 created on every deployed project. Applied migrations are
-- immutable, so the rename happens here.
--
-- ALTER FUNCTION … RENAME keeps the function OID, so the column DEFAULTs
-- that call it (error_events / bug_reports in 0002) follow automatically.
-- PL/pgSQL bodies are stored as text and are NOT rewritten, so the sign-up
-- trigger function is redefined below to call the new name. Its body is
-- otherwise unchanged from 0001.

ALTER FUNCTION public.cachink_generate_ulid() RENAME TO xangarro_generate_ulid;

CREATE OR REPLACE FUNCTION public.seed_business_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_business_id TEXT;
  business_name   TEXT;
BEGIN
  new_business_id := public.xangarro_generate_ulid();
  business_name   := COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi negocio');

  INSERT INTO public.businesses (
    id, nombre, regimen_fiscal, isr_tasa, logo_url,
    business_id, device_id, created_at, updated_at, deleted_at
  ) VALUES (
    new_business_id, business_name, 'RIF', 3000, NULL,
    new_business_id, 'pending', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), NULL
  );

  UPDATE auth.users
    SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('business_id', new_business_id, 'role', 'Director')
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;
