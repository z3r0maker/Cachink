-- Hosted-only (B-01). Applied by `db:migrate:hosted` BEFORE drizzle/.
--
-- `../local/0000_supabase_compat.sql` is NOT applied on hosted. Everything it
-- does is either provisioned by the platform, replaced by the migrate script,
-- or ruled out for hosted by the portal owner (docs/ops/provisioning.md §4
-- lists every statement and its decision):
--
-- * `auth` schema, `auth.users`, `auth.jwt/uid/role/email()`, the
--   `anon`/`authenticated`/`service_role` roles — the platform's; never
--   created, replaced or altered here.
-- * the LOGIN roles with repo-published passwords — the script creates them
--   first, with passwords from the operator's environment.
-- * the `auth.users` grants — excluded on hosted (owner rule); the script's
--   posture check reports what that leaves the app role unable to do.
-- * `GRANT authenticated TO xangarro_app` — allowed but not needed: no policy
--   is `TO authenticated`, so it would only add inherited privileges.
--
-- What this file does instead is SEC-DATA-01: nothing in `public` is reachable
-- through the Data API. The Data API is turned off in the dashboard; this
-- removes the grants it would use, so re-enabling it by mistake exposes
-- nothing. Supabase's default privileges give `anon`, `authenticated` and
-- `service_role` ALL on every object the migrating role creates in `public`;
-- revoke those defaults before drizzle/ creates anything, and whatever exists.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, service_role;
