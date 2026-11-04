import { sql, type SQL } from 'drizzle-orm';

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
