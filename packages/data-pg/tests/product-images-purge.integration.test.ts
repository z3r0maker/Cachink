import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { purgeSupersededImages } from '../src/queries/product-images';
import { productImages } from '../src/schema/catalog';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * 0052: the purge of superseded product photos (ADR-134, B-19). A row goes
 * once a newer row of the same product has existed for the given days; the
 * newest row never goes, so a tombstone stays until a photo supersedes it.
 * The purge runs with no tenant, across every business, through a SECURITY
 * DEFINER: the app role itself may not DELETE from the table.
 */
const { url, describe } = integrationSuite();

const BIZ = testId('F');
const OTHER = testId('G');
const WEB = '01HZ8XQN9GZJXV8AKQ5X0WEB01';
const BYTES = Buffer.from('RIFF....WEBPVP8 ', 'latin1').toString('base64');
const DAY = 86_400_000;

/** `days` before now, so the 30-day window means the same on every run. */
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

function row(businessId: string, productoId: string, days: number, bytes: string | null) {
  const at = ago(days);
  const sized = bytes === null ? null : 512;
  return {
    id: testId('I'),
    productoId,
    mime: 'image/webp',
    bytes,
    width: sized,
    height: sized,
    businessId,
    deviceId: WEB,
    createdByUserId: null,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
}

describe('0052 product_images purge', () => {
  let db: Db;
  // Superseded 40 days ago: goes. The row that superseded it is the newest: stays.
  const PRD_OLD = testId('P');
  const oldA = row(BIZ, PRD_OLD, 90, BYTES);
  const oldB = row(BIZ, PRD_OLD, 40, BYTES);
  // Superseded only 10 days ago: stays.
  const PRD_RECENT = testId('P');
  const recentA = row(BIZ, PRD_RECENT, 90, BYTES);
  const recentB = row(BIZ, PRD_RECENT, 10, BYTES);
  // Removed 50 days ago: the photo under the tombstone goes, the tombstone stays.
  const PRD_TOMB = testId('P');
  const tombPhoto = row(BIZ, PRD_TOMB, 90, BYTES);
  const tomb = row(BIZ, PRD_TOMB, 50, null);
  // A tombstone a photo superseded 35 days ago: the tombstone goes too.
  const PRD_BACK = testId('P');
  const backTomb = row(BIZ, PRD_BACK, 60, null);
  const backPhoto = row(BIZ, PRD_BACK, 35, BYTES);
  // Another tenant, purged by the same call.
  const PRD_OTHER = testId('P');
  const otherA = row(OTHER, PRD_OTHER, 90, BYTES);
  const otherB = row(OTHER, PRD_OTHER, 45, BYTES);

  const ids = (businessId: string) =>
    withBusiness(db, businessId, async (tx) =>
      (await tx.select({ id: productImages.id }).from(productImages)).map((r) => r.id).sort(),
    );

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, (tx) =>
      tx
        .insert(productImages)
        .values([oldA, oldB, recentA, recentB, tombPhoto, tomb, backTomb, backPhoto]),
    );
    await withBusiness(db, OTHER, (tx) => tx.insert(productImages).values([otherA, otherB]));
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('deletes what a newer row superseded over 30 days ago, in every tenant, and counts it', async () => {
    const purged = await purgeSupersededImages(db);
    assert.ok(purged >= 4, `purged ${purged}, expected at least this suite's four rows`);
    const kept = [oldB, recentA, recentB, tomb, backPhoto].map((r) => r.id).sort();
    assert.deepEqual(await ids(BIZ), kept);
    assert.deepEqual(await ids(OTHER), [otherB.id]);
  });

  it('a second run finds nothing of this suite left to delete', async () => {
    await purgeSupersededImages(db);
    const before = await ids(BIZ);
    await purgeSupersededImages(db);
    assert.deepEqual(await ids(BIZ), before);
  });

  it('a shorter window reaches the recently superseded row, never the newest', async () => {
    await purgeSupersededImages(db, 5);
    assert.deepEqual(await ids(BIZ), [oldB, recentB, tomb, backPhoto].map((r) => r.id).sort());
  });

  it('refuses a window under one day', async () => {
    await assert.rejects(purgeSupersededImages(db, 0), RangeError);
    await assert.rejects(purgeSupersededImages(db, 1.5), RangeError);
    await assert.rejects(db.execute(sql`SELECT xangarro.product_images_purge(0)`), (e: unknown) => {
      const cause = (e as { cause?: { message?: string } }).cause;
      assert.match(String(cause?.message ?? (e as Error).message), /at least one day/);
      return true;
    });
  });
});
