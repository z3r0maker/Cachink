-- E-10 (board CD-06i): the backoffice reads a month of Xangarro's own
-- subscription payments and their CFDIs, for «Empresa» › Facturas › Emitidas
-- and the daily import of each payment as a «Cobro» in the corp ledger.
--
-- Hand-written like 0019 and 0022: Drizzle Kit models neither functions nor
-- grants. Additive: a new function, no table change, so no data moves.
--
-- `xangarro.ingresos_del_periodo(p_period)` — every payment whose CDMX period
-- is `p_period`, newest first: who paid (the receptor's RFC and name, null
-- for a payment without fiscal data), how it was invoiced (route, status,
-- the income CFDI's and its complemento's UUIDs, and the UUID of the global
-- that took it) and what refunds gave back (the sum of its credit notes,
-- stored as decimal strings of centavos, 0040). The receptor's régimen, uso
-- and CP stay inside. SECURITY DEFINER: `xangarro_admin` has no grant on
-- `cfdi_payments` (0009) and gets none here.
--
-- EXECUTE: `xangarro_admin` (the backoffice) only.

CREATE OR REPLACE FUNCTION xangarro.ingresos_del_periodo(p_period text)
RETURNS TABLE (
  payment_id text,
  paid_at timestamptz,
  total_centavos bigint,
  route text,
  status text,
  forma_pago text,
  description text,
  receptor_rfc text,
  receptor_nombre text,
  invoice_uuid text,
  complement_uuid text,
  global_uuid text,
  notas_de_credito_centavos bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT p.external_payment_id,
         p.paid_at,
         p.total_centavos,
         p.route,
         p.status,
         p.forma_pago,
         p.description,
         p.receptor ->> 'rfc',
         p.receptor ->> 'nombre',
         p.invoice_uuid,
         p.complement_uuid,
         g.invoice_uuid,
         coalesce((SELECT sum((n ->> 'totalCentavos')::bigint)
                     FROM jsonb_array_elements(
                            CASE WHEN jsonb_typeof(p.credit_notes) = 'array'
                                 THEN p.credit_notes ELSE '[]'::jsonb END) AS n), 0)::bigint
    FROM public.cfdi_payments p
    LEFT JOIN public.cfdi_globals g ON g.id = p.global_id
   WHERE p.period = p_period
   ORDER BY p.paid_at DESC, p.external_payment_id DESC;
$$;

REVOKE ALL ON FUNCTION xangarro.ingresos_del_periodo(text) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT EXECUTE ON FUNCTION xangarro.ingresos_del_periodo(text) TO xangarro_admin;
  END IF;
END
$$;
