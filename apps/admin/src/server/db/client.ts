import { createDb, type Db } from '@xangarro/data-pg';

/**
 * The admin console's database handle.
 *
 * `DATABASE_URL` here is the admin Vercel project's own, connecting as the
 * `xangarro_admin` role (see `migrations/0001_staff.sql`) — never the portal's
 * `xangarro_app`, which cannot read the staff tables at all.
 *
 * No `server-only` import: `src/proxy.ts` needs the allowlist lookup and is
 * not compiled under the react-server condition. Nothing under `src/app`
 * imports this from a client component, and the proxy is server-side by
 * construction.
 */
let cached: Db | undefined;

export function db(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set for the admin console.');
  }
  cached ??= createDb(url);
  return cached;
}

export type { Db };
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
