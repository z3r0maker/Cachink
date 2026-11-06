import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { listProductPhotos } from '../src/queries/product-images';
import { productImages } from '../src/schema/catalog';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * `listProductPhotos` (P-42): what the portal's catalogue needs to draw a
 * product's photo. Builds what the seed does not: two photos of one product,
 * a product whose newest row is a tombstone, a photo from a device row that
 * no longer exists, and a photo in another tenant.
 */
const { url, describe } = integrationSuite();

const BIZ = testId('F');
const OTHER = testId('G');
const CAJA = testId('D');
const GONE = testId('D');
const BYTES = Buffer.from('RIFF....WEBPVP8 ', 'latin1').toString('base64');

function row(
  businessId: string,
  productoId: string,
  deviceId: string,
  at: string,
  bytes: string | null,
) {
  const sized = bytes === null ? null : 512;
  return {
    id: testId('I'),
    productoId,
    mime: 'image/webp',
    bytes,
    width: sized,
    height: sized,
    businessId,
    deviceId,
    createdByUserId: null,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
}

describe('listProductPhotos', () => {
  let db: Db;
  const PRD_TWO = testId('P');
  const PRD_TOMB = testId('P');
  const PRD_ORPHAN = testId('P');
  const older = row(BIZ, PRD_TWO, CAJA, '2026-11-03T10:00:00.000Z', BYTES);
  const newer = row(BIZ, PRD_TWO, CAJA, '2026-11-04T09:30:00.000Z', BYTES);
  const orphan = row(BIZ, PRD_ORPHAN, GONE, '2026-11-02T12:00:00.000Z', BYTES);

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      const now = '2026-11-01T00:00:00.000Z';
      await tx.execute(sql`
        INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
        VALUES (${CAJA}, 'Caja 1', 'ios', 'iPhone 12', ${BIZ}, ${now}, ${now})`);
      await tx
        .insert(productImages)
        .values([
          older,
          newer,
          orphan,
          row(BIZ, PRD_TOMB, CAJA, '2026-11-03T10:00:00.000Z', BYTES),
          row(BIZ, PRD_TOMB, CAJA, '2026-11-03T11:00:00.000Z', null),
        ]);
    });
    await withBusiness(db, OTHER, (tx) =>
      tx
        .insert(productImages)
        .values([row(OTHER, PRD_TWO, CAJA, '2026-11-05T00:00:00.000Z', BYTES)]),
    );
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('lists the newest photo per product with when and on which register it was taken', async () => {
    const rows = await withBusiness(db, BIZ, (tx) => listProductPhotos(tx));
    const byProduct = new Map(rows.map((r) => [r.productoId, r]));
    assert.deepEqual(byProduct.get(PRD_TWO), {
      productoId: PRD_TWO,
      id: newer.id,
      tomadaEl: '2026-11-04T09:30:00.000Z',
      caja: 'Caja 1',
    });
  });

  it('leaves out a product whose newest row is a tombstone', async () => {
    const rows = await withBusiness(db, BIZ, (tx) => listProductPhotos(tx));
    assert.equal(
      rows.some((r) => r.productoId === PRD_TOMB),
      false,
    );
  });

  it('still lists a photo whose device row is gone, with no register name', async () => {
    const rows = await withBusiness(db, BIZ, (tx) => listProductPhotos(tx));
    const mine = rows.find((r) => r.productoId === PRD_ORPHAN);
    assert.equal(mine?.id, orphan.id);
    assert.equal(mine?.caja, null);
  });

  it('never lists another tenant’s photo', async () => {
    const rows = await withBusiness(db, BIZ, (tx) => listProductPhotos(tx));
    assert.deepEqual(rows.map((r) => r.productoId).sort(), [PRD_ORPHAN, PRD_TWO].sort());
  });
});
