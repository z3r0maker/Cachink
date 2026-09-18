import 'server-only';

import { sql } from 'drizzle-orm';
import { createDb, withBusiness, type Db } from '@xangarro/data-pg';

/**
 * The portal's database handle.
 *
 * `server-only` makes an accidental client import a **build error** rather than
 * a runtime leak of the connection string.
 *
 * Every read goes through `withTenant`, which opens a transaction and sets the
 * tenant claim for its duration. Outside that wrapper the RLS policies see no
 * claim and return nothing — which is the failure mode we want: an empty
 * screen is recoverable, another tenant's data is not.
 */
let cached: Db | undefined;

export function db(): Db {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error(
      'DATABASE_URL is not set. Start a local database with `pnpm --filter @xangarro/data-pg db:up` ' +
        'and seed it with `db:seed`.',
    );
  }
  cached ??= createDb(url);
  return cached;
}

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export function withTenant<T>(businessId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return withBusiness(db(), businessId, fn);
}

/**
 * A tenant transaction scoped by the **signed session**, not by an argument.
 *
 * `withTenant(businessId, …)` takes the tenant from its caller, which was right
 * while the session was a fixture and is a liability now: any code path that
 * computes a business id wrongly gets exactly the rows it asked for. This takes
 * it from the cookie the server signed.
 *
 * It sets `request.jwt.claims` rather than `xangarro.business_id`, so the
 * branch of `xangarro.current_business_id()` that binds in production is the
 * one `claims.integration.test.ts` proves — including that the claim wins over
 * the session GUC when they disagree.
 */
export async function withSession<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const { requireSession } = await import('./auth');
  const claims = await requireSession();
  return db().transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`);
    return fn(tx as Tx);
  });
}
