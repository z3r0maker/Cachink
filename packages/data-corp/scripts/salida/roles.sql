-- E-44: the two corp roles on the target, NOLOGIN, as drizzle/0001_corp_grants
-- creates them. Their logins, passwords and timeouts are the operator's, set
-- after the restore from the password manager (docs/ops/empresa-lift-out.md).
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
