/**
 * __stock_baseline — net stock of purged movements per product (migration
 * 0003, A-11). `sumStock` = baseline + remaining movements. Never synced.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const stockBaseline = sqliteTable('__stock_baseline', {
  productoId: text('producto_id').primaryKey(),
  cantidad: integer('cantidad').notNull().default(0),
});
