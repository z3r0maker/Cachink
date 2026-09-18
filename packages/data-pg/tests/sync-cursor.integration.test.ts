import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { allocateSeq, committedCursor, logChange } from '../src/sync/cursor';
import { integrationSuite } from './support/db';

/**
 * DB-SYNC-01: a device must never be handed a cursor above a row that has not
 * committed yet, or it skips that row forever.
 *
 * With an identity column the bug was: writer A takes seq 5, writer B takes 6,
 * B commits, a pull serves max(seq) = 6, A commits 5 — below the cursor. Here
 * both halves of the fix are shown on real transactions: a second writer for
 * the same tenant cannot take a seq while the first is open, and a reader never
 * sees the open one's seq as the cursor.
 */
const { url, describe } = integrationSuite();
// A tenant of its own, so the seeded businesses' cursors are left alone.
const BIZ = `01TESTCURS${Date.now().toString(32).toUpperCase().padStart(16, '2')}`.slice(0, 26);

describe('sync cursor', () => {
  let a: Db;
  let b: Db;

  beforeAll(() => {
    a = createDb(url as string);
    b = createDb(url as string);
  });

  afterAll(async () => {
    await a?.$client.end({ timeout: 5 });
    await b?.$client.end({ timeout: 5 });
  });

  it('serves only committed seqs, and makes a second writer wait for the first', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let taken!: (seq: number) => void;
    const seqA = new Promise<number>((r) => (taken = r));

    const writerA = withBusiness(a, BIZ, async (tx) => {
      taken(await logChange(tx, BIZ, 'products', 'row-a', 'update'));
      await gate;
    });
    const held = await seqA;

    const served = await withBusiness(b, BIZ, (tx) => committedCursor(tx));
    assert.ok(served < held, `served ${served} while seq ${held} was still open`);

    await assert.rejects(
      withBusiness(b, BIZ, async (tx) => {
        await tx.execute(sql`SET LOCAL lock_timeout = '300ms'`);
        return allocateSeq(tx, BIZ);
      }),
      (e: unknown) => (e as { cause?: { code?: string } }).cause?.code === '55P03',
      'a second writer must not take a seq while the first is open',
    );

    release();
    await writerA;
    assert.equal(await withBusiness(b, BIZ, (tx) => committedCursor(tx)), held);
  });

  it('hands out consecutive seqs per tenant', async () => {
    const [x, y] = await withBusiness(a, BIZ, async (tx) => [
      await allocateSeq(tx, BIZ),
      await allocateSeq(tx, BIZ),
    ]);
    assert.equal(y, (x as number) + 1);
  });
});
