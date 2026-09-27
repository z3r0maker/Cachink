import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { Db } from '../src/client';
import { ServiceBusyError, transactionWithDeadline } from '../src/deadline';

/**
 * The pool's load shedding (DB3-SYNC-05), against a stand-in pool whose
 * connection arrives when the test says so. What matters beyond «it rejects
 * in time» is what the late transaction does afterwards: it must never commit
 * work the caller was already told failed.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A pool that hands out its connection after `connectMs`; records what committed. */
function pool(connectMs: number) {
  const committed: unknown[] = [];
  const db = {
    async transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
      await sleep(connectMs);
      const out = await fn({ tx: true });
      committed.push(out);
      return out;
    },
  } as unknown as Db;
  return { db, committed };
}

const soon = (acquireMs: number, totalMs: number) => ({ acquireMs, until: Date.now() + totalMs });

describe('transactionWithDeadline', () => {
  it('returns the work when the pool answers in time', async () => {
    const { db, committed } = pool(1);
    const out = await transactionWithDeadline(db, soon(200, 1_000), async () => 'ok');
    assert.equal(out, 'ok');
    assert.deepEqual(committed, ['ok']);
  });

  it('sheds a request that cannot get a connection, and the late connection does nothing', async () => {
    const { db, committed } = pool(120);
    let ran = false;
    const started = Date.now();
    await assert.rejects(
      transactionWithDeadline(db, soon(30, 1_000), async () => {
        ran = true;
      }),
      (e: unknown) => e instanceof ServiceBusyError && e.phase === 'acquire',
    );
    assert.ok(Date.now() - started < 100, 'answered at the acquire deadline, not the connection');
    await sleep(150);
    assert.equal(ran, false, 'the work never ran on the late connection');
    assert.deepEqual(committed, []);
  });

  it('rolls back work that outlives the deadline instead of committing it', async () => {
    const { db, committed } = pool(1);
    await assert.rejects(
      transactionWithDeadline(db, soon(50, 60), async () => {
        await sleep(120);
        return 'late';
      }),
      (e: unknown) => e instanceof ServiceBusyError && e.phase === 'transaction',
    );
    await sleep(100);
    assert.deepEqual(committed, [], 'a 503 means nothing was written');
  });

  it('refuses outright when the deadline has already passed', async () => {
    const { db, committed } = pool(1);
    await assert.rejects(
      transactionWithDeadline(db, { acquireMs: 10, until: Date.now() - 1 }, async () => 'x'),
      ServiceBusyError,
    );
    assert.deepEqual(committed, []);
  });

  it("passes the work's own error through untouched", async () => {
    const { db } = pool(1);
    const boom = new Error('constraint');
    await assert.rejects(
      transactionWithDeadline(db, soon(100, 1_000), async () => {
        throw boom;
      }),
      (e: unknown) => e === boom,
    );
  });

  it('carries a code the route layer maps without string matching', () => {
    const e = new ServiceBusyError('acquire', 3_000);
    assert.equal(e.code, 'SERVICE_BUSY');
    assert.match(e.message, /3000 ms/);
  });
});
