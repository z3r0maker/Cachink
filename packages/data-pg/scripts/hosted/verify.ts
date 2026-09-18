/**
 * Posture warnings after the migrations (and in a dry run), B-01: DB-RLS-03's
 * SECURITY DEFINER owners, the login roles, and SEC-DATA-01's exposure.
 */
import type { Sql } from 'postgres';

import { LOGIN_ROLES } from './roles';

const ROLE_NAMES = LOGIN_ROLES.map((r) => r.role);

async function definerWarnings(sql: Sql): Promise<string[]> {
  const rows = await sql<
    { fn: string; owner: string; bypass: boolean; pinned: boolean; auth: boolean; open: boolean }[]
  >`
    SELECT n.nspname || '.' || p.proname AS fn, r.rolname AS owner,
           (r.rolsuper OR r.rolbypassrls) AS bypass,
           coalesce(array_to_string(p.proconfig, ',') LIKE '%search_path=%', false) AS pinned,
           (p.prosrc NOT ILIKE '%auth.users%'
             OR has_table_privilege(r.oid, 'auth.users', 'SELECT')) AS auth,
           EXISTS (SELECT 1 FROM pg_roles g WHERE g.rolname IN ('anon', 'authenticated')
                     AND has_function_privilege(g.oid, p.oid, 'EXECUTE')) AS open
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_roles r ON r.oid = p.proowner
    WHERE p.prosecdef AND n.nspname IN ('public', 'xangarro')
    ORDER BY 1`;
  return rows.flatMap((f) => [
    ...(f.bypass
      ? []
      : [
          `DB-RLS-03: ${f.fn} is owned by ${f.owner}, which neither is superuser nor has BYPASSRLS — FORCE RLS will hide every row from it`,
        ]),
    ...(f.pinned ? [] : [`${f.fn} is SECURITY DEFINER without a pinned search_path`]),
    ...(f.auth ? [] : [`${f.fn} reads auth.users but its owner ${f.owner} has no SELECT on it`]),
    ...(f.open ? [`${f.fn} is SECURITY DEFINER and executable by anon/authenticated`] : []),
  ]);
}

async function loginRoleWarnings(sql: Sql): Promise<string[]> {
  const rows = await sql<
    { role: string; login: boolean; risky: boolean; member_of: string | null; timeouts: boolean }[]
  >`
    SELECT r.rolname AS role, r.rolcanlogin AS login,
           (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolreplication) AS risky,
           (SELECT string_agg(b.rolname, ', ') FROM pg_auth_members m
              JOIN pg_roles b ON b.oid = m.roleid WHERE m.member = r.oid) AS member_of,
           EXISTS (SELECT 1 FROM pg_db_role_setting s
                    WHERE s.setrole = r.oid AND s.setdatabase = 0
                      AND array_to_string(s.setconfig, ',') LIKE '%statement_timeout=%'
                      AND array_to_string(s.setconfig, ',') LIKE '%idle_in_transaction_session_timeout=%'
                  ) AS timeouts
    FROM pg_roles r WHERE r.rolname IN ${sql(ROLE_NAMES)} ORDER BY 1`;
  const found = new Set(rows.map((r) => r.role));
  return [
    ...ROLE_NAMES.filter((n) => !found.has(n)).map((n) => `${n} does not exist`),
    ...rows.flatMap((r) => [
      ...(r.login ? [] : [`${r.role} cannot log in`]),
      ...(r.risky ? [`${r.role} has SUPERUSER/BYPASSRLS/CREATEROLE/REPLICATION`] : []),
      ...(r.member_of ? [`${r.role} is a member of ${r.member_of} and inherits its grants`] : []),
      ...(r.timeouts
        ? []
        : [`${r.role} has no statement/idle-in-transaction timeout (DB-CONN-01)`]),
    ]),
  ];
}

async function exposureWarnings(sql: Sql): Promise<string[]> {
  const rows = await sql<{ rel: string; kind: string }[]>`
    SELECT n.nspname || '.' || c.relname AS rel,
           CASE WHEN NOT c.relrowsecurity THEN 'no RLS' ELSE 'Data API grant' END AS kind
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p') AND n.nspname IN ('public', 'xangarro')
      -- xangarro.* tables have no RLS by design: no role has a grant on them;
      -- they are reached only through SECURITY DEFINER functions (ADR-079).
      AND ((NOT c.relrowsecurity AND n.nspname = 'public')
           OR EXISTS (SELECT 1 FROM pg_roles g WHERE g.rolname IN ('anon', 'authenticated')
                        AND has_table_privilege(g.oid, c.oid, 'SELECT, INSERT, UPDATE, DELETE')))
    ORDER BY 1`;
  return rows.map((r) =>
    r.kind === 'no RLS'
      ? `${r.rel} has row level security disabled`
      : `${r.rel} is readable or writable by anon/authenticated (SEC-DATA-01)`,
  );
}

/**
 * The app role's view of `auth.users`. The local compat layer grants it; on
 * hosted those grants are excluded (provisioning.md §4), so say what breaks.
 */
async function appAuthWarnings(sql: Sql): Promise<string[]> {
  const [row] = await sql<{ insert: boolean; select: boolean }[]>`
    SELECT has_table_privilege(r.oid, 'auth.users', 'INSERT') AS insert,
           has_column_privilege(r.oid, 'auth.users', 'email', 'SELECT') AS select
    FROM pg_roles r WHERE r.rolname = 'xangarro_app' AND to_regclass('auth.users') IS NOT NULL`;
  if (row === undefined || (row.insert && row.select)) return [];
  return [
    'xangarro_app cannot INSERT into / SELECT email from auth.users: portal sign-up ' +
      '(server/onboarding/signup-store.ts) will fail with permission denied until the portal owner ' +
      'moves it behind a SECURITY DEFINER function or approves the grants',
  ];
}

export async function verifyPosture(sql: Sql): Promise<string[]> {
  return [
    ...(await definerWarnings(sql)),
    ...(await loginRoleWarnings(sql)),
    ...(await exposureWarnings(sql)),
    ...(await appAuthWarnings(sql)),
  ];
}
