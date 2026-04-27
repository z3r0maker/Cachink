/**
 * EditarEgresoUseCase (Audit Round 2 J2) — applies a partial patch to
 * an existing Egreso.
 *
 * Responsibilities:
 *   1. Re-validate the patch fields with Zod at the boundary
 *      (defence-in-depth — UI may have skipped).
 *   2. Delegate persistence to ExpensesRepository.update().
 *
 * Returns the updated Egreso, or throws when the row no longer exists
 * (deleted between list-tap and edit-submit). Edit doesn't reassign
 * `gastoRecurrenteId` provenance — that pointer is owned by the
 * recurring-expense template flow.
 */

import { ExpenseSchema, type Expense, type ExpenseId } from '@cachink/domain';
import type { ExpensePatch, ExpensesRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface EditarEgresoInput {
  readonly id: ExpenseId;
  readonly patch: ExpensePatch;
}

export class EditarEgresoUseCase implements UseCase<EditarEgresoInput, Expense> {
  readonly #expenses: ExpensesRepository;

  constructor(expenses: ExpensesRepository) {
    this.#expenses = expenses;
  }

  async execute(input: EditarEgresoInput): Promise<Expense> {
    const existing = await this.#expenses.findById(input.id);
    if (!existing) {
      throw new TypeError(`Egreso ${input.id} no existe o fue eliminado`);
    }
    const merged = { ...existing, ...input.patch };
    ExpenseSchema.parse(merged);
    const updated = await this.#expenses.update(input.id, input.patch);
    if (!updated) {
      throw new TypeError(`Egreso ${input.id} desapareció durante la actualización`);
    }
    return updated;
  }
}
