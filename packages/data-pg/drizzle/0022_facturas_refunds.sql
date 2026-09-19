-- Three N-33 gaps in the customer Facturas list and the backoffice's reach
-- (owner interview 2026-09-18; renumbered from 0021 after a Track O collision, before anything applied it):
--
-- 1. A payment stuck in `claimed` (a stamp started and never finished) is
--    still OWED a CFDI; showing it as `error` told the customer something
--    broke when the truth is "pendiente". The backoffice sees the real state.
-- 2. Refunded payments (`excluded_from_global`, `cancel_requested`,
--    `cancelled`) vanished from the list; they now show as `reembolso`, a
--    plain statement of fact with the CFDI's UUID when there is one. The
--    fiscal half of a refund (cancellation motivo, egreso) still waits for
--    contador sign-off (O-14) — listing is not cancelling.
-- 3. `xangarro.cfdi_marcar_global(p_period, p_uuid)` — resolving the monthly
--    close's own inbox item (`cfdi-global:<period>`) now marks the period's
--    `pending_global` payments `in_global` under one global row, exactly the
--    manual-phase twin of `CloseMonthlyGlobalCfdiUseCase`'s stamping path:
--    same `${period}#${sequence}` id, same payment_ids, `stamped` with the
--    folio fiscal and no PAC id. Individual (`manual`/`claimed`) payments of
--    the period keep their own per-payment resolution (cfdi_marcar_emitido).
--
-- `facturas_del_negocio` is recreated (CREATE OR REPLACE cannot widen the
-- result's WHERE; the function is DROPped and recreated with the same
-- signature and grants).

DROP FUNCTION IF EXISTS xangarro.facturas_del_negocio(text);

CREATE FUNCTION xangarro.facturas_del_negocio(p_business_id text)
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
         CASE
           WHEN p.status IN ('excluded_from_global', 'cancel_requested', 'cancelled')
             THEN 'reembolso'
           WHEN p.status = 'stamped' THEN 'timbrada'
           WHEN p.status IN ('manual', 'claimed') THEN 'pendiente'
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
     AND p.status IN ('stamped', 'pending_global', 'in_global', 'manual', 'claimed',
                      'excluded_from_global', 'cancel_requested', 'cancelled')
   ORDER BY p.paid_at DESC, p.external_payment_id DESC;
$$;

CREATE FUNCTION xangarro.cfdi_marcar_global(
  p_period text, p_uuid text
) RETURNS integer
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  WITH next_seq AS (
    SELECT coalesce(max(sequence), 0) + 1 AS seq
      FROM public.cfdi_globals WHERE period = p_period
  ),
  marked AS (
    UPDATE public.cfdi_payments p
       SET status = 'in_global',
           global_id = p_period || '#' || (SELECT seq FROM next_seq),
           updated_at = now()
     WHERE p.period = p_period
       AND p.status = 'pending_global'
    RETURNING p.external_payment_id
  ),
  inserted AS (
    INSERT INTO public.cfdi_globals (id, period, sequence, payment_ids, status,
                                     invoice_provider_id, invoice_uuid,
                                     created_at, updated_at)
    SELECT p_period || '#' || (SELECT seq FROM next_seq),
           p_period,
           (SELECT seq FROM next_seq),
           (SELECT coalesce(jsonb_agg(external_payment_id), '[]'::jsonb) FROM marked),
           'stamped',
           NULL,
           upper(p_uuid),
           now(),
           now()
    WHERE EXISTS (SELECT 1 FROM marked)
  )
  SELECT count(*)::integer FROM marked;
$$;

REVOKE ALL ON FUNCTION xangarro.facturas_del_negocio(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION xangarro.cfdi_marcar_emitido(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION xangarro.cfdi_marcar_global(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION xangarro.facturas_del_negocio(text) TO xangarro_app;

-- The backoffice role exists wherever the backoffice runs (hosted creates it
-- before any migration, docs/ops/provisioning.md; locally, local/0000 since
-- N-33); a database without one (the tenant conformance DB) simply skips the
-- grant.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT USAGE ON SCHEMA xangarro TO xangarro_admin;
    GRANT EXECUTE ON FUNCTION xangarro.cfdi_marcar_emitido(text, text, text) TO xangarro_admin;
    GRANT EXECUTE ON FUNCTION xangarro.cfdi_marcar_global(text, text) TO xangarro_admin;
  END IF;
END $$;
