/**
 * ExpenseReceipts — the photo of a gasto's ticket (ADR-149). Insert only: a
 * receipt is a row, the newest per gasto wins, and there is no tombstone, so
 * the photo columns are NOT NULL. Pushed by the phone, never pulled.
 *
 * `bytes` is the base64 of a grayscale WebP (longest side 1024 px), kept as
 * TEXT so the row travels the wire unchanged and renders from a `data:` URI.
 */

import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const expenseReceipts = sqliteTable(
  'expense_receipts',
  {
    id: text('id').primaryKey(),
    gastoId: text('gasto_id').notNull(),
    mime: text('mime').notNull().default('image/webp'),
    bytes: text('bytes').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    ...auditColumns,
  },
  (t) => [index('idx_expense_receipts_gasto').on(t.gastoId, t.createdAt)],
);
