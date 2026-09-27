-- The digest reads usage from `usage_counters`, not from source rows
-- (DB2-CRON-01; ADR-118).
--
-- The digest's «Negocios sobre su límite» section pages tenants through
-- `admin_tenant_usage` (0009), which recounts three months of every tenant's
-- sales, expenses and movements through `xangarro.usage_counts` — up to
-- 1,000 tenants a morning, a cost that grows with every row the platform
-- ever stores. The nightly usage job (N-02, 03:00 CDMX) has already written
-- those numbers to `usage_counters` five hours earlier, from the same
-- function; the digest runs at 08:00 and only needs yesterday's view.
--
-- `admin_tenant_usage_stored` is `admin_tenant_usage`'s twin — same
-- signature, same rows, same keyset order — reading the stored counters.
-- A month the job has not stored reads as zero. /uso keeps the live recount;
-- only the digest switches.
--
-- The console gains SELECT on the table the counts already describe (no
-- write, no delete), under a read-only policy, as 0006 does for the source
-- tables. Apply after data-pg's migrations.

-- `SET LOCAL`: the timeout dies with this file's transaction instead of
-- staying on the runner's session (R2-13). 200 ms, and the runner retries the
-- whole file with backoff when it expires (DB3-MIG-01; ADR-118 amendment).
SET LOCAL lock_timeout = '200ms';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT SELECT (business_id, period, transactions, products)
      ON public.usage_counters TO xangarro_admin;
    DROP POLICY IF EXISTS admin_read ON public.usage_counters;
    CREATE POLICY admin_read ON public.usage_counters
      FOR SELECT TO xangarro_admin USING (true);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.admin_tenant_usage_stored(
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
  periods AS (
    SELECT to_char(m, 'YYYY-MM') AS period
      FROM generate_series(
             to_date(p_period || '-01', 'YYYY-MM-DD') - interval '2 months',
             to_date(p_period || '-01', 'YYYY-MM-DD'),
             interval '1 month') AS m
     WHERE p_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  )
  SELECT pg.id,
         pg.nombre,
         to_json(pg.created_at) #>> '{}',
         p.period,
         coalesce(u.transactions, 0),
         coalesce(u.products, 0)
    FROM page pg
    CROSS JOIN periods p
    LEFT JOIN public.usage_counters u ON u.business_id = pg.id AND u.period = p.period
   ORDER BY pg.created_at DESC, pg.id DESC, p.period DESC
$fn$;

REVOKE ALL ON FUNCTION public.admin_tenant_usage_stored(text, timestamptz, text, integer)
  FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON FUNCTION public.admin_tenant_usage_stored(text, timestamptz, text, integer)
      FROM xangarro_app;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT EXECUTE ON FUNCTION public.admin_tenant_usage_stored(text, timestamptz, text, integer)
      TO xangarro_admin;
  END IF;
END
$$;
