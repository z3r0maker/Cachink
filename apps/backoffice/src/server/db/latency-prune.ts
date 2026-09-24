import { sql } from 'drizzle-orm';

import type { Db, Tx } from './client';

/**
 * Drop latency counters older than `keepDays` (N-07).
 *
 * Runs on the same daily cron as `pruneGeoCounters`, for the same reason and
 * with the same shape: the table is bounded by construction — about 22k rows
 * a year — so this is hygiene rather than rescue, but data nobody is using
 * should not be kept forever.
 *
 * No role holds DELETE on the table, so the work happens inside
 * `xangarro.api_latency_prune` (data-pg 0042), which clamps the floor.
 */
export const LATENCY_KEEP_DAYS = 400;

export async function pruneApiLatency(db: Db | Tx, keepDays = LATENCY_KEEP_DAYS): Promise<number> {
  const rows = await db.execute<{ api_latency_prune: number }>(
    sql`SELECT xangarro.api_latency_prune(${keepDays}) AS api_latency_prune`,
  );
  return Number(rows[0]?.api_latency_prune ?? 0);
}
