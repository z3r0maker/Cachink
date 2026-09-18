import { throttleKey } from '@xangarro/data-pg';
import type postgres from 'postgres';

/**
 * Local test runs all come from one machine, so they share the per-IP
 * throttles (B-17): three reruns inside fifteen minutes would lock the suite
 * out of its own portal. Before a run, clear what **loopback** has on record —
 * the same kind of fixture reset as reseeding. Tests that exercise a lockout
 * send their own `x-forwarded-for` and are untouched by this.
 */
const LOOPBACK = ['unknown', '127.0.0.1', '::1', '::ffff:127.0.0.1'] as const;

export async function clearLocalThrottles(sql: postgres.Sql): Promise<void> {
  for (const ip of LOOPBACK) {
    for (const door of ['login', 'activate', 'signup']) {
      await sql`SELECT xangarro.throttle_clear(${throttleKey(door, 'ip', ip)})`;
    }
  }
}
