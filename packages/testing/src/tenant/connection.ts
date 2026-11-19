import postgres from 'postgres';

import { appDatabaseUrl, superDatabaseUrl } from './urls.js';

/** A connection that is closed when `fn` settles, whatever it did. */
async function withConnection<T>(url: string, fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/**
 * Runs `fn` as the app role with the tenant set, so RLS binds every statement
 * to `biz` exactly as `withTenant` does in the portal.
 */
export async function asTenant<T>(biz: string, fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  return withConnection(appDatabaseUrl(), async (sql) => {
    await sql`SELECT set_config('xangarro.business_id', ${biz}, false)`;
    return fn(sql);
  });
}

/**
 * The owner connection, for fixture cleanup only: since data-pg 0036 the app
 * role cannot hard-delete (DB-RLS-01), and a fixture that needs rows gone runs
 * that one statement here, never through `asTenant`.
 *
 * `superDatabaseUrl` rather than a fallback to `DATABASE_URL`: falling back to
 * the app role turned a cleanup into «permission denied for table sales» on a
 * machine without the variable set, which is a confusing way to learn the role
 * cannot DELETE.
 */
export async function asOwner<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  return withConnection(superDatabaseUrl(), fn);
}
