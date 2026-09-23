-- The console's read of the geo counters (N-56, ADR-092).
--
-- Same shape as 0013_owner_last_login.sql: one SECURITY DEFINER function
-- answering exactly one question, `search_path` pinned so a caller cannot
-- shadow what it reads, EXECUTE to `xangarro_admin` alone.
--
-- It returns **counts only**, already grouped. There is no row-level read of
-- `xangarro.geo_counters` anywhere in the console, so no screen and no future
-- query can reconstruct an individual day's visit from a small region — the
-- table is an aggregate and this keeps it one.
--
-- `xangarro_admin` cannot EXECUTE `xangarro.geo_record` (0031): the console
-- reads this data, it never writes it.

CREATE OR REPLACE FUNCTION xangarro.admin_geo_rollup(p_from date, p_to date)
RETURNS TABLE (source text, country text, region text, hits bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT g.source, g.country, g.region, sum(g.hits)::bigint
  FROM xangarro.geo_counters g
  WHERE g.day >= p_from AND g.day < p_to
  GROUP BY g.source, g.country, g.region;
$$;

REVOKE ALL ON FUNCTION xangarro.admin_geo_rollup(date, date) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT USAGE ON SCHEMA xangarro TO xangarro_admin;
    GRANT EXECUTE ON FUNCTION xangarro.admin_geo_rollup(date, date) TO xangarro_admin;
  END IF;
END
$$;
