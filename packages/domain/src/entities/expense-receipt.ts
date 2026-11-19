/**
 * ExpenseReceipt (Comprobante del gasto) — the photo of a gasto's ticket
 * (ADR-149).
 *
 * Like the product photo (ADR-134) it is a **row, not a file**: a grayscale
 * WebP, longest side at most {@link EXPENSE_RECEIPT_SIDE} px, carried as
 * base64. Unlike it, a receipt is pushed by the phone and never pulled, has
 * no tombstone and is never replaced once its gasto is saved; when two rows
 * name the same gasto the newest wins ({@link latestExpenseReceipts}).
 *
 * Its bytes are bounded here and again by the wire's row limit for
 * `expense_receipts`.
 */

import { z } from 'zod';
import type { ExpenseId, ExpenseReceiptId, BusinessId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
import { base64ByteLength } from './product-image.js';

/** The only format a receipt travels in. */
export const EXPENSE_RECEIPT_MIME = 'image/webp' as const;

/** The longest side, in pixels: a thermal ticket's total stays legible. */
export const EXPENSE_RECEIPT_SIDE = 1024 as const;

/** Decoded bytes a receipt may weigh (96 KB); the encoder steps quality down until it fits. */
export const MAX_EXPENSE_RECEIPT_BYTES = 98_304 as const;

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

const receiptBytesField = z
  .string()
  .regex(BASE64, 'bytes must be base64')
  .refine((v) => v.length % 4 === 0, { message: 'bytes must be whole base64 quads' })
  .refine((v) => base64ByteLength(v) <= MAX_EXPENSE_RECEIPT_BYTES, {
    message: `bytes must decode to at most ${MAX_EXPENSE_RECEIPT_BYTES} bytes`,
  });

const sideField = z.number().int().min(1).max(EXPENSE_RECEIPT_SIDE);

export const ExpenseReceiptSchema = z
  .object({
    id: ulidField<ExpenseReceiptId>(),
    gastoId: ulidField<ExpenseId>(),
    mime: z.literal(EXPENSE_RECEIPT_MIME),
    /** Base64 grayscale WebP. */
    bytes: receiptBytesField,
    width: sideField,
    height: sideField,
  })
  .merge(auditSchema);

export type ExpenseReceipt = z.infer<typeof ExpenseReceiptSchema>;

export const NewExpenseReceiptSchema = z.object({
  gastoId: ulidField<ExpenseId>(),
  bytes: receiptBytesField,
  width: sideField,
  height: sideField,
  businessId: ulidField<BusinessId>(),
});

export type NewExpenseReceipt = z.infer<typeof NewExpenseReceiptSchema>;

/** `a` is newer than `b`: later `createdAt`, and the greater ULID on a tie. */
function newer(a: ExpenseReceipt, b: ExpenseReceipt): boolean {
  if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt;
  return a.id > b.id;
}

/** The receipt each gasto shows: its newest row, deleted rows left out. */
export function latestExpenseReceipts(
  rows: readonly ExpenseReceipt[],
): ReadonlyMap<ExpenseId, ExpenseReceipt> {
  const out = new Map<ExpenseId, ExpenseReceipt>();
  for (const row of rows) {
    if (row.deletedAt !== null) continue;
    const current = out.get(row.gastoId);
    if (current === undefined || newer(row, current)) out.set(row.gastoId, row);
  }
  return out;
}
