import 'server-only';

import { API_LATENCY_ENDPOINTS, recordApiLatency } from '@xangarro/data-pg';

import { db } from '../db';
import { reportError } from './report';

/**
 * Count one phone call into the latency histogram (N-07's capacity card).
 *
 * **Never allowed to fail or delay its caller**, for `recordGeo`'s reason on a
 * hotter path: a statistic that cannot be written is worth a report and
 * nothing more, and refusing a shopkeeper's sync to record one would be
 * absurd. Errors are swallowed, and the caller does not await this — a slow
 * counter must not become the latency it is measuring.
 *
 * Endpoints outside `API_LATENCY_ENDPOINTS` are skipped here rather than sent
 * to a function that would raise: `deviceRoute` serves the four the histogram
 * knows, and a fifth arriving is a code change, not a runtime surprise.
 */
export function countApiLatency(endpoint: string, ms: number): void {
  if (!(API_LATENCY_ENDPOINTS as readonly string[]).includes(endpoint)) return;
  void recordApiLatency(db(), endpoint as (typeof API_LATENCY_ENDPOINTS)[number], ms).catch(
    (error: unknown) => reportError(error, { endpoint: `latency/${endpoint}` }),
  );
}
