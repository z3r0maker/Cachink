-- Opening balances (C-20, N-17): day-one facts so the Balance (NIF B-6) is
-- right from the first statement.
--
-- 1. `opening_balances` (header: fecha de apertura, caja, bancos) and
--    `opening_balance_clients` (one saldo inicial per cliente) — DOWN tables
--    on the wire, written only by the portal. The header becomes read-only
--    once `locked_at` is set: N-17's explicit owner lock, v1's stand-in for
--    the first period close (owner decision 2026-09-18). Inventory valuation
--    is derived (apertura movements × costo, N-17), never stored.
--
-- 2. `xangarro.usage_counts()` v2: opening-stock movements (motivo
--    'Apertura de inventario', written only by N-17's capture step) never
--    count toward the monthly limit — the SQL twin of the same rule added to
--    `classifyMovementOrigin`. The number space: Track O took 0023/0024
--    concurrently; this file is 0025.

CREATE TABLE opening_balances (
  id text PRIMARY KEY NOT NULL,
  business_id text NOT NULL,
  fecha_apertura text NOT NULL,
  caja_centavos bigint NOT NULL,
  bancos_centavos bigint NOT NULL,
  locked_at timestamptz,
  device_id text NOT NULL,
  created_by_user_id text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz
);

CREATE TABLE opening_balance_clients (
  id text PRIMARY KEY NOT NULL,
  business_id text NOT NULL,
  cliente_id text NOT NULL,
  saldo_centavos bigint NOT NULL,
  device_id text NOT NULL,
  created_by_user_id text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz
);

ALTER TABLE public.opening_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_balances FORCE ROW LEVEL SECURITY;
ALTER TABLE public.opening_balance_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_balance_clients FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.opening_balances
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));

CREATE POLICY tenant_isolation ON public.opening_balance_clients
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));

-- The portal reads, writes and (never) deletes its own rows.
REVOKE DELETE ON public.opening_balances FROM xangarro_app;
REVOKE DELETE ON public.opening_balance_clients FROM xangarro_app;
GRANT SELECT, INSERT, UPDATE ON public.opening_balances TO xangarro_app;
GRANT SELECT, INSERT, UPDATE ON public.opening_balance_clients TO xangarro_app;

-- 2. usage_counts v2: apertura movements never count (N-17, OQ-5).
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
       AND im.motivo <> 'Apertura de inventario'
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
