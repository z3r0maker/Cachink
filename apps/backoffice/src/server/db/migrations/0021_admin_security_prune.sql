-- The daily digest cron prunes the portal's sessions and throttle rows
-- (DB2-CRON-01; ADR-114).
--
-- data-pg 0006 wrote `xangarro.security_prune()` — throttle rows outside any
-- window, portal sessions a day past expiry or revocation — and granted it to
-- the app role, but nothing ever called it: `xangarro.portal_sessions` and
-- `xangarro.throttle` only grew. The console's daily cron already runs the
-- other retention sweeps (staff sessions, geo and latency counters), so it
-- runs this one too. EXECUTE only: the function is the whole surface, and it
-- deletes nothing a live session or an active lockout still needs.

-- `SET LOCAL`: the timeout dies with this file's transaction instead of
-- staying on the runner's session (R2-13). 200 ms, and the runner retries the
-- whole file with backoff when it expires (DB3-MIG-01; ADR-114 amendment).
SET LOCAL lock_timeout = '200ms';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT USAGE ON SCHEMA xangarro TO xangarro_admin;
    GRANT EXECUTE ON FUNCTION xangarro.security_prune() TO xangarro_admin;
  END IF;
END
$$;
