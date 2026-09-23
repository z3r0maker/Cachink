-- Retention for the geographic counters (N-61, ADR-092).
--
-- The table is bounded by construction — 3 sources x ~33 regions x 365 days is
-- about 36k rows a year — so this is hygiene rather than rescue. It exists for
-- the reason the rest of the design does: data nobody is using should not be
-- kept indefinitely, and an aggregate is no exception.
--
-- A SECURITY DEFINER function because **no role holds DELETE on the table**
-- (0031), and that stays true: the console calls this, it does not get a grant.
-- `p_keep_days` is clamped so a caller cannot pass 0 and erase the history in
-- one call.

CREATE OR REPLACE FUNCTION xangarro.geo_prune(p_keep_days integer DEFAULT 400)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_keep integer := greatest(coalesce(p_keep_days, 400), 90);
  v_deleted integer;
BEGIN
  DELETE FROM xangarro.geo_counters
  WHERE day < (now() AT TIME ZONE 'America/Mexico_City')::date - v_keep;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END
$$;

REVOKE ALL ON FUNCTION xangarro.geo_prune(integer) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT EXECUTE ON FUNCTION xangarro.geo_prune(integer) TO xangarro_admin;
  END IF;
END
$$;
