/**
 * Retry a migration step that lost the race for a lock (DB3-MIG-01; ADR-115
 * amendment). Pure; unit-tested in `tests/migrate-hosted-retry.test.ts`.
 *
 * A statement that needs ACCESS EXCLUSIVE (`ALTER TABLE`, `ALTER POLICY`, …)
 * makes every later reader and writer of its table queue behind it while it
 * waits. So such statements wait only a moment — a short `lock_timeout`, about
 * 200 ms — and fail with SQLSTATE 55P03 when the table is busy. The runner
 * then sleeps and tries again: the statement, for a no-transaction file; the
 * whole file's transaction otherwise. Traffic stalls for at most one short
 * wait per attempt instead of for as long as the longest open transaction.
 */

/** `lock_not_available`: raised when `lock_timeout` expires. */
export const LOCK_NOT_AVAILABLE = '55P03';

export interface RetryPolicy {
  /** Tries in all, the first one included. */
  readonly attempts: number;
  /** The first wait, before jitter (ms). Doubles each attempt. */
  readonly baseMs: number;
  /** No wait is longer than this (ms). */
  readonly maxMs: number;
  /** Called before each wait; the runner logs it. */
  readonly onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly random?: () => number;
}

/** 20 tries, 250 ms doubling to 5 s: about a minute of patience in all. */
export const DEFAULT_RETRY: RetryPolicy = { attempts: 20, baseMs: 250, maxMs: 5000 };

export function isLockTimeout(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === LOCK_NOT_AVAILABLE
  );
}

/**
 * The wait after failed attempt `attempt` (1-based): `base · 2^(attempt-1)`,
 * capped, then "equal jitter" — somewhere in its upper half — so two runners
 * (or a runner and autovacuum) that collided once do not collide again in step.
 */
export function backoffMs(
  attempt: number,
  policy: Pick<RetryPolicy, 'baseMs' | 'maxMs'>,
  random: () => number = Math.random,
): number {
  const ceiling = Math.min(policy.maxMs, policy.baseMs * 2 ** Math.min(attempt - 1, 30));
  return Math.round(ceiling / 2 + (random() * ceiling) / 2);
}

const realSleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

/**
 * `step()`, again after a backoff each time it fails on a lock timeout, up to
 * `policy.attempts` tries. Any other error, or the last lock timeout, is
 * thrown as is. `beforeRetry` runs before each repeat — e.g. to drop the
 * INVALID index a failed concurrent build left behind.
 */
export async function withLockRetry<T>(
  step: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY,
  beforeRetry?: () => Promise<void>,
): Promise<T> {
  const sleep = policy.sleep ?? realSleep;
  for (let attempt = 1; ; attempt++) {
    try {
      return await step();
    } catch (error) {
      if (!isLockTimeout(error) || attempt >= policy.attempts) throw error;
      const delay = backoffMs(attempt, policy, policy.random);
      policy.onRetry?.(attempt, delay, error);
      await sleep(delay);
      await beforeRetry?.();
    }
  }
}
