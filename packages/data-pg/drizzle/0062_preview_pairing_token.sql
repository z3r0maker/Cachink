-- 0062: «¿Es tu negocio?» before a scanned phone links (N-25, SEC-MOB-04).
--
-- The phone reads the portal's pairing QR (C-14, 0038) and, before redeeming
-- it, asks the server which business it names, so the person holding the
-- phone can say «No es mi negocio» to a QR someone else put in front of them.
--
-- `xangarro.preview_pairing_token` answers that and nothing else: for a live
-- token, the business's name and its earliest owner's first name and email;
-- otherwise the same refusal `redeem_pairing_token` would give, with the same
-- precedence (unknown, archived, used, expired). It is STABLE and only reads:
-- nothing is claimed, `qr_expires_at` is not moved, the row's `updated_at`
-- stays put. The first name is cut here, so the full display name never leaves
-- the database.
--
-- SECURITY DEFINER because there is no tenant yet (the token is the only
-- credential, as on redeem) and the owner lives in `auth.users`, which the app
-- role cannot read. `search_path` is pinned with `pg_catalog` first (0056) and
-- every object is schema-qualified. EXECUTE goes to `xangarro_app`, the role
-- `/activate/preview` runs as, and not to PUBLIC.
--
-- A new function and no table change: nothing existing is rewritten, so old
-- rows need no migration. `tests/pairing-preview.integration.test.ts` builds
-- the rows the seed has no example of and proves each answer, and that a
-- preview leaves the row exactly as it found it.
--
-- `SET LOCAL`: the timeout dies with this file's transaction (R2-13), and the
-- hosted runner retries the whole file when it expires (ADR-119).
SET LOCAL lock_timeout = '200ms';

CREATE OR REPLACE FUNCTION xangarro.preview_pairing_token(p_token_hash text)
RETURNS TABLE (outcome text, business_name text, owner_first_name text, owner_email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  found_row record;
BEGIN
  SELECT c.business_id, c.redeemed_at, c.qr_expires_at, c.expires_at,
         b.nombre, b.deleted_at
    INTO found_row
    FROM public.activation_codes c
    JOIN public.businesses b ON b.id = c.business_id
   WHERE c.qr_token_hash = p_token_hash;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'CODE_INVALID'::text, NULL::text, NULL::text, NULL::text;
  ELSIF found_row.deleted_at IS NOT NULL THEN
    RETURN QUERY SELECT 'BUSINESS_SUSPENDED'::text, NULL::text, NULL::text, NULL::text;
  ELSIF found_row.redeemed_at IS NOT NULL THEN
    RETURN QUERY SELECT 'CODE_USED'::text, NULL::text, NULL::text, NULL::text;
  ELSIF NOT coalesce(found_row.qr_expires_at > now() AND found_row.expires_at > now(), false) THEN
    RETURN QUERY SELECT 'CODE_EXPIRED'::text, NULL::text, NULL::text, NULL::text;
  ELSE
    RETURN QUERY
      SELECT 'OK'::text, found_row.nombre::text, o.first_name, o.email
        FROM (SELECT 1) AS one
        LEFT JOIN LATERAL (
          SELECT NULLIF(split_part(btrim(coalesce(u.raw_user_meta_data->>'nombre', '')), ' ', 1), '')
                   AS first_name,
                 u.email::text AS email
            FROM public.business_members m
            JOIN auth.users u ON u.id::text = m.user_id
           WHERE m.business_id = found_row.business_id AND m.role = 'owner'
           ORDER BY m.created_at, m.id
           LIMIT 1
        ) AS o ON true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION xangarro.preview_pairing_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.preview_pairing_token(text) TO xangarro_app;
