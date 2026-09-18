-- The ONE definition of "how much did a business use in a month" in SQL
-- (N-02, N-07, ADR-065, OQ-5).
--
-- `xangarro.usage_counts()` is called by the nightly recompute (as
-- `xangarro_metering`, writing `usage_counters`) and by the admin console's
-- `admin_tenant_usage()` (as `xangarro_admin`, apps/admin migration 0009).
-- It replaces the body 0006_admin_usage_read.sql carried, so the two readers
-- can never count differently. Its TypeScript twin is `computeUsage` in
-- @xangarro/domain/usage; `tests/usage-counts.integration.test.ts` holds them
-- equal.
--
-- What counts (OQ-5, `countsTowardUsage`):
--   * sales: one per row. Tickets (ADR-073) are not on main yet, so every
--     sale is a pre-ticket one-line sale and counts once. When the tickets
--     table lands, count tickets here — and only here.
--   * expenses: one per row.
--   * inventory_movements: origin `manual` and `portal` count; `venta`,
--     `cancelacion`, `conversion` (and C-12's future `apertura`) never do. No
--     `origen` column yet (C-12 step 7), so origin is inferred as
--     `classifyMovementOrigin` does: device_id = PORTAL_DEVICE_ID → portal
--     (the table is HYBRID, ADR-081), whatever its motivo; for device rows,
--     motivo 'Venta' → sale, 'Conversión' → conversion, 'Devolución de
--     cliente' with a nota starting 'Cancelación de venta:' → cancellation;
--     anything else is manual.
--   * Cancelling or soft-deleting a counted row does not un-count it.
-- A row belongs to the month of its created_at in America/Mexico_City.
-- Active products of a month: created before it ended and not deleted by then
-- (for the open month, "active now").
--
-- p_business_ids NULL = every live business. Periods are 'YYYY-MM', first ≤
-- last, at most 24 months. One row per business per month, zeros included.
-- SECURITY INVOKER on purpose: 0001 FORCEs RLS on the owner, so a definer
-- function would see no tenant; each caller brings its own column grants.

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
       AND (im.device_id = '01HZ8XQN9GZJXV8AKQ5X0WEB01'
            OR (im.motivo NOT IN ('Venta', 'Conversión')
                AND NOT (im.motivo = 'Devolución de cliente'
                         AND starts_with(coalesce(im.nota, ''), 'Cancelación de venta:'))))
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
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON FUNCTION xangarro.usage_counts(text[], text, text) FROM xangarro_app;
  END IF;
END
$$;

-- The metering role: execute it, and read exactly the columns it counts.
-- A permissive SELECT policy beside each table's tenant_isolation, no write.
GRANT EXECUTE ON FUNCTION xangarro.usage_counts(text[], text, text) TO xangarro_metering;
GRANT EXECUTE ON FUNCTION xangarro.current_business_id() TO xangarro_metering;
GRANT SELECT (id, deleted_at) ON public.businesses TO xangarro_metering;
GRANT SELECT (business_id, created_at) ON public.sales TO xangarro_metering;
GRANT SELECT (business_id, created_at) ON public.expenses TO xangarro_metering;
GRANT SELECT (business_id, created_at, device_id, motivo, nota) ON public.inventory_movements
  TO xangarro_metering;
GRANT SELECT (business_id, created_at, deleted_at) ON public.products TO xangarro_metering;

DROP POLICY IF EXISTS metering_read ON public.businesses;
DROP POLICY IF EXISTS metering_read ON public.sales;
DROP POLICY IF EXISTS metering_read ON public.expenses;
DROP POLICY IF EXISTS metering_read ON public.inventory_movements;
DROP POLICY IF EXISTS metering_read ON public.products;
CREATE POLICY metering_read ON public.businesses FOR SELECT TO xangarro_metering USING (true);
CREATE POLICY metering_read ON public.sales FOR SELECT TO xangarro_metering USING (true);
CREATE POLICY metering_read ON public.expenses FOR SELECT TO xangarro_metering USING (true);
CREATE POLICY metering_read ON public.inventory_movements FOR SELECT TO xangarro_metering
  USING (true);
CREATE POLICY metering_read ON public.products FOR SELECT TO xangarro_metering USING (true);
