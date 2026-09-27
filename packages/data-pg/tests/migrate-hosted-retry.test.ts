import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  backoffMs,
  DEFAULT_RETRY,
  isLockTimeout,
  withLockRetry,
  type RetryPolicy,
} from '../scripts/hosted/retry';

/**
 * DB3-MIG-01: a statement that needs an ACCESS EXCLUSIVE lock waits only a
 * moment (`lock_timeout` ≈ 200 ms) so live traffic never queues behind it for
 * long, and the runner tries it again with backoff instead of failing the
 * deploy. Pure half; the real held lock is in
 * `migrate-hosted-retry.integration.test.ts`.
 */
const lockBusy = () =>
  Object.assign(new Error('canceling statement due to lock timeout'), { code: '55P03' });

function policy(over: Partial<RetryPolicy> = {}): RetryPolicy & { slept: number[] } {
  const slept: number[] = [];
  return {
    ...DEFAULT_RETRY,
    random: () => 0.5,
    sleep: async (ms: number) => {
      slept.push(ms);
    },
    ...over,
    slept,
  };
}

describe('isLockTimeout', () => {
  it('is true only for SQLSTATE 55P03', () => {
    assert.equal(isLockTimeout(lockBusy()), true);
    assert.equal(isLockTimeout(Object.assign(new Error('x'), { code: '57014' })), false);
    assert.equal(isLockTimeout(new Error('55P03 in a message is not a code')), false);
    assert.equal(isLockTimeout('55P03'), false);
    assert.equal(isLockTimeout(null), false);
  });
});

describe('backoffMs', () => {
  it('doubles from the base up to the cap, jittered within [half, full]', () => {
    const p = { ...DEFAULT_RETRY };
    assert.equal(
      backoffMs(1, p, () => 1),
      250,
    );
    assert.equal(
      backoffMs(1, p, () => 0),
      125,
    );
    assert.equal(
      backoffMs(2, p, () => 1),
      500,
    );
    assert.equal(
      backoffMs(5, p, () => 1),
      4000,
    );
    assert.equal(
      backoffMs(6, p, () => 1),
      5000,
      'capped',
    );
    assert.equal(
      backoffMs(30, p, () => 1),
      5000,
      'no overflow far out',
    );
    for (let n = 1; n <= 20; n++) {
      const d = backoffMs(n, p, Math.random);
      assert.ok(d >= 125 && d <= 5000, `attempt ${n}: ${d} ms`);
    }
  });
});

describe('withLockRetry', () => {
  it('returns the first success without sleeping', async () => {
    const p = policy();
    assert.equal(await withLockRetry(async () => 'ok', p), 'ok');
    assert.deepEqual(p.slept, []);
  });

  it('retries a lock timeout until it succeeds, reporting each wait', async () => {
    let calls = 0;
    const seen: number[] = [];
    const p = policy({ onRetry: (attempt) => seen.push(attempt) });
    const out = await withLockRetry(async () => {
      calls += 1;
      if (calls < 4) throw lockBusy();
      return calls;
    }, p);
    assert.equal(out, 4);
    assert.deepEqual(seen, [1, 2, 3]);
    assert.deepEqual(p.slept, [188, 375, 750], 'base 250 doubling, jitter at the midpoint');
  });

  it('gives up after the last attempt and throws the lock error', async () => {
    let calls = 0;
    const p = policy({ attempts: 3 });
    await assert.rejects(
      () =>
        withLockRetry(async () => {
          calls += 1;
          throw lockBusy();
        }, p),
      (e: unknown) => isLockTimeout(e),
    );
    assert.equal(calls, 3);
    assert.equal(p.slept.length, 2, 'no sleep after the last attempt');
  });

  it('never retries any other error', async () => {
    let calls = 0;
    const p = policy();
    await assert.rejects(
      () =>
        withLockRetry(async () => {
          calls += 1;
          throw Object.assign(new Error('division by zero'), { code: '22012' });
        }, p),
      /division by zero/,
    );
    assert.equal(calls, 1);
    assert.deepEqual(p.slept, []);
  });

  it('runs the reset hook before each retry, not before the first attempt', async () => {
    let calls = 0;
    let resets = 0;
    await withLockRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw lockBusy();
      },
      policy(),
      async () => void (resets += 1),
    );
    assert.equal(resets, 2);
  });
});
