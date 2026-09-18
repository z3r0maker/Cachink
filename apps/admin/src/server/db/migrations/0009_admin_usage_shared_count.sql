-- The console's usage read delegates its counting to data-pg (N-02, N-07).
--
-- 0006 carried its own copy of the OQ-5 counting rules. The nightly recompute
-- needs the same count, so the rules moved into ONE SQL function,
-- `xangarro.usage_counts()` (packages/data-pg/drizzle/0010_usage_counts.sql),
-- and this function keeps only what is the console's: the keyset page of
-- tenants and the three-month window. Same signature, same rows, same order,
-- so `../usage.ts` does not change.
--
-- Apply after data-pg's migrations and after 0006, whose column grants the
-- shared function still runs on (SECURITY INVOKER: it counts as the caller).

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
  counts AS (
    SELECT u.*
      FROM xangarro.usage_counts(
             ARRAY(SELECT id FROM page),
             to_char(to_date(p_period || '-01', 'YYYY-MM-DD') - interval '2 months', 'YYYY-MM'),
             p_period) AS u
     WHERE p_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  )
  SELECT pg.id,
         pg.nombre,
         to_json(pg.created_at) #>> '{}',
         c.period,
         c.transactions,
         c.active_products
    FROM page pg
    JOIN counts c ON c.business_id = pg.id
   ORDER BY pg.created_at DESC, pg.id DESC, c.period DESC
$fn$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT USAGE ON SCHEMA xangarro TO xangarro_admin;
    GRANT EXECUTE ON FUNCTION xangarro.usage_counts(text[], text, text) TO xangarro_admin;
  END IF;
END
$$;
