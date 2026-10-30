-- Received invoices' privileges and guards (E-11). Hand-written: Drizzle Kit
-- models neither privileges nor triggers. Applied after 0006_corp_facturas.sql.
--
-- 1. The console inserts, reads and moves an invoice along; it never deletes
--    one. Leaving the review marks it «descartada».
-- 2. What the XML says never changes once kept, and an invoice only moves
--    forward: por_revisar → registrada or descartada; registrada → cancelada.
--    A discarded one is the exception: a new upload takes it again, whole.
-- 3. Its expense and payment, once set, are never repointed.

GRANT SELECT, INSERT, UPDATE ON corp.received_invoices TO xangarro_corp;
GRANT SELECT ON corp.received_invoices TO xangarro_corp_agent;

CREATE OR REPLACE FUNCTION corp.received_invoice_guard() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
BEGIN
  IF NEW.uuid <> OLD.uuid THEN
    RAISE EXCEPTION 'a received invoice keeps its UUID' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.estado = 'descartada' THEN
    IF NEW.estado NOT IN ('descartada', 'por_revisar', 'cancelada') THEN
      RAISE EXCEPTION 'invoice %: a discarded upload comes back to review first', OLD.uuid
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF (NEW.fecha, NEW.emisor_rfc, NEW.receptor_rfc, NEW.metodo_pago, NEW.moneda,
      NEW.subtotal, NEW.iva, NEW.retencion_isr, NEW.retencion_iva, NEW.total, NEW.xml)
     IS DISTINCT FROM
     (OLD.fecha, OLD.emisor_rfc, OLD.receptor_rfc, OLD.metodo_pago, OLD.moneda,
      OLD.subtotal, OLD.iva, OLD.retencion_isr, OLD.retencion_iva, OLD.total, OLD.xml) THEN
    RAISE EXCEPTION 'invoice %: what its XML says never changes', OLD.uuid
      USING ERRCODE = 'check_violation';
  END IF;
  IF NOT (NEW.estado = OLD.estado
          OR (OLD.estado = 'por_revisar' AND NEW.estado IN ('registrada', 'descartada'))
          OR (OLD.estado = 'registrada' AND NEW.estado = 'cancelada')) THEN
    RAISE EXCEPTION 'invoice %: % cannot become %', OLD.uuid, OLD.estado, NEW.estado
      USING ERRCODE = 'check_violation';
  END IF;
  IF (OLD.entry_id IS NOT NULL AND NEW.entry_id IS DISTINCT FROM OLD.entry_id)
     OR (OLD.pago_entry_id IS NOT NULL AND NEW.pago_entry_id IS DISTINCT FROM OLD.pago_entry_id) THEN
    RAISE EXCEPTION 'invoice %: its movements are never repointed', OLD.uuid
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS received_invoices_guard ON corp.received_invoices;
CREATE TRIGGER received_invoices_guard
  BEFORE UPDATE ON corp.received_invoices
  FOR EACH ROW EXECUTE FUNCTION corp.received_invoice_guard();
