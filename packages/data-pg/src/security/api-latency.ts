import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

/**
 * Per-endpoint latency, as a bounded histogram (N-07's capacity card).
 *
 * The table is an aggregate from birth — one row per day, endpoint and latency
 * bucket, holding a count — so there is no per-call row, no timestamp finer
 * than a day, and no business or device on it at all. This is telemetry about
 * our servers, not about a tenant. `xangarro.api_latency_record` is the only
 * way in; see `drizzle/0042_api_latency.sql` for why it is shaped this way.
 */
export const API_LATENCY_ENDPOINTS = [
  'sync/push',
  'sync/pull',
  'entitlement',
  'comprobante',
] as const;
export type ApiLatencyEndpoint = (typeof API_LATENCY_ENDPOINTS)[number];

/**
 * Count one call into its bucket. The bucket is chosen server-side, so no
 * caller can invent a bound, and an endpoint outside the list above raises —
 * the table is bounded only as long as that list is, and a typo must surface
 * rather than quietly open a fifth dimension.
 */
export async function recordApiLatency(
  db: Db,
  endpoint: ApiLatencyEndpoint,
  ms: number,
): Promise<void> {
  await db.execute(sql`SELECT xangarro.api_latency_record(${endpoint}, ${Math.round(ms)})`);
}
