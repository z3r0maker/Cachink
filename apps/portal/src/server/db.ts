import 'server-only';

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
