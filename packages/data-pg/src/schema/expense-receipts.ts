/**
 * Cloud schema — a gasto's receipt photo (ADR-149, M-18).
 *
 * UP on the wire (contract §8): the phone pushes it, nothing pulls it. Every
 * row is a photo — no tombstone — and the newest row per gasto is the
 * receipt. Column names mirror the device's SQLite table (`tests/drift.test.ts`).
 */

import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';

import { auditColumns, base64Bytea } from './_columns';

export const expenseReceipts = pgTable(
  'expense_receipts',
  {
    id: text('id').primaryKey(),
    /** The expense (`expenses.id`) the photo is the ticket of. */
    gastoId: text('gasto_id').notNull(),
    mime: text('mime').notNull().default('image/webp'),
    /** Grayscale WebP, ≤ 96 KB decoded; base64 in the row object. */
    bytes: base64Bytea('bytes').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    ...auditColumns,
  },
  (t) => [
    index('expense_receipts_business_gasto_idx').on(
      t.businessId,
      t.gastoId,
      t.createdAt.desc(),
      t.id.desc(),
    ),
  ],
);
