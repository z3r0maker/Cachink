-- 0052: «Privacidad y mis datos» reads a person's own consent rows (ADR-137).
--
-- The ledger (0034) has no read path for the app: no role may SELECT it, only
-- append through `privacy_consent_record`. The privacy page needs the latest
-- row per purpose for the signed-in account, to say which aviso it accepted,
-- when, and whether novedades are on. This definer returns exactly that, for
-- the account it is given: the portal passes the session's user, never one
-- from a request. Nothing here writes; changing a choice is a new row through
-- `privacy_consent_record`, as always.

SET LOCAL lock_timeout = '200ms';

CREATE OR REPLACE FUNCTION xangarro.privacy_consents_of_user(p_user_id uuid)
RETURNS TABLE (purpose text, granted boolean, aviso_version text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT DISTINCT ON (c.purpose) c.purpose, c.granted, c.aviso_version, c.created_at
    FROM xangarro.privacy_consents c
   WHERE c.user_id = p_user_id
   ORDER BY c.purpose, c.created_at DESC, c.id DESC;
$$;

REVOKE ALL ON FUNCTION xangarro.privacy_consents_of_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.privacy_consents_of_user(uuid) TO xangarro_app;
