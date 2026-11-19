/** Typed errors for the gasto's receipt photo (M-18, ADR-149). */

import { MAX_EXPENSE_RECEIPT_BYTES } from '../entities/expense-receipt.js';

/** The encoded receipt still weighs more than a row may carry. */
export class ExpenseReceiptTooLargeError extends Error {
  readonly code = 'EXPENSE_RECEIPT_TOO_LARGE' as const;

  constructor(readonly bytes: number) {
    super(
      `La foto pesa ${bytes} bytes y el límite es ${MAX_EXPENSE_RECEIPT_BYTES}. Toma otra, más de cerca y con luz.`,
    );
    this.name = 'ExpenseReceiptTooLargeError';
  }
}

/** «Agregar foto» on a gasto that already has its receipt: it is never replaced. */
export class ExpenseReceiptExistsError extends Error {
  readonly code = 'EXPENSE_RECEIPT_EXISTS' as const;

  constructor(readonly gastoId: string) {
    super('Este gasto ya tiene su comprobante.');
    this.name = 'ExpenseReceiptExistsError';
  }
}

/** The camera's or the gallery's file could not be decoded as an image. */
export class ExpenseReceiptUnreadableError extends Error {
  readonly code = 'EXPENSE_RECEIPT_UNREADABLE' as const;

  constructor() {
    super('No pude abrir la foto. Toma otra.');
    this.name = 'ExpenseReceiptUnreadableError';
  }
}
