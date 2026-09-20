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

/**
 * The conformance suite's hard-coded bad code (`activate.test.ts` guesses
 * `ZZZZZZZZ` once per run). Five runs inside fifteen minutes lock that code
 * for fifteen more — and the lock outlives any single run, so rerunning the
 * suite twice in a row fails on the second. Same fixture-reset spirit as the
 * loopback IPs above.
 */
const SUITE_BAD_CODES = ['ZZZZZZZZ'] as const;

export async function clearLocalThrottles(sql: postgres.Sql): Promise<void> {
  for (const ip of LOOPBACK) {
    for (const door of ['login', 'activate', 'signup']) {
      await sql`SELECT xangarro.throttle_clear(${throttleKey(door, 'ip', ip)})`;
    }
  }
  for (const code of SUITE_BAD_CODES) {
    await sql`SELECT xangarro.throttle_clear(${throttleKey('activate', 'code', code)})`;
  }
}
