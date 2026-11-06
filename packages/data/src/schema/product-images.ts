/**
 * ProductImages — the photo on a product's tile (ADR-134). Append-only: a
 * photo is a row, replacing it is a newer row, removing it is a tombstone
 * (`bytes` NULL). The newest row per product wins; nothing is updated.
 *
 * `bytes` is the base64 of a 512 px WebP, kept as TEXT so the row travels
 * the wire unchanged and renders from a `data:` URI without a file.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const productImages = sqliteTable('product_images', {
  id: text('id').primaryKey(),
  productoId: text('producto_id').notNull(),
  mime: text('mime').notNull().default('image/webp'),
  bytes: text('bytes'),
  width: integer('width'),
  height: integer('height'),
  ...auditColumns,
});
