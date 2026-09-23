-- Who may touch xangarro.geo_counters (N-55, ADR-092).
--
-- Hand-written for the same reason as 0001_rls.sql and 0007_billing_grants.sql:
-- Drizzle Kit models neither roles nor policies.
--
-- * Nobody holds a table privilege. Every write goes through
--   `xangarro.geo_record`, every read through the console's own
--   `xangarro.admin_geo_rollup` (admin migration 0015). The function body is
--   the entire surface, as it is for `throttle` and `portal_sessions`.
-- * RLS is enabled and FORCEd with *zero policies*, so even a future stray
--   GRANT denies every row. `throttle` relies on the absent grant alone; this
--   table wears both belts.
-- * `xangarro_app` writes the login and checkout counts; `xangarro_billing`
--   writes the purchase count from the Stripe path, because a webhook carries
--   no tenant claim. Neither can read the table back.
-- * Nobody DELETEs. A visit that happened stays counted; Phase 6's
--   `geo_prune` will be a definer function, not a grant.
-- * `xangarro_admin` deliberately cannot EXECUTE `geo_record`: the console
--   reads this data, it never writes it.

ALTER TABLE xangarro.geo_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE xangarro.geo_counters FORCE ROW LEVEL SECURITY;

REVOKE ALL ON xangarro.geo_counters FROM PUBLIC;
REVOKE ALL ON xangarro.geo_counters FROM xangarro_app;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_billing') THEN
    EXECUTE 'REVOKE ALL ON xangarro.geo_counters FROM xangarro_billing';
    EXECUTE 'GRANT USAGE ON SCHEMA xangarro TO xangarro_billing';
    EXECUTE 'GRANT EXECUTE ON FUNCTION xangarro.geo_record(text, text, text) TO xangarro_billing';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    EXECUTE 'REVOKE ALL ON xangarro.geo_counters FROM xangarro_admin';
  END IF;
END
$$;

GRANT EXECUTE ON FUNCTION xangarro.geo_record(text, text, text) TO xangarro_app;
