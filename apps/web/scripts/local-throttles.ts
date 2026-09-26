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

/**
 * The e2e suite's fixed wrong addresses (`auth.spec.ts`, `chaos-2`). Each run
 * tries each one once per viewport project — three failures — and the
 * per-address limit is five in fifteen minutes, so the second run inside that
 * window locked them and the third project's copy answered «Demasiados
 * intentos» instead of the message under test. Same reset as the bad code.
 */
const SUITE_BAD_EMAILS = ['nobody@example.com', '<script>alert(1)</script>@x.com'] as const;

export async function clearLocalThrottles(sql: postgres.Sql): Promise<void> {
  for (const ip of LOOPBACK) {
    for (const door of ['login', 'activate', 'signup']) {
      await sql`SELECT xangarro.throttle_clear(${throttleKey(door, 'ip', ip)})`;
    }
  }
  for (const code of SUITE_BAD_CODES) {
    await sql`SELECT xangarro.throttle_clear(${throttleKey('activate', 'code', code)})`;
  }
  for (const email of SUITE_BAD_EMAILS) {
    await sql`SELECT xangarro.throttle_clear(${throttleKey('login', 'email', email)})`;
  }
}
