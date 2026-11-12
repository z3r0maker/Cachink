-- E-44: anyone other than the two corp roles and the objects' owner who holds
-- a privilege on corp, PUBLIC included. On the target this must print nothing:
-- a cap table and the agreement's records are not for every login.
WITH acls AS (
  SELECT 'schema corp' AS what, n.nspacl AS acl, n.nspowner AS owner
    FROM pg_namespace n WHERE n.nspname = 'corp'
  UNION ALL
  SELECT 'corp.' || c.relname, c.relacl, c.relowner
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'corp'
  UNION ALL
  SELECT format('corp.%s.%s', c.relname, a.attname), a.attacl, c.relowner
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'corp' AND a.attnum > 0 AND NOT a.attisdropped
)
SELECT DISTINCT format('%s %s on %s', coalesce(r.rolname, 'PUBLIC'), x.privilege_type, a.what)
  FROM acls a
  CROSS JOIN LATERAL aclexplode(a.acl) x
  LEFT JOIN pg_roles r ON r.oid = x.grantee
 WHERE x.grantee <> a.owner
   AND coalesce(r.rolname, 'PUBLIC') NOT IN ('xangarro_corp', 'xangarro_corp_agent')
 ORDER BY 1;
