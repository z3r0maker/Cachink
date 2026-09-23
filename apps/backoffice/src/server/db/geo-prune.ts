import { sql } from 'drizzle-orm';

import type { Db, Tx } from './client';

/**
 * Drop geographic counters older than `keepDays` (N-61).
 *
 * Runs on the existing daily cron beside `pruneStaffSessions`. The table is
 * bounded by construction, so this is hygiene rather than rescue — but data
 * nobody is using should not be kept forever, and an aggregate is no
 * exception.
 *
 * No role holds DELETE on the table, so the work happens inside
 * `xangarro.geo_prune` (drizzle/0033), which clamps the retention floor.
 */
export const GEO_KEEP_DAYS = 400;

export async function pruneGeoCounters(db: Db | Tx, keepDays = GEO_KEEP_DAYS): Promise<number> {
  const rows = await db.execute<{ geo_prune: number }>(
    sql`SELECT xangarro.geo_prune(${keepDays}) AS geo_prune`,
  );
  return Number(rows[0]?.geo_prune ?? 0);
}
