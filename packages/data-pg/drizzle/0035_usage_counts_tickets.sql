-- `xangarro.usage_counts()` v4: one transaction per ticket (N-02 / N-07,
-- ADR-065, ADR-073).
--
-- 0029's body counted every `sales` row. Since ADR-073 a sale is a ticket
-- plus its lines, and the domain rule (`counts-toward-usage.ts`) counts one
-- transaction per ticket — a line counts on its own only when it has no
-- ticket (a row pushed by a pre-ADR-073 device, `ticket_id IS NULL`). A
-- three-line ticket was three transactions against the plan limit; now it is
-- one. Nothing else in the body changes; it is repeated whole because a SQL
-- function is replaced whole (migrations are append-only, CLAUDE.md §2.9).
--
-- A ticket is placed in the month of its first line's capture instant, the
-- same `created_at` the lines already carried. The count is SECURITY INVOKER,
-- so the two callers gain SELECT on `sales.ticket_id`: the nightly recompute
-- (`xangarro_metering`) here, the console (`xangarro_admin`, backoffice 0006
-- grants its other columns) when that role exists.
-- The nightly recompute rewrites `usage_counters` from this body, so stored
-- over-counts correct themselves on the next run.

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
    -- One per ticket, however many lines it has (ADR-073).
    SELECT s.business_id, min(s.created_at) AS created_at
      FROM public.sales s, win
     WHERE s.business_id IN (SELECT id FROM ids)
       AND s.created_at >= win.lo AND s.created_at < win.hi
       AND s.ticket_id IS NOT NULL
     GROUP BY s.business_id, s.ticket_id
    UNION ALL
    -- A line with no ticket is a pre-ADR-073 sale: itself one transaction.
    SELECT s.business_id, s.created_at
      FROM public.sales s, win
     WHERE s.business_id IN (SELECT id FROM ids)
       AND s.created_at >= win.lo AND s.created_at < win.hi
       AND s.ticket_id IS NULL
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
GRANT SELECT (business_id, created_at, ticket_id) ON public.sales TO xangarro_metering;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT SELECT (ticket_id) ON public.sales TO xangarro_admin;
  END IF;
END
$$;
