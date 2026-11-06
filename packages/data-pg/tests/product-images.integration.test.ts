import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { latestProductImage, newestProductImages } from '../src/queries/product-images';
import { productImages } from '../src/schema/catalog';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * 0050: `product_images` (ADR-134, C-24). Builds what the seed does not — two
 * photos and a tombstone for one product, a photo for another, a photo in a
 * second tenant — and proves the newest-wins read, the tombstone, the bytea
 * round trip through the base64 column type, the append-only grants and RLS.
 */
const { url, describe } = integrationSuite();

/** Drizzle wraps the Postgres error; the reason is on its `cause`. */
const refusedWith = (pattern: RegExp) => (e: unknown) => {
  const cause = (e as { cause?: { message?: string } }).cause;
  assert.match(String(cause?.message ?? (e as Error).message), pattern);
  return true;
};
const BIZ = testId('F');
const OTHER = testId('G');
const WEB = '01HZ8XQN9GZJXV8AKQ5X0WEB01';
const PRD_A = testId('P');
const PRD_B = testId('P');
const PNG_ISH = Buffer.from('RIFF....WEBPVP8 ', 'latin1').toString('base64');

function photo(id: string, productoId: string, at: string, bytes: string | null) {
  return {
    id,
    productoId,
    mime: 'image/webp',
    bytes,
    width: bytes === null ? null : 512,
    height: bytes === null ? null : 512,
    businessId: BIZ,
    deviceId: WEB,
    createdByUserId: null,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
}

describe('0050 product_images', () => {
  let db: Db;
  const older = testId('I');
  const newer = testId('I');
  const tomb = testId('I');
  const only = testId('I');

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      await tx
        .insert(productImages)
        .values([
          photo(older, PRD_A, '2026-11-03T10:00:00.000Z', PNG_ISH),
          photo(newer, PRD_A, '2026-11-03T11:00:00.000Z', PNG_ISH),
          photo(only, PRD_B, '2026-11-03T10:30:00.000Z', PNG_ISH),
        ]);
    });
    await withBusiness(db, OTHER, async (tx) => {
      await tx
        .insert(productImages)
        .values([
          { ...photo(testId('I'), PRD_B, '2026-11-03T12:00:00.000Z', PNG_ISH), businessId: OTHER },
        ]);
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('round-trips the bytes through bytea as base64, and the newest photo wins', async () => {
    const current = await withBusiness(db, BIZ, (tx) => latestProductImage(tx, PRD_A));
    assert.equal(current?.id, newer);
    assert.equal(current?.bytes, PNG_ISH);
    const raw = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ n: string }>(
        sql`SELECT octet_length(bytes)::text AS n FROM product_images WHERE id = ${newer}`,
      ),
    );
    assert.equal(raw[0]?.n, String(Buffer.from(PNG_ISH, 'base64').byteLength));
  });

  it('the bootstrap read sends one row per product and only this tenant’s', async () => {
    const rows = await withBusiness(db, BIZ, (tx) => newestProductImages(tx));
    assert.deepEqual(rows.map((r) => r.id).sort(), [newer, only].sort());
  });

  it('a tombstone hides the photo from both reads, and a newer photo brings it back', async () => {
    await withBusiness(db, BIZ, (tx) =>
      tx.insert(productImages).values([photo(tomb, PRD_A, '2026-11-03T12:00:00.000Z', null)]),
    );
    assert.equal(await withBusiness(db, BIZ, (tx) => latestProductImage(tx, PRD_A)), null);
    const rows = await withBusiness(db, BIZ, (tx) => newestProductImages(tx));
    assert.deepEqual(
      rows.map((r) => r.id),
      [only],
    );
    const again = testId('I');
    await withBusiness(db, BIZ, (tx) =>
      tx.insert(productImages).values([photo(again, PRD_A, '2026-11-03T13:00:00.000Z', PNG_ISH)]),
    );
    assert.equal((await withBusiness(db, BIZ, (tx) => latestProductImage(tx, PRD_A)))?.id, again);
  });

  it('is append-only for the app role: no UPDATE, no DELETE', async () => {
    await assert.rejects(
      withBusiness(db, BIZ, (tx) =>
        tx.execute(sql`UPDATE product_images SET width = 1 WHERE id = ${newer}`),
      ),
      refusedWith(/permission denied/),
    );
    await assert.rejects(
      withBusiness(db, BIZ, (tx) =>
        tx.execute(sql`DELETE FROM product_images WHERE id = ${newer}`),
      ),
      refusedWith(/permission denied/),
    );
  });

  it('refuses a sized tombstone, a PNG and a photo over 40 KB', async () => {
    const bad = (over: Partial<ReturnType<typeof photo>>) =>
      withBusiness(db, BIZ, (tx) =>
        tx
          .insert(productImages)
          .values([{ ...photo(testId('I'), PRD_B, '2026-11-03T14:00:00.000Z', PNG_ISH), ...over }]),
      );
    await assert.rejects(bad({ bytes: null }), refusedWith(/photo_or_tombstone/));
    await assert.rejects(bad({ mime: 'image/png' }), refusedWith(/mime/));
    await assert.rejects(
      bad({ bytes: Buffer.alloc(40_961, 1).toString('base64') }),
      refusedWith(/bytes/),
    );
  });
});
