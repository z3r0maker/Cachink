-- C-14 (SEC-DEV-01, SEC-MOB-04): a scannable pairing token beside the typed code.
--
-- The portal's pairing panel can show a QR. What the QR carries is **not** the
-- 8-character code: it is a separate ≥128-bit single-use token, minted on
-- demand for the live code, valid 15 minutes, stored only as its SHA-256
-- (`qr_token_hash`). The link is `https://app.xangarro.mx/activar#c=<token>` —
-- in the fragment, so it never reaches a server log or a Referer — and nothing
-- redeems on GET (WhatsApp previews fetch links). Redeeming it consumes the
-- whole row: one pairing, whichever path the phone used.
--
-- Guessing is not a threat model for 128 bits, so the scan path may tell used
-- from expired; the typed path keeps its one generic error (the server maps
-- `EMAIL_MISMATCH` to `CODE_INVALID` before answering).
--
-- `tests/pairing-token.integration.test.ts` proves the claim, single use under
-- a race, expiry, the archived-business refusal and that a new «Generar otro»
-- kills the old QR.

ALTER TABLE public.activation_codes ADD COLUMN qr_token_hash text;
ALTER TABLE public.activation_codes ADD COLUMN qr_expires_at timestamptz;
CREATE UNIQUE INDEX activation_codes_qr_token_hash_idx
  ON public.activation_codes (qr_token_hash) WHERE qr_token_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION xangarro.redeem_pairing_token(
  p_token_hash text,
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
   WHERE c.qr_token_hash = p_token_hash
     AND c.redeemed_at IS NULL
     AND c.qr_expires_at > now()
     AND c.expires_at > now()
     AND NOT EXISTS (
       SELECT 1 FROM public.businesses b
        WHERE b.id = c.business_id AND b.deleted_at IS NOT NULL
     )
  RETURNING c.business_id INTO claimed;

  IF claimed IS NOT NULL THEN
    RETURN QUERY SELECT 'OK'::text, claimed;
    RETURN;
  END IF;

  SELECT c.redeemed_at, c.qr_expires_at, c.expires_at,
         EXISTS (
           SELECT 1 FROM public.businesses b
            WHERE b.id = c.business_id AND b.deleted_at IS NOT NULL
         ) AS archived
    INTO found_row
    FROM public.activation_codes c
   WHERE c.qr_token_hash = p_token_hash;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'CODE_INVALID'::text, NULL::text;
  ELSIF found_row.archived THEN
    RETURN QUERY SELECT 'BUSINESS_SUSPENDED'::text, NULL::text;
  ELSIF found_row.redeemed_at IS NOT NULL THEN
    RETURN QUERY SELECT 'CODE_USED'::text, NULL::text;
  ELSE
    RETURN QUERY SELECT 'CODE_EXPIRED'::text, NULL::text;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION xangarro.redeem_pairing_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.redeem_pairing_token(text, text) TO xangarro_app;
