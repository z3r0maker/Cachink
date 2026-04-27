/**
 * ExpensesRepository — egresos CRUD plus date / month / category queries
 * the Estados Financieros + Informe Mensual flows need.
 *
 * `findByMonth` accepts a `YYYY-MM` string; `findByCategory` accepts an
 * inclusive date range so the caller can scope per-period without the
 * repo owning any date math.
 */

import type {
  BusinessId,
  Expense,
  ExpenseCategory,
  ExpenseId,
  IsoDate,
  NewExpense,
} from '@cachink/domain';

export type { Expense, NewExpense };

/**
 * Partial-patch shape for `update()` per ADR-023. Excludes immutable
 * audit fields (id, businessId, deviceId, createdAt) and the
 * `gastoRecurrenteId` provenance link (recurring-expense templates own
 * that pointer; manual edits don't reassign it).
 *
 * Audit Round 2 J2: enables per-row swipe-to-edit (Phase K wiring).
 */
export type ExpensePatch = Partial<
  Pick<Expense, 'fecha' | 'concepto' | 'categoria' | 'monto' | 'proveedor'>
>;

export interface ExpensesRepository {
  create(input: NewExpense): Promise<Expense>;
  findById(id: ExpenseId): Promise<Expense | null>;
  findByDate(date: IsoDate, businessId: BusinessId): Promise<readonly Expense[]>;
  /** `yearMonth` is a `YYYY-MM` string, e.g. `"2026-04"`. */
  findByMonth(yearMonth: string, businessId: BusinessId): Promise<readonly Expense[]>;
  findByCategory(
    categoria: ExpenseCategory,
    businessId: BusinessId,
    from: IsoDate,
    to: IsoDate,
  ): Promise<readonly Expense[]>;
  /**
   * Partial update per ADR-023. Returns the post-update row or null
   * when not found / soft-deleted. Audit Round 2 J2.
   */
  update(id: ExpenseId, patch: ExpensePatch): Promise<Expense | null>;
  delete(id: ExpenseId): Promise<void>;
}
