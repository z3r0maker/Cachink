-- Who may touch the corp schema (ADR-124 §2). Hand-written, like data-pg's
-- grants files: Drizzle Kit does not model roles or privileges.
--
-- * xangarro_corp       the console's CORP_DATABASE_URL: reads and writes,
--                       never deletes (a correction is a new row, ADR-124 §4).
-- * xangarro_corp_agent the agents' login (corp-tools, E-30): reads only. E-31
--                       will add INSERT on corp.agent_proposals and nothing else.
-- * everyone else       nothing — not the portal, not the console's platform
--                       login, not Supabase's API roles.
--
-- NOLOGIN here, like every role a migration names: a hosted project gets its
-- logins (and secret passwords) from the operator (data-pg
-- scripts/hosted/roles.ts); the local logins are in ../local/.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_corp') THEN
    CREATE ROLE xangarro_corp NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_corp_agent') THEN
    CREATE ROLE xangarro_corp_agent NOLOGIN;
  END IF;
END
$$;

REVOKE ALL ON SCHEMA corp FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA corp FROM PUBLIC;

-- Belt and braces for the roles that exist in some environments only.
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['xangarro_app', 'xangarro_admin', 'xangarro_billing',
                           'xangarro_metering', 'anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA corp FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA corp FROM %I', r);
    END IF;
  END LOOP;
END
$$;

GRANT USAGE ON SCHEMA corp TO xangarro_corp, xangarro_corp_agent;
GRANT SELECT, INSERT, UPDATE ON corp.projects, corp.founders TO xangarro_corp;
GRANT SELECT ON corp.projects, corp.founders TO xangarro_corp_agent;

-- Xangarro is the first project (ADR-124 §3).
INSERT INTO corp.projects (id, slug, nombre, created_at)
VALUES ('xangarro', 'xangarro', 'Xangarro', now())
ON CONFLICT (slug) DO NOTHING;
