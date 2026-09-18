-- Usage per tenant for the admin console (N-07, ADR-065, OQ-5).
--
-- Until N-02's usage_counters table exists, the console recomputes usage from
-- source rows, with the same rules as `computeUsage` in @xangarro/domain/usage.
-- Apply after 0004_admin_tenant_read.sql. When usage_counters lands, the
-- console reads it instead and this function is dropped in its own migration.
--
-- Access. Same shape as 0004: a permissive SELECT policy TO xangarro_admin
-- beside each table's tenant_isolation policy, and no write grant. The grant
-- is column-level — only the columns the count needs — so the console can
-- count a tenant's sales without being able to read what was sold or for how
-- much. SECURITY INVOKER on purpose: 0001_rls.sql FORCEs RLS on the table
-- owner, so a SECURITY DEFINER function would see no tenant at all.
--
-- What counts (OQ-5, `countsTowardUsage`):
--   * sales: one per row. Tickets (ADR-073) are not on main yet, so every
--     sale is a pre-ticket one-line sale (`ticketId: null` in the domain) and
--     counts once. When the tickets table lands, count tickets instead.
--   * expenses: one per row.
--   * inventory_movements: manual ones only. The table has no `origen`
--     column on main, so origin is inferred exactly as
--     `classifyMovementOrigin` does: motivo 'Venta' → sale, 'Conversión' →
--     conversion, 'Devolución de cliente' with a nota starting
--     'Cancelación de venta:' → cancellation; anything else is manual.
--   * Cancelling or soft-deleting a counted row does not un-count it, so
--     deleted_at is not filtered for transactions.
-- Which instant places a row in a month: created_at (capture time, set once),
-- in America/Mexico_City — the same `at` the nightly recompute must use.
-- Active products at the end of each month: created before the month ended
-- and not deleted by then (for the open month, that is "active now").

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    RETURN;
  END IF;

  GRANT SELECT (business_id, created_at) ON public.sales TO xangarro_admin;
  GRANT SELECT (business_id, created_at) ON public.expenses TO xangarro_admin;
  GRANT SELECT (business_id, created_at, motivo, nota) ON public.inventory_movements TO xangarro_admin;
  GRANT SELECT (business_id, created_at, deleted_at) ON public.products TO xangarro_admin;

  DROP POLICY IF EXISTS admin_read ON public.sales;
  DROP POLICY IF EXISTS admin_read ON public.expenses;
  DROP POLICY IF EXISTS admin_read ON public.inventory_movements;
  DROP POLICY IF EXISTS admin_read ON public.products;
  CREATE POLICY admin_read ON public.sales FOR SELECT TO xangarro_admin USING (true);
  CREATE POLICY admin_read ON public.expenses FOR SELECT TO xangarro_admin USING (true);
  CREATE POLICY admin_read ON public.inventory_movements FOR SELECT TO xangarro_admin USING (true);
  CREATE POLICY admin_read ON public.products FOR SELECT TO xangarro_admin USING (true);
END
$$;

-- One page of tenants (newest first, keyset after (p_after_created_at,
-- p_after_id)) with one row per tenant per month: p_period ('YYYY-MM', the
-- open MX month) and the two months before it — enough for "% this month" and
-- for `consecutiveMonthsOver` on the last two closed months.
CREATE OR REPLACE FUNCTION public.admin_tenant_usage(
  p_period text,
  p_after_created_at timestamptz,
  p_after_id text,
  p_limit integer
)
RETURNS TABLE (
  business_id text,
  nombre text,
  created_at text,
  period text,
  transactions integer,
  active_products integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
  WITH page AS (
    SELECT b.id, b.nombre, b.created_at
      FROM public.businesses b
     WHERE b.deleted_at IS NULL
       AND (p_after_id IS NULL OR (b.created_at, b.id) < (p_after_created_at, p_after_id))
     ORDER BY b.created_at DESC, b.id DESC
     LIMIT least(greatest(p_limit, 1), 500)
  ),
  months AS (
    SELECT m::timestamp AS m
      FROM generate_series(
             to_date(p_period || '-01', 'YYYY-MM-DD') - interval '2 months',
             to_date(p_period || '-01', 'YYYY-MM-DD'),
             interval '1 month') AS m
     WHERE p_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  ),
  periods AS (
    SELECT to_char(m, 'YYYY-MM') AS period,
           m AT TIME ZONE 'America/Mexico_City' AS starts,
           (m + interval '1 month') AT TIME ZONE 'America/Mexico_City' AS ends
      FROM months
  ),
  win AS (SELECT min(starts) AS lo, max(ends) AS hi FROM periods),
  tx AS (
    SELECT s.business_id, s.created_at
      FROM public.sales s, win
     WHERE s.business_id IN (SELECT id FROM page)
       AND s.created_at >= win.lo AND s.created_at < win.hi
    UNION ALL
    SELECT e.business_id, e.created_at
      FROM public.expenses e, win
     WHERE e.business_id IN (SELECT id FROM page)
       AND e.created_at >= win.lo AND e.created_at < win.hi
    UNION ALL
    SELECT im.business_id, im.created_at
      FROM public.inventory_movements im, win
     WHERE im.business_id IN (SELECT id FROM page)
       AND im.created_at >= win.lo AND im.created_at < win.hi
       AND im.motivo NOT IN ('Venta', 'Conversión')
       AND NOT (im.motivo = 'Devolución de cliente'
                AND starts_with(coalesce(im.nota, ''), 'Cancelación de venta:'))
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
     WHERE pr.business_id IN (SELECT id FROM page)
     GROUP BY pr.business_id, p.period
  )
  SELECT pg.id,
         pg.nombre,
         to_json(pg.created_at) #>> '{}',
         p.period,
         coalesce(t.n, 0),
         coalesce(q.n, 0)
    FROM page pg
    CROSS JOIN periods p
    LEFT JOIN tx_n t ON t.business_id = pg.id AND t.period = p.period
    LEFT JOIN prod_n q ON q.business_id = pg.id AND q.period = p.period
   ORDER BY pg.created_at DESC, pg.id DESC, p.period DESC
$fn$;

REVOKE ALL ON FUNCTION public.admin_tenant_usage(text, timestamptz, text, integer) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON FUNCTION public.admin_tenant_usage(text, timestamptz, text, integer)
      FROM xangarro_app;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT EXECUTE ON FUNCTION public.admin_tenant_usage(text, timestamptz, text, integer)
      TO xangarro_admin;
  END IF;
END
$$;
