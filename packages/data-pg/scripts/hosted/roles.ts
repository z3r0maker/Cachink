/**
 * The four LOGIN roles every app connects with (B-01). No Supabase key is used
 * anywhere: each app has its own restricted Postgres login.
 *
 * Passwords never reach the server in clear. The script sends a SCRAM-SHA-256
 * verifier (what `psql`'s `\password` does), so an `ALTER ROLE` that lands in
 * Supabase's DDL log carries no password.
 */
import { createHash, createHmac, pbkdf2Sync, randomBytes } from 'node:crypto';

import type { Sql } from 'postgres';

export interface LoginRole {
  readonly role: string;
  /** Environment variable holding its password. */
  readonly env: string;
  /** Who connects with it. */
  readonly usedBy: string;
  /** DB-CONN-01: bounds on a runaway query and an abandoned transaction. */
  readonly statementTimeout: string;
  readonly idleInTransactionTimeout: string;
}

export const LOGIN_ROLES: readonly LoginRole[] = [
  {
    role: 'xangarro_app',
    env: 'XANGARRO_APP_PASSWORD',
    usedBy: 'portal DATABASE_URL (tenant requests, RLS-bound)',
    statementTimeout: '5s',
    idleInTransactionTimeout: '10s',
  },
  {
    role: 'xangarro_billing',
    env: 'XANGARRO_BILLING_PASSWORD',
    usedBy: 'portal BILLING_DATABASE_URL (Stripe webhook, billing actions)',
    statementTimeout: '10s',
    idleInTransactionTimeout: '10s',
  },
  {
    role: 'xangarro_metering',
    env: 'XANGARRO_METERING_PASSWORD',
    usedBy: 'portal METERING_DATABASE_URL (nightly usage recompute)',
    statementTimeout: '60s',
    idleInTransactionTimeout: '10s',
  },
  {
    role: 'xangarro_admin',
    env: 'XANGARRO_ADMIN_PASSWORD',
    usedBy: 'admin DATABASE_URL (staff console, cross-tenant read)',
    statementTimeout: '15s',
    idleInTransactionTimeout: '10s',
  },
] as const;

/** Printable ASCII only (no SASLprep surprises), long enough to be random. */
export function passwordProblem(password: string | undefined): string | null {
  if (password === undefined || password === '') return 'is not set';
  if (password.length < 24) return 'is shorter than 24 characters';
  if (!/^[\x21-\x7e]+$/.test(password)) return 'must be printable ASCII with no spaces';
  return null;
}

/** The `SCRAM-SHA-256$<iter>:<salt>$<StoredKey>:<ServerKey>` Postgres stores. */
export function scramVerifier(password: string, salt = randomBytes(16), iterations = 4096) {
  const salted = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  const clientKey = createHmac('sha256', salted).update('Client Key').digest();
  const storedKey = createHash('sha256').update(clientKey).digest();
  const serverKey = createHmac('sha256', salted).update('Server Key').digest();
  const b64 = (b: Buffer) => b.toString('base64');
  return `SCRAM-SHA-256$${iterations}:${b64(salt)}$${b64(storedKey)}:${b64(serverKey)}`;
}

export type RoleAction = 'create' | 'update';

export async function roleActions(sql: Sql): Promise<Map<string, RoleAction>> {
  const rows = await sql<{ rolname: string }[]>`
    SELECT rolname FROM pg_roles WHERE rolname IN ${sql(LOGIN_ROLES.map((r) => r.role))}`;
  const existing = new Set(rows.map((r) => r.rolname));
  return new Map(LOGIN_ROLES.map((r) => [r.role, existing.has(r.role) ? 'update' : 'create']));
}

/**
 * Create the role, or bring an existing one to the wanted password and
 * timeouts. Attributes are left at their defaults (no SUPERUSER, BYPASSRLS,
 * CREATEROLE, REPLICATION); `verify.ts` asserts that afterwards, because a
 * non-superuser may not even name those attributes in `ALTER ROLE`.
 */
export async function ensureRole(sql: Sql, spec: LoginRole, password: string): Promise<void> {
  const verifier = scramVerifier(password);
  const [exists] = await sql`SELECT 1 FROM pg_roles WHERE rolname = ${spec.role}`;
  const ident = sql(spec.role);
  if (exists === undefined) {
    await sql`CREATE ROLE ${ident} LOGIN PASSWORD ${sql.unsafe(literal(verifier))}`;
  } else {
    await sql`ALTER ROLE ${ident} WITH LOGIN PASSWORD ${sql.unsafe(literal(verifier))}`;
  }
  await sql`ALTER ROLE ${ident} SET statement_timeout = ${sql.unsafe(literal(spec.statementTimeout))}`;
  await sql`ALTER ROLE ${ident} SET idle_in_transaction_session_timeout = ${sql.unsafe(
    literal(spec.idleInTransactionTimeout),
  )}`;
}

/** A SQL string literal. The verifier alphabet is base64 plus `$:-`, never a quote. */
function literal(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}
