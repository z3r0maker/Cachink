-- The console's read of signup attribution (N-57's other half, ADR-092).
--
-- Same shape as 0013_owner_last_login.sql and 0015_admin_geo_read.sql: one
-- SECURITY DEFINER function answering one question, `search_path` pinned,
-- EXECUTE to `xangarro_admin` alone.
--
-- Grouped, never row-level: a row here is one business, so returning rows
-- would hand the console a per-business location. The grouping is
-- (source, medium, campaign, region) with a count, which answers "which
-- campaign, in which state, produced signups" without naming any of them.
--
-- `xangarro_admin` cannot EXECUTE `signup_attribution_record` (0032): the
-- console reads this, the portal writes it.

CREATE OR REPLACE FUNCTION xangarro.admin_attribution_rollup(p_from date, p_to date)
RETURNS TABLE (source text, medium text, campaign text, region text, signups bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT a.source, a.medium, a.campaign, a.region, count(*)::bigint
  FROM xangarro.signup_attribution a
  WHERE a.created_at >= p_from AND a.created_at < (p_to + 1)
  GROUP BY a.source, a.medium, a.campaign, a.region;
$$;

REVOKE ALL ON FUNCTION xangarro.admin_attribution_rollup(date, date) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT EXECUTE ON FUNCTION xangarro.admin_attribution_rollup(date, date) TO xangarro_admin;
  END IF;
END
$$;
