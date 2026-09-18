-- Redeem an activation code, atomically.
--
-- `POST /activate` arrives with no session and no tenant: the code is what
-- *determines* the tenant. So, as with sign-in (0002_membership_lookup.sql),
-- the lookup cannot be tenant-scoped, and `tenant_isolation` would correctly
-- return nothing. One narrow SECURITY DEFINER function does it instead of
-- handing the app a BYPASSRLS role.
--
-- **Single use is decided by one UPDATE, not by a check followed by a write.**
-- The contract's conformance suite fires two redemptions of the same code
-- concurrently and requires exactly one 200 and one 409. A "SELECT, then
-- UPDATE if unredeemed" lets both SELECTs see it unredeemed. Here, the UPDATE's
-- WHERE clause *is* the check: the first caller takes the row lock and sets
-- `redeemed_at`; the second blocks on that lock and, under READ COMMITTED,
-- re-evaluates its WHERE against the committed row, finds it redeemed, and
-- matches nothing.
--
-- It runs inside the caller's transaction, so if the rest of activation fails
-- — the device insert, the bootstrap — the redemption rolls back with it and
-- the code is usable again. Burning a code for a phone that never got its
-- token would strand the shopkeeper.
--
-- Only after the claim fails does it look at *why*, and that second read never
-- claims anything. Email is compared case-insensitively because the contract
-- lowercases it before sending.

CREATE OR REPLACE FUNCTION xangarro.redeem_activation_code(
  p_code text,
  p_email text,
  p_device_id text
)
RETURNS TABLE (outcome text, business_id text)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  claimed text;
  found_row record;
BEGIN
  UPDATE public.activation_codes c
     SET redeemed_at = now(),
         redeemed_by_device_id = p_device_id,
         updated_at = now()
   WHERE c.code = p_code
     AND c.redeemed_at IS NULL
     AND c.expires_at > now()
     AND lower(c.email) = lower(p_email)
  RETURNING c.business_id INTO claimed;

  IF claimed IS NOT NULL THEN
    RETURN QUERY SELECT 'OK'::text, claimed;
    RETURN;
  END IF;

  SELECT c.redeemed_at, c.expires_at, c.email
    INTO found_row
    FROM public.activation_codes c
   WHERE c.code = p_code;

  -- Precedence matches the contract's reference mock: email before state. A
  -- caller holding someone else's code learns only that the email is wrong —
  -- not whether that code has already been used or has lapsed.
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'CODE_INVALID'::text, NULL::text;
  ELSIF lower(found_row.email) <> lower(p_email) THEN
    RETURN QUERY SELECT 'EMAIL_MISMATCH'::text, NULL::text;
  ELSIF found_row.expires_at <= now() THEN
    RETURN QUERY SELECT 'CODE_EXPIRED'::text, NULL::text;
  ELSE
    RETURN QUERY SELECT 'CODE_USED'::text, NULL::text;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION xangarro.redeem_activation_code(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.redeem_activation_code(text, text, text) TO xangarro_app;
