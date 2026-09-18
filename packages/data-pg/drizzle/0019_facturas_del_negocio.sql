-- The customer's "Facturas" list (N-33, ADR-070, P-10) and the backoffice's
-- "marcar UUID" reaching `cfdi_payments`.
--
-- `cfdi_payments` belongs to `xangarro_billing` (0009); the tenant role has no
-- grant on it and gets none here. Like `xangarro.tenant_fiscal` (0014), each
-- function below is SECURITY DEFINER, answers one question and returns nothing
-- else; `search_path` is pinned, so a caller cannot shadow what it reads.
--
-- 1. `xangarro.facturas_del_negocio(p_business_id)` — one business's
--    subscription payments as the customer sees them. It returns rows only
--    when `p_business_id` is the caller's own tenant claim, so a tenant that
--    passes another business's id gets nothing. Status, mapped to the four
--    customer states:
--      stamped                     → timbrada
--      pending_global, in_global   → en_global  (the monthly "público en general")
--      manual                      → pendiente  (CFDI_MODE=off, not yet issued)
--      claimed                     → error      (stamping started, never finished)
--    Refunded payments (excluded_from_global, cancel_requested, cancelled) are
--    not listed. The payment id IS the Stripe invoice id (0008's key); both
--    columns are returned so the caller never has to know that. The PAC's own
--    document id stays inside: only whether a PDF/XML exists comes out.
--    EXECUTE: `xangarro_app` only.
--
-- 2. `xangarro.cfdi_marcar_emitido(p_payment_id, p_business_id, p_uuid)` —
--    staff resolved a "pago sin CFDI" item with the folio fiscal they issued
--    in the SAT portal (N-08, CFDI_MODE=off). The payment stops being owed a
--    CFDI: an individual one becomes `stamped` with that UUID and no PAC id
--    (the customer sees "timbrada", issued by hand, no download); a global
--    one becomes `in_global`. Only payments still owed a CFDI change; true
--    when one did. EXECUTE: `xangarro_admin` (the backoffice) only.

CREATE OR REPLACE FUNCTION xangarro.facturas_del_negocio(p_business_id text)
RETURNS TABLE (
  payment_id text,
  stripe_invoice_id text,
  paid_at timestamptz,
  total_centavos bigint,
  route text,
  estado text,
  cfdi_uuid text,
  pdf_disponible boolean,
  xml_disponible boolean,
  emitida_manual boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT p.external_payment_id,
         p.external_payment_id,
         p.paid_at,
         p.total_centavos,
         CASE WHEN p.route = 'global' THEN 'global' ELSE 'individual' END,
         CASE p.status
           WHEN 'stamped' THEN 'timbrada'
           WHEN 'manual' THEN 'pendiente'
           WHEN 'claimed' THEN 'error'
           ELSE 'en_global'
         END,
         COALESCE(p.invoice_uuid, g.invoice_uuid),
         p.status = 'stamped' AND p.invoice_provider_id IS NOT NULL,
         p.status = 'stamped' AND p.invoice_provider_id IS NOT NULL,
         p.status = 'stamped' AND p.invoice_provider_id IS NULL AND p.invoice_uuid IS NOT NULL
    FROM public.cfdi_payments p
    LEFT JOIN public.cfdi_globals g ON g.id = p.global_id
   WHERE p.business_id = p_business_id
     AND p_business_id = (SELECT xangarro.current_business_id())
     AND p.status IN ('stamped', 'pending_global', 'in_global', 'manual', 'claimed')
   ORDER BY p.paid_at DESC, p.external_payment_id DESC;
$$;

CREATE OR REPLACE FUNCTION xangarro.cfdi_marcar_emitido(
  p_payment_id text, p_business_id text, p_uuid text
) RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  WITH marked AS (
    UPDATE public.cfdi_payments p
       SET status = CASE WHEN p.route = 'global' THEN 'in_global' ELSE 'stamped' END,
           invoice_uuid = upper(p_uuid),
           updated_at = now()
     WHERE p.external_payment_id = p_payment_id
       AND p.business_id = p_business_id
       AND p.status IN ('manual', 'claimed', 'pending_global')
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM marked);
$$;

REVOKE ALL ON FUNCTION xangarro.facturas_del_negocio(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION xangarro.cfdi_marcar_emitido(text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION xangarro.facturas_del_negocio(text) TO xangarro_app;

-- The backoffice role exists wherever the backoffice runs (hosted creates it
-- before any migration, docs/ops/provisioning.md); a database without one
-- simply has no caller for this function yet.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT USAGE ON SCHEMA xangarro TO xangarro_admin;
    GRANT EXECUTE ON FUNCTION xangarro.cfdi_marcar_emitido(text, text, text) TO xangarro_admin;
  END IF;
END
$$;
