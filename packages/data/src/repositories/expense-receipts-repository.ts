/**
 * ExpenseReceiptsRepository — the gasto's receipt photo on the device (M-18,
 * ADR-149).
 *
 * Insert only over `expense_receipts` (migration 0016): every insert reaches
 * the change log and the outbox pushes it; nothing is pulled back, so this
 * device holds only the receipts it took. The newest row per gasto is the
 * receipt (`latestExpenseReceipts`). Whether a gasto may take one — it exists,
 * is this business's, has none yet — is the use case's to decide.
 */

import type { ExpenseId, ExpenseReceipt, NewExpenseReceipt } from '@xangarro/domain';

export type { ExpenseReceipt, NewExpenseReceipt };

export interface ExpenseReceiptsRepository {
  /** Appends a receipt for a gasto; never updates a row. */
  create(input: NewExpenseReceipt): Promise<ExpenseReceipt>;
  /** The gasto's receipt — its newest non-deleted row — or null when it has none. */
  findLatestByGasto(gastoId: ExpenseId): Promise<ExpenseReceipt | null>;
  /** Of `gastoIds`, the ones that have a receipt: the Gastos list's «con foto». */
  findGastosWithReceipt(gastoIds: readonly ExpenseId[]): Promise<ReadonlySet<ExpenseId>>;
}
