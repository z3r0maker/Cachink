-- E-44: the two corp roles' privileges as GRANT statements, one per line and
-- sorted. Read from the catalog's ACLs (not information_schema, which hides
-- what the current user is not a member of), so the output is the same on a
-- true superuser and on a managed `postgres` login.
--
-- `exportar` saves it as permisos.sql and `importar` replays it, because the
-- dump itself carries no privileges: a source's grants to roles the target
-- does not have (Supabase's anon, service_role…) would fail the restore.
-- `verificar` runs it again on the target and compares.
WITH roles AS (
  SELECT oid, rolname FROM pg_roles WHERE rolname IN ('xangarro_corp', 'xangarro_corp_agent')
), objects AS (
  SELECT format('SCHEMA %I', n.nspname) AS what, n.nspacl AS acl
    FROM pg_namespace n WHERE n.nspname = 'corp'
  UNION ALL
  SELECT format('%I.%I', n.nspname, c.relname), c.relacl
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'corp'
), columns AS (
  SELECT format('(%I) ON %I.%I', a.attname, n.nspname, c.relname) AS what, a.attacl AS acl
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'corp' AND a.attnum > 0 AND NOT a.attisdropped AND a.attacl IS NOT NULL
)
SELECT g FROM (
  SELECT format('GRANT %s ON %s TO %I;', x.privilege_type, o.what, r.rolname) AS g
    FROM objects o CROSS JOIN LATERAL aclexplode(o.acl) x JOIN roles r ON r.oid = x.grantee
  UNION ALL
  SELECT format('GRANT %s %s TO %I;', x.privilege_type, c.what, r.rolname)
    FROM columns c CROSS JOIN LATERAL aclexplode(c.acl) x JOIN roles r ON r.oid = x.grantee
) s
ORDER BY g;
