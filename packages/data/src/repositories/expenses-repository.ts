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
  delete(id: ExpenseId): Promise<void>;
}
