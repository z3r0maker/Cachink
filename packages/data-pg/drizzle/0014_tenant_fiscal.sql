-- A business's fiscal data, for the CFDI of its subscription payments (N-33,
-- ADR-070, ADR-082).
--
-- The Stripe webhook runs as `xangarro_billing`, a cross-tenant role that has
-- no grant on `businesses` (behind `tenant_isolation`) nor on `auth.users` —
-- so until now every payment went to the monthly "público en general" CFDI.
--
-- Like `xangarro.owner_email` (0011), one SECURITY DEFINER function answers
-- exactly one question — "the receptor data of this business" — and returns
-- nothing else: one business id in, at most one row out, only the CFDI fields.
-- `regimen_sat` (the SAT c_RegimenFiscal code) is the régimen; the derived
-- `regimen_fiscal` bucket is never read here. The email is the owner's, from
-- `xangarro.owner_email` (called as this function's owner, so the billing role
-- needs no grant on it). `search_path` is pinned, so a caller cannot shadow
-- the objects it reads.
--
-- EXECUTE goes to `xangarro_billing` only. Not to the tenant role, not to
-- PUBLIC, not to the metering role.

CREATE OR REPLACE FUNCTION xangarro.tenant_fiscal(p_business_id text)
RETURNS TABLE (
  rfc text,
  razon_social text,
  regimen_sat text,
  uso_cfdi text,
  codigo_postal text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT b.rfc, b.razon_social, b.regimen_sat, b.uso_cfdi, b.codigo_postal,
         xangarro.owner_email(b.id)
    FROM public.businesses b
   WHERE b.id = p_business_id
     AND b.deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION xangarro.tenant_fiscal(text) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON FUNCTION xangarro.tenant_fiscal(text) FROM xangarro_app;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_billing') THEN
    CREATE ROLE xangarro_billing NOLOGIN;
  END IF;
END
$$;
GRANT EXECUTE ON FUNCTION xangarro.tenant_fiscal(text) TO xangarro_billing;
