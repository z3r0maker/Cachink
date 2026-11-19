/**
 * The receipt the phone hands over (M-18, ADR-149), and the one check both
 * places that save it make: under the weight limit, and a readable row. The
 * encoder already fits the photo; this checks again at the boundary because
 * the row is what the push carries.
 */

import {
  base64ByteLength,
  ExpenseReceiptTooLargeError,
  ExpenseReceiptUnreadableError,
  MAX_EXPENSE_RECEIPT_BYTES,
  NewExpenseReceiptSchema,
  type BusinessId,
  type NewExpenseReceipt,
} from '@xangarro/domain';

/** The encoded photo: base64 grayscale WebP and its size in pixels. */
export interface ComprobanteGasto {
  readonly bytes: string;
  readonly width: number;
  readonly height: number;
}

/** A receipt ready to save once its gasto's id is known. */
export type ComprobanteValido = Omit<NewExpenseReceipt, 'gastoId'>;

const SinGasto = NewExpenseReceiptSchema.omit({ gastoId: true });

/** Throws `ExpenseReceiptTooLargeError` or `ExpenseReceiptUnreadableError`. */
export function validarComprobante(c: ComprobanteGasto, businessId: BusinessId): ComprobanteValido {
  const weight = base64ByteLength(c.bytes);
  if (weight > MAX_EXPENSE_RECEIPT_BYTES) throw new ExpenseReceiptTooLargeError(weight);
  const parsed = SinGasto.safeParse({
    bytes: c.bytes,
    width: c.width,
    height: c.height,
    businessId,
  });
  if (!parsed.success) throw new ExpenseReceiptUnreadableError();
  return parsed.data;
}
