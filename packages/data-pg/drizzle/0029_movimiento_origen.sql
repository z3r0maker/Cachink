-- `origen` on inventory_movements (C-12 step 7): where a movement came from,
-- material at last. `manual` (a person on a phone) and `portal` (the owner,
-- in the web) count toward the transactions limit (OQ-5); `apertura` (N-17's
-- one-time opening stock), `venta`, `cancelacion`, `conversion` never do.
--
-- 1. The column, defaulting `manual` so old rows and old device payloads
--    parse unchanged (the domain schema defaults the same).
-- 2. Backfill mirroring `classifyMovementOrigin` exactly — apertura motivo
--    first (those rows are portal-written), then the portal device, then the
--    use-case motiva; everything else was entered by a person.
-- 3. `xangarro.usage_counts()` trades its heuristic arm for the column, and
--    the metering grant carries the new column.
-- SQLite half: packages/data 0011_movimiento_origen.

ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'manual';

UPDATE inventory_movements SET origen = CASE
  WHEN motivo = 'Apertura de inventario' THEN 'apertura'
  WHEN device_id = '01HZ8XQN9GZJXV8AKQ5X0WEB01' THEN 'portal'
  WHEN motivo = 'Venta' THEN 'venta'
  WHEN motivo = 'Conversión' THEN 'conversion'
  WHEN motivo = 'Devolución de cliente'
       AND starts_with(coalesce(nota, ''), 'Cancelación de venta:') THEN 'cancelacion'
  ELSE 'manual' END;

CREATE OR REPLACE FUNCTION xangarro.usage_counts(
  p_business_ids text[],
  p_first_period text,
  p_last_period text
)
RETURNS TABLE (business_id text, period text, transactions integer, active_products integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
  WITH ids AS (
    SELECT DISTINCT u.id FROM unnest(p_business_ids) AS u(id)
    UNION
    SELECT b.id FROM public.businesses b
     WHERE p_business_ids IS NULL AND b.deleted_at IS NULL
  ),
  bounds AS (
    SELECT to_date(p_first_period || '-01', 'YYYY-MM-DD') AS lo,
           to_date(p_last_period || '-01', 'YYYY-MM-DD') AS hi
     WHERE p_first_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
       AND p_last_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  ),
  periods AS (
    SELECT to_char(m, 'YYYY-MM') AS period,
           m::timestamp AT TIME ZONE 'America/Mexico_City' AS starts,
           (m + interval '1 month')::timestamp AT TIME ZONE 'America/Mexico_City' AS ends
      FROM bounds, generate_series(bounds.lo, bounds.hi, interval '1 month') AS m
     WHERE bounds.hi < bounds.lo + interval '24 months'
  ),
  win AS (SELECT min(starts) AS lo, max(ends) AS hi FROM periods),
  tx AS (
    SELECT s.business_id, s.created_at
      FROM public.sales s, win
     WHERE s.business_id IN (SELECT id FROM ids)
       AND s.created_at >= win.lo AND s.created_at < win.hi
    UNION ALL
    SELECT e.business_id, e.created_at
      FROM public.expenses e, win
     WHERE e.business_id IN (SELECT id FROM ids)
       AND e.created_at >= win.lo AND e.created_at < win.hi
    UNION ALL
    SELECT im.business_id, im.created_at
      FROM public.inventory_movements im, win
     WHERE im.business_id IN (SELECT id FROM ids)
       AND im.created_at >= win.lo AND im.created_at < win.hi
       AND im.origen IN ('manual', 'portal')
  ),
  tx_n AS (
    SELECT tx.business_id, p.period, count(*)::int AS n
      FROM tx JOIN periods p ON tx.created_at >= p.starts AND tx.created_at < p.ends
     GROUP BY tx.business_id, p.period
  ),
  prod_n AS (
    SELECT pr.business_id, p.period, count(*)::int AS n
      FROM public.products pr
      JOIN periods p
        ON pr.created_at < p.ends AND (pr.deleted_at IS NULL OR pr.deleted_at >= p.ends)
     WHERE pr.business_id IN (SELECT id FROM ids)
     GROUP BY pr.business_id, p.period
  )
  SELECT i.id, p.period, coalesce(t.n, 0), coalesce(q.n, 0)
    FROM ids i
    CROSS JOIN periods p
    LEFT JOIN tx_n t ON t.business_id = i.id AND t.period = p.period
    LEFT JOIN prod_n q ON q.business_id = i.id AND q.period = p.period
   ORDER BY i.id, p.period
$fn$;

REVOKE ALL ON FUNCTION xangarro.usage_counts(text[], text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION xangarro.usage_counts(text[], text, text) TO xangarro_metering;
GRANT SELECT (business_id, created_at, device_id, motivo, nota, origen)
  ON public.inventory_movements TO xangarro_metering;
