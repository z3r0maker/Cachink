/**
 * Drizzle ↔ PowerSync bridge (ADR-035).
 *
 * PowerSync exposes its local SQLite through a tagged-template `execute()`
 * interface. Drizzle's `sqlite-proxy` driver accepts a callback that takes
 * `(sql, params, method)` and returns rows — we adapt PowerSync's API onto
 * that shape so the existing `CachinkDatabase` alias + every repository
 * in `@cachink/data` keep working without modification.
 *
 * The PowerSync type is imported from `@powersync/common` via a narrow
 * local interface so this package can typecheck without the heavy native
 * module installed.
 */

import { drizzle } from 'drizzle-orm/sqlite-proxy';
import type { CachinkDatabase } from '@cachink/data';

/**
 * The subset of the PowerSync client API we actually depend on. Both
 * `@powersync/react-native` and `@powersync/web` expose these methods.
 */
export interface PowerSyncLike {
  execute(sql: string, params?: readonly unknown[]): Promise<{ rows: { _array: unknown[] } }>;
  getAll<T>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  watch?: (...args: unknown[]) => unknown;
}

/**
 * Wrap a PowerSync client in a Drizzle handle that matches the
 * driver-agnostic `CachinkDatabase` alias. Repositories call `.insert()`,
 * `.select()`, `.run()` etc. against the returned value and PowerSync
 * forwards the statements to its embedded SQLite.
 */
export function createDrizzleAdapter(ps: PowerSyncLike): CachinkDatabase {
  const db = drizzle(async (sqlText, params, method) => {
    const args = (params ?? []) as readonly unknown[];
    if (method === 'run') {
      await ps.execute(sqlText, args);
      return { rows: [] };
    }
    const rows = (await ps.getAll<unknown>(sqlText, args)) ?? [];
    if (method === 'get') return { rows: (rows[0] ? [rows[0]] : []) as unknown[] };
    return { rows };
  });
  return db as unknown as CachinkDatabase;
}
