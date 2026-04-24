/**
 * RegistrarEgresoUseCase (P1B-M6-T02) — records an Egreso.
 *
 * Defence-in-depth Zod validation + an optional referential check on
 * `gastoRecurrenteId`: if the caller links the Egreso to a recurring
 * template, the template must exist and be active.
 */

import { NewExpenseSchema, type Expense, type NewExpense } from '@cachink/domain';
import type { ExpensesRepository, RecurringExpensesRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export class RegistrarEgresoUseCase implements UseCase<NewExpense, Expense> {
  readonly #expenses: ExpensesRepository;
  readonly #recurring: RecurringExpensesRepository;

  constructor(expenses: ExpensesRepository, recurring: RecurringExpensesRepository) {
    this.#expenses = expenses;
    this.#recurring = recurring;
  }

  async execute(input: NewExpense): Promise<Expense> {
    const parsed = NewExpenseSchema.parse(input);
    if (parsed.gastoRecurrenteId) {
      const template = await this.#recurring.findById(parsed.gastoRecurrenteId);
      if (!template) {
        throw new TypeError(`GastoRecurrente ${parsed.gastoRecurrenteId} no existe`);
      }
      if (!template.activo) {
        throw new TypeError(`GastoRecurrente ${parsed.gastoRecurrenteId} está inactivo`);
      }
    }
    return this.#expenses.create(parsed);
  }
}
