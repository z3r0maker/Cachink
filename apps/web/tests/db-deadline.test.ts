import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { ServiceBusyError } from '@xangarro/data-pg';

import {
  ACQUIRE_MS,
  currentDeadline,
  deviceDeadlineMs,
  deviceDeadlines,
  withDbDeadlines,
} from '../src/server/db-deadline';
import { deviceFailure } from '../src/server/api/device-failure';

/**
 * The device routes' database deadlines (DB3-SYNC-05): where they come from,
 * when their clock starts, and the answer they turn into. The saturated-pool
 * run on real Postgres is `device-busy.integration.test.ts`.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('withDbDeadlines', () => {
  it('hands every transaction inside it a deadline, and none outside', async () => {
    assert.equal(currentDeadline(), undefined);
    const seen = await withDbDeadlines({ acquireMs: 3_000, totalMs: 10_000 }, async () => {
      await sleep(1);
      return currentDeadline(1_000);
    });
    assert.deepEqual(seen, { acquireMs: 3_000, until: 11_000 });
    assert.equal(currentDeadline(), undefined);
  });

  it('starts the clock when the transaction is asked for, not when the request began', async () => {
    // A slow upload before the transaction must not use up the database's time.
    const [early, late] = await withDbDeadlines({ acquireMs: 100, totalMs: 500 }, async () => {
      const a = currentDeadline();
      await sleep(60);
      return [a, currentDeadline()] as const;
    });
    assert.ok(early !== undefined && late !== undefined);
    assert.ok(late.until - early.until >= 50);
  });

  it('never waits longer for a connection than the transaction may take', () => {
    const seen = withDbDeadlines({ acquireMs: 3_000, totalMs: 500 }, async () => currentDeadline());
    return seen.then((d) => assert.equal(d?.acquireMs, 500));
  });

  it("passes the work's own result and errors through", async () => {
    assert.equal(await withDbDeadlines(deviceDeadlines(), async () => 7), 7);
    const boom = new Error('boom');
    await assert.rejects(
      withDbDeadlines(deviceDeadlines(), async () => {
        throw boom;
      }),
      (e: unknown) => e === boom,
    );
  });
});

describe('deviceDeadlines', () => {
  it('reads DEVICE_DB_DEADLINE_MS, and falls back to 10 s for anything unusable', () => {
    assert.equal(deviceDeadlineMs('4000'), 4_000);
    for (const bad of [undefined, '', ' ', '0', '-5', '2.5', 'diez']) {
      assert.equal(deviceDeadlineMs(bad), 10_000, String(bad));
    }
    assert.equal(deviceDeadlines().acquireMs, ACQUIRE_MS);
  });
});

describe('deviceFailure — a shed request', () => {
  it('is 503 with Retry-After, in the contract envelope, as a retryable code', async () => {
    const res = deviceFailure(new ServiceBusyError('acquire', 3_000));
    assert.ok(res !== null);
    assert.equal(res.status, 503);
    assert.equal(res.headers.get('Retry-After'), '15');
    const body = (await res.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, 'INTERNAL');
  });

  it('leaves an unknown error to be reported as INTERNAL', () => {
    assert.equal(deviceFailure(new Error('x')), null);
  });
});
