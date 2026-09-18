import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.js';

/**
 * The cloud database client.
 *
 * **Always connect as a non-superuser.** Superusers bypass RLS entirely and
 * `FORCE ROW LEVEL SECURITY` does not apply to them, so a superuser connection
 * silently reads every tenant — see `tests/rls.integration.test.ts`, which
 * asserts `rolsuper = false` before trusting anything else.
 */
export type Db = ReturnType<typeof createDb>;

export function createDb(url: string) {
  // `prepare: false` (audit DB-CONN-01): Supabase's transaction pooler (6543)
  // hands each transaction a different server connection, where a named
  // prepared statement from the last one does not exist. Safe here because
  // every piece of per-request state — the tenant claim, the JWT claims — is
  // set with `set_config(..., true)`, i.e. transaction-local, never on the
  // session. Direct and session-pooler connections lose nothing that matters.
  const sql = postgres(url, { max: 5, prepare: false, onnotice: () => undefined });
  return drizzle(sql, { schema });
}

/**
 * Run a callback with the tenant claim set for the duration of a transaction.
 *
 * Every policy reads `xangarro.current_business_id()`, so a query outside this
 * wrapper sees **nothing** — which is the intended failure mode: an empty list
 * is recoverable, another tenant's data is not.
 */
export async function withBusiness<T>(
  db: Db,
  businessId: string,
  fn: (tx: Parameters<Parameters<Db['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      // `true` scopes the setting to this transaction, so a pooled connection
      // never leaks one tenant's claim into the next request.
      sqlSetConfig(businessId),
    );
    return fn(tx);
  });
}

import { sql } from 'drizzle-orm';

function sqlSetConfig(businessId: string) {
  return sql`SELECT set_config('xangarro.business_id', ${businessId}, true)`;
}
