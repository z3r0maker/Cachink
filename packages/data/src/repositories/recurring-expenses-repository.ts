/**
 * RecurringExpensesRepository — templates that auto-generate egresos on
 * the cadence the user picks. Powers the "pendiente de registrar" card
 * (CLAUDE.md §1) + ProcesarGastoRecurrenteUseCase (P1B-M6-T06).
 */

import type {
  BusinessId,
  IsoDate,
  NewRecurringExpense,
  RecurringExpense,
  RecurringExpenseId,
} from '@cachink/domain';

export type { RecurringExpense, NewRecurringExpense };

export interface RecurringExpensesRepository {
  create(input: NewRecurringExpense): Promise<RecurringExpense>;
  findById(id: RecurringExpenseId): Promise<RecurringExpense | null>;
  /** Active templates whose proximoDisparo is on or before `today`. */
  findDue(today: IsoDate, businessId: BusinessId): Promise<readonly RecurringExpense[]>;
  /** Advance proximoDisparo and bump updatedAt after a fire. */
  markFired(id: RecurringExpenseId, nextProximoDisparo: IsoDate): Promise<void>;
  delete(id: RecurringExpenseId): Promise<void>;
}
