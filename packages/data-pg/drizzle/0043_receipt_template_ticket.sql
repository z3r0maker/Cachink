-- The yellow «Ticket» becomes the default receipt (owner decision, 2026-09-26).
--
-- 1. New businesses start on it: the column default moves from 'clasico' to
--    'ticket' (signup also sets it explicitly; the domain default follows).
--
-- 2. Existing businesses move too, but only the ones that never touched their
--    receipt: 'clasico' was the default, so a business still on it with no
--    logo, colour, leyenda, WhatsApp, social links or printed address never
--    chose it. Anyone who customized anything keeps what they have, and
--    Comprobantes switches back in one click.
--
-- 3. Each moved row is logged to `sync_log` at a fresh per-tenant seq (the
--    same shape as `logChange`), so the cajas pull the new template instead
--    of keeping 'clasico' until the next unrelated edit.

ALTER TABLE businesses ALTER COLUMN receipt_template SET DEFAULT 'ticket';

WITH movidos AS (
  UPDATE businesses b
     SET receipt_template = 'ticket', updated_at = now()
   WHERE b.receipt_template = 'clasico'
     AND b.deleted_at IS NULL
     AND b.brand_color IS NULL
     AND b.receipt_leyenda IS NULL
     AND b.whatsapp IS NULL
     AND b.address_print = false
     AND b.social_links = '{}'
     AND NOT EXISTS (SELECT 1 FROM business_logos l WHERE l.business_id = b.id)
  RETURNING b.id, b.business_id
),
cursores AS (
  INSERT INTO sync_cursors (business_id, last_seq)
  SELECT business_id, 1 FROM movidos
  ON CONFLICT (business_id) DO UPDATE SET last_seq = sync_cursors.last_seq + 1
  RETURNING business_id, last_seq
)
INSERT INTO sync_log (seq, table_name, row_id, op, business_id, created_at, updated_at)
SELECT c.last_seq, 'businesses', m.id, 'update', m.business_id, now(), now()
  FROM movidos m
  JOIN cursores c USING (business_id);
