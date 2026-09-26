import { sql } from 'drizzle-orm';

import type { Db, Tx } from './client';

/**
 * Prune the portal's dead sessions and stale throttle rows (DB2-CRON-01):
 * `xangarro.security_prune()` (data-pg 0006) deletes sessions a day past
 * expiry or revocation and throttle rows outside any window, and returns how
 * many of each went. The console holds EXECUTE only (admin 0021); the daily
 * digest cron runs it beside the other retention sweeps.
 */
export async function prunePortalSecurity(conn: Db | Tx): Promise<number> {
  const rows = await conn.execute<{ throttle_rows: number; session_rows: number }>(
    sql`SELECT throttle_rows, session_rows FROM xangarro.security_prune()`,
  );
  const r = rows[0];
  return Number(r?.throttle_rows ?? 0) + Number(r?.session_rows ?? 0);
}
