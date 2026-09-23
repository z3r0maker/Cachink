-- `xangarro.redeem_activation_code` v2 (B-07): an archived business cannot be
-- joined.
--
-- 0016 archives a business by setting `businesses.deleted_at` and revoking its
-- devices, and the membership lookup already refuses sign-in to it. Activation
-- did not look: a code minted before the archive still redeemed, and the phone
-- got a token and an entitlement for a tenant nobody can sign in to. The
-- contract has had `BUSINESS_SUSPENDED` for this since C-02; it was never
-- returned.
--
-- The refusal lives in the claim itself, not in the caller: the UPDATE's WHERE
-- clause also requires the business to be live, so the code is **not
-- consumed** for an archived tenant — a support restore (clearing
-- `deleted_at`) makes it good again without re-minting. The fallthrough keeps
-- the contract's precedence: email first (a caller holding someone else's code
-- learns nothing about that business), then the archive, then expiry, then
-- use. Body repeated whole: a SQL function is replaced whole (CLAUDE.md §2.9).
--
-- `tests/redeem-archived.integration.test.ts` proves both halves and that a
-- restored business redeems the same code.

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
     AND NOT EXISTS (
       SELECT 1 FROM public.businesses b
        WHERE b.id = c.business_id AND b.deleted_at IS NOT NULL
     )
  RETURNING c.business_id INTO claimed;

  IF claimed IS NOT NULL THEN
    RETURN QUERY SELECT 'OK'::text, claimed;
    RETURN;
  END IF;

  SELECT c.redeemed_at, c.expires_at, c.email,
         EXISTS (
           SELECT 1 FROM public.businesses b
            WHERE b.id = c.business_id AND b.deleted_at IS NOT NULL
         ) AS archived
    INTO found_row
    FROM public.activation_codes c
   WHERE c.code = p_code;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'CODE_INVALID'::text, NULL::text;
  ELSIF lower(found_row.email) <> lower(p_email) THEN
    RETURN QUERY SELECT 'EMAIL_MISMATCH'::text, NULL::text;
  ELSIF found_row.archived THEN
    RETURN QUERY SELECT 'BUSINESS_SUSPENDED'::text, NULL::text;
  ELSIF found_row.expires_at <= now() THEN
    RETURN QUERY SELECT 'CODE_EXPIRED'::text, NULL::text;
  ELSE
    RETURN QUERY SELECT 'CODE_USED'::text, NULL::text;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION xangarro.redeem_activation_code(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.redeem_activation_code(text, text, text) TO xangarro_app;
