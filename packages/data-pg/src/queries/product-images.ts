import { sql, type SQL } from 'drizzle-orm';

import type { Db } from '../client.js';
import { productImages } from '../schema/catalog.js';
import type { Tx } from '../sync/cursor.js';

/**
 * Product photos (ADR-134, C-24): append-only rows, the newest per product
 * wins, a row with `bytes` NULL is a tombstone. Every statement runs inside
 * the caller's tenant transaction, so RLS scopes it; nothing filters by
 * business here.
 */

/**
 * The ids of the rows a device should see: the newest live row of each
 * product, and only when it is a photo. A subquery, so the snapshot reader
 * and the page estimate add it to their own `WHERE` (`id IN …`).
 */
export function newestPhotoIds(): SQL {
  return sql`(SELECT n.id FROM (
      SELECT DISTINCT ON (producto_id) id, bytes
        FROM product_images
       WHERE deleted_at IS NULL
       ORDER BY producto_id, created_at DESC, id DESC) n
     WHERE n.bytes IS NOT NULL)`;
}

/** Every product's current photo, for the legacy one-body bootstrap. */
export async function newestProductImages(tx: Tx) {
  return tx
    .select()
    .from(productImages)
    .where(sql`${productImages.id} IN ${newestPhotoIds()}`);
}

/**
 * One product's current photo: the newest live row, `null` when there is
 * none or the newest is a tombstone. What the portal serves (B-19).
 */
export async function latestProductImage(tx: Tx, productoId: string) {
  const [row] = await tx
    .select()
    .from(productImages)
    .where(sql`${productImages.productoId} = ${productoId} AND ${productImages.deletedAt} IS NULL`)
    .orderBy(sql`${productImages.createdAt} DESC, ${productImages.id} DESC`)
    .limit(1);
  if (row === undefined || row.bytes === null) return null;
  return row;
}

/** How long a superseded row is kept before the purge takes it (ADR-134). */
export const PRODUCT_IMAGE_RETENTION_DAYS = 30;

/**
 * Delete, across every business, each row a newer row of the same product
 * superseded at least `olderThanDays` ago, and return how many went (B-19).
 * The newest row of a product never goes. Runs through
 * `xangarro.product_images_purge` (0052) because the app role may not DELETE
 * here, so it takes the pool, not a tenant transaction.
 */
export async function purgeSupersededImages(
  db: Db,
  olderThanDays: number = PRODUCT_IMAGE_RETENTION_DAYS,
): Promise<number> {
  if (!Number.isSafeInteger(olderThanDays) || olderThanDays < 1) {
    throw new RangeError(`purgeSupersededImages: olderThanDays=${olderThanDays}`);
  }
  const [row] = await db.execute<{ n: number | string }>(
    sql`SELECT xangarro.product_images_purge(${olderThanDays}::int) AS n`,
  );
  const purged = Number(row?.n);
  if (!Number.isSafeInteger(purged) || purged < 0) {
    throw new Error(`product_images_purge returned ${String(row?.n)}`);
  }
  return purged;
}
