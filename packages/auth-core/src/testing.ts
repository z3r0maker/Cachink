import type { FailurePolicy, ThrottleStore } from './throttle.js';

/**
 * Test doubles for the ports, published at `@xangarro/auth-core/testing` so
 * every app's tests share one implementation instead of each writing its own.
 * Never imported by production code.
 */

export interface FakeClock {
  /** Seconds since an arbitrary epoch; advance it to pass time. */
  t: number;
}

/**
 * A `ThrottleStore` with the same semantics as `xangarro.throttle_*`
 * (0005_throttle_and_sessions.sql): failures counted in a fixed window, the
 * `max`-th one locks the key for `lockout` seconds and resets the count.
 */
export function memoryThrottleStore(clock: FakeClock = { t: 0 }): ThrottleStore & {
  readonly clock: FakeClock;
} {
  const rows = new Map<string, { start: number; hits: number; locked: number }>();
  return {
    clock,
    wait: async (key) => Math.max(0, (rows.get(key)?.locked ?? 0) - clock.t),
    fail: async (key, p: FailurePolicy) => {
      const r = rows.get(key);
      const fresh = !r || r.start < clock.t - p.window;
      const row = fresh ? { start: clock.t, hits: 1, locked: 0 } : { ...r, hits: r.hits + 1 };
      if (row.hits >= p.max) {
        rows.set(key, { start: clock.t, hits: 0, locked: clock.t + p.lockout });
        return p.lockout;
      }
      rows.set(key, row);
      return 0;
    },
    clear: async (key) => void rows.delete(key),
  };
}
