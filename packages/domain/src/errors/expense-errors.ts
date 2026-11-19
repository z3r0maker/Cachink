/** Typed errors for a gasto (egreso). */

/**
 * The gasto is not on this device for this business: never written, deleted,
 * or another business's. One answer for all three, so a caller learns
 * nothing about a gasto it may not see.
 */
export class ExpenseNotFoundError extends Error {
  readonly code = 'EXPENSE_NOT_FOUND' as const;

  constructor(readonly id: string) {
    super('Ese gasto ya no existe.');
    this.name = 'ExpenseNotFoundError';
  }
}
