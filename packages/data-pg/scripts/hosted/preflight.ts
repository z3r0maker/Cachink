/**
 * What must hold before `db:migrate:hosted` writes anything (B-01). Each
 * failure is a blocker with the SQL that fixes it, so a hosted gap fails at
 * migrate time — in the dry run — and never as a broken login at runtime.
 *
 * The migrating role (normally `postgres`) becomes the owner of every
 * `xangarro.*` SECURITY DEFINER function. Those functions read `auth.users`
 * (login_lookup, link_issue), update `encrypted_password` (password reset,
 * 0015), and read or write FORCE-RLS tables — businesses, business_members,
 * devices, portal_sessions (memberships_for_user, business_archive 0016) — so
 * the owner must be able to do all of that itself (DB-RLS-03).
 */
import type { Sql } from 'postgres';

export interface Blocker {
  readonly problem: string;
  /** SQL that fixes it, and who can run it. */
  readonly fix?: string;
}

const AUTH_COLUMNS = [
  'id',
  'email',
  'encrypted_password',
  'email_confirmed_at',
  'created_at',
  'updated_at',
];
const SUPPORT = 'needs a superuser: on hosted Supabase, ask Supabase support to run it';

interface Facts {
  user: string;
  createrole: boolean;
  bypass: boolean;
  auth: boolean;
  id_type: string | null;
  missing: string[];
  read_write: boolean;
  regrant: boolean;
}

async function facts(sql: Sql): Promise<Facts | undefined> {
  const [row] = await sql<Facts[]>`
    WITH cols AS (
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users')
    SELECT current_user AS user, (r.rolcreaterole OR r.rolsuper) AS createrole,
           (r.rolsuper OR r.rolbypassrls) AS bypass,
           to_regclass('auth.users') IS NOT NULL AS auth,
           (SELECT data_type FROM cols WHERE column_name = 'id') AS id_type,
           ARRAY(SELECT c FROM unnest(${AUTH_COLUMNS}::text[]) c
                  WHERE c NOT IN (SELECT column_name FROM cols)) AS missing,
           CASE WHEN to_regclass('auth.users') IS NULL THEN false
                ELSE has_schema_privilege('auth', 'USAGE')
                 AND has_table_privilege('auth.users', 'SELECT')
                 AND has_table_privilege('auth.users', 'UPDATE') END AS read_write,
           CASE WHEN to_regclass('auth.users') IS NULL THEN false
                ELSE has_schema_privilege('auth', 'USAGE WITH GRANT OPTION')
                 AND has_table_privilege('auth.users', 'SELECT WITH GRANT OPTION') END AS regrant
    FROM pg_roles r WHERE r.rolname = current_user`;
  return row;
}

function authBlockers(f: Facts, pending: ReadonlySet<string>): Blocker[] {
  if (!f.auth) return [{ problem: 'auth.users does not exist: this is not a Supabase project' }];
  const out: Blocker[] = [];
  if (f.id_type !== 'uuid' || f.missing.length > 0) {
    const cols = f.missing.length > 0 ? `; missing ${f.missing.join(', ')}` : '';
    out.push({
      problem: `auth.users is not GoTrue-shaped (id is ${f.id_type ?? 'absent'}, not uuid${cols})`,
    });
  }
  if (!f.read_write) {
    out.push({
      problem: `${f.user} cannot SELECT and UPDATE auth.users; login_lookup, link_issue and password reset run as it`,
      fix: `GRANT USAGE ON SCHEMA auth TO ${f.user}; GRANT SELECT, UPDATE ON auth.users TO ${f.user}; -- ${SUPPORT}`,
    });
  }
  if (!f.regrant && pending.has('admin/0004_admin_tenant_read.sql')) {
    out.push({
      problem: `${f.user} cannot re-grant auth.users; admin/0004 grants SELECT (id, email) to xangarro_admin`,
      fix: `GRANT USAGE ON SCHEMA auth TO ${f.user} WITH GRANT OPTION; GRANT SELECT ON auth.users TO ${f.user} WITH GRANT OPTION; -- ${SUPPORT}`,
    });
  }
  return out;
}

export async function preflight(sql: Sql, pending: ReadonlySet<string>): Promise<Blocker[]> {
  const f = await facts(sql);
  if (f === undefined) return [{ problem: 'cannot read the current role' }];
  const out: Blocker[] = [];
  if (!f.createrole) {
    out.push({
      problem: `${f.user} lacks CREATEROLE: cannot create the login roles`,
      fix: `ALTER ROLE ${f.user} CREATEROLE; -- ${SUPPORT}`,
    });
  }
  if (!f.bypass) {
    out.push({
      problem: `${f.user} has no BYPASSRLS: the SECURITY DEFINER functions it will own see no rows of the FORCE-RLS tables businesses, business_members, devices, portal_sessions (sign-in, activation and archive break)`,
      fix: `ALTER ROLE ${f.user} BYPASSRLS; -- ${SUPPORT}`,
    });
  }
  return [...out, ...authBlockers(f, pending)];
}
