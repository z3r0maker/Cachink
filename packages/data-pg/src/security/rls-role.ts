import { sql, type SQL } from 'drizzle-orm';

/**
 * The runtime guard on the connected role (audit F-02).
 *
 * Tenant isolation is RLS and nothing else (ADR-053 §7), and Postgres does not
 * apply RLS — not even `FORCE ROW LEVEL SECURITY` — to a superuser or to a
 * role with `BYPASSRLS`. A `DATABASE_URL` that pointed at such a role would
 * make every tenant read every tenant with no error anywhere: the queries
 * succeed, they just return too much. The integration suite and the hosted
 * migrate script check the roles they are run against; this asks the database
 * the process is **actually** connected to, before its first tenant
 * transaction, and refuses.
 */
export type BypassAttribute = 'SUPERUSER' | 'BYPASSRLS' | 'UNKNOWN';

/** The connected role is not bound by RLS (or Postgres would not say). */
export class RlsBypassRoleError extends Error {
  readonly code = 'RLS_BYPASS_ROLE' as const;

  constructor(
    readonly role: string,
    readonly attribute: BypassAttribute,
  ) {
    super(
      attribute === 'UNKNOWN'
        ? `Cannot tell whether the database role ${role} is bound by row-level security; refusing tenant queries.`
        : `The database role ${role} has ${attribute}: row-level security does not apply to it, so it would read every tenant. ` +
            'Connect as the restricted application role (xangarro_app).',
    );
    this.name = 'RlsBypassRoleError';
  }
}

/** What the guard needs of a pool: one statement. `Db` fits, and so does a test's stand-in. */
export interface RoleProbe {
  execute(query: SQL): PromiseLike<ArrayLike<Record<string, unknown>>>;
}

const ROLE_QUERY = sql`
  SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;

/**
 * Throws `RlsBypassRoleError` unless Postgres says the connected role is
 * neither superuser nor BYPASSRLS. Parsed, not asserted: only a literal
 * `false` for both counts as bound — a missing row or an odd value refuses.
 */
export async function assertRlsBoundRole(db: RoleProbe): Promise<void> {
  const row = (await db.execute(ROLE_QUERY))[0];
  const role = typeof row?.['rolname'] === 'string' ? row['rolname'] : 'current_user';
  if (row === undefined) throw new RlsBypassRoleError(role, 'UNKNOWN');
  if (row['rolsuper'] === true) throw new RlsBypassRoleError(role, 'SUPERUSER');
  if (row['rolbypassrls'] === true) throw new RlsBypassRoleError(role, 'BYPASSRLS');
  if (row['rolsuper'] !== false || row['rolbypassrls'] !== false) {
    throw new RlsBypassRoleError(role, 'UNKNOWN');
  }
}

/** One verdict per pool. Weak: a pool that is dropped takes its verdict with it. */
const verdicts = new WeakMap<RoleProbe, Promise<void>>();

/**
 * `assertRlsBoundRole`, **once per pool**: every connection of a pool logs in
 * as the same role, so the first tenant transaction asks and every later one
 * awaits a settled promise — no statement, no round trip. Callers that arrive
 * together share the one question.
 *
 * Fails closed. A refusal is kept for the life of the pool: its connections
 * were opened as that role, and nothing a running process can do changes it.
 * A question that got **no answer** (a connect timeout, a dropped connection)
 * is not a verdict either way: that caller fails, no tenant query runs, and
 * the next caller asks again — otherwise one cold-start timeout would take an
 * instance out for good.
 */
export function ensureRlsBoundRole(
  db: RoleProbe,
  check: (db: RoleProbe) => Promise<void> = assertRlsBoundRole,
): Promise<void> {
  const known = verdicts.get(db);
  if (known !== undefined) return known;
  const asked = check(db);
  verdicts.set(db, asked);
  asked.catch((error: unknown) => {
    const refused = error instanceof RlsBypassRoleError;
    if (!refused && verdicts.get(db) === asked) verdicts.delete(db);
  });
  return asked;
}
