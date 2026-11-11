import type { SecondFactorRepo } from './second-factor.js';
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

/** One account's second-factor row, as the stores keep it. */
export interface MemoryFactorRow {
  secretEnc: string | null;
  enrolledAt: string | null;
  lastStep: number | null;
  recoveryCodes: string[];
}

/**
 * A `SecondFactorRepo` with the conditional-write semantics of the Postgres
 * adapters: a pending seed is compare-and-swapped, enrolment happens once, a
 * TOTP step only moves forward and a recovery code is removed once. An id with
 * no row is an account that does not exist.
 */
export function memorySecondFactorRepo<Id extends string = string>(
  rows: Map<string, MemoryFactorRow>,
): SecondFactorRepo<Id> {
  return {
    totpState: async (id) => {
      const r = rows.get(id);
      return r ? { secretEnc: r.secretEnc, enrolledAt: r.enrolledAt, lastStep: r.lastStep } : null;
    },
    savePendingSecret: async (id, previous, sealed) => {
      const r = rows.get(id);
      if (!r || r.enrolledAt !== null || r.secretEnc !== previous) return false;
      r.secretEnc = sealed;
      return true;
    },
    completeEnrolment: async (id, step, hashes) => {
      const r = rows.get(id);
      if (!r || r.enrolledAt !== null || r.secretEnc === null) return false;
      r.enrolledAt = new Date().toISOString();
      r.lastStep = step;
      r.recoveryCodes = [...hashes];
      return true;
    },
    advanceStep: async (id, step) => {
      const r = rows.get(id);
      if (!r || r.enrolledAt === null || (r.lastStep !== null && r.lastStep >= step)) return false;
      r.lastStep = step;
      return true;
    },
    consumeRecoveryCode: async (id, hash) => {
      const r = rows.get(id);
      if (!r || r.enrolledAt === null || !r.recoveryCodes.includes(hash)) return null;
      r.recoveryCodes = r.recoveryCodes.filter((h) => h !== hash);
      return r.recoveryCodes.length;
    },
  };
}
