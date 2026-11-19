/**
 * RegistrarEgresoUseCase (P1B-M6-T02) — records an Egreso.
 *
 * Defence-in-depth Zod validation + an optional referential check on
 * `gastoRecurrenteId`: if the caller links the Egreso to a recurring
 * template, the template must exist and be active.
 *
 * The phone's Registrar gasto may hand over its receipt (M-18, ADR-149). The
 * device's repositories share no transaction, so the receipt is checked
 * before anything is written and saved right after the gasto, with its id:
 * a refused photo never leaves a gasto behind. Only a failing insert of the
 * receipt itself can, and «Agregar foto» then adds it to that gasto.
 */

import { NewExpenseSchema, type Expense, type NewExpense } from '@xangarro/domain';
import type {
  ExpenseReceiptsRepository,
  ExpensesRepository,
  RecurringExpensesRepository,
} from '@xangarro/data';
import type { UseCase } from '../_use-case.js';
import { UNLIMITED_QUOTA, type RecordQuota } from '../record-quota/record-quota.js';
import { validarComprobante, type ComprobanteGasto } from '../comprobante-gasto/comprobante.js';

export interface RegistrarEgresoInput extends NewExpense {
  /** The receipt photo the operator took; null or absent saves the gasto alone. */
  readonly comprobante?: ComprobanteGasto | null;
}

export class RegistrarEgresoUseCase implements UseCase<RegistrarEgresoInput, Expense> {
  readonly #expenses: ExpensesRepository;
  readonly #recurring: RecurringExpensesRepository;
  readonly #quota: RecordQuota;
  readonly #receipts: Pick<ExpenseReceiptsRepository, 'create'> | null;

  constructor(
    expenses: ExpensesRepository,
    recurring: RecurringExpensesRepository,
    quota: RecordQuota = UNLIMITED_QUOTA,
    receipts: Pick<ExpenseReceiptsRepository, 'create'> | null = null,
  ) {
    this.#expenses = expenses;
    this.#recurring = recurring;
    this.#quota = quota;
    this.#receipts = receipts;
  }

  async execute(input: RegistrarEgresoInput): Promise<Expense> {
    const parsed = NewExpenseSchema.parse(input);
    const comprobante = input.comprobante ?? null;
    if (comprobante !== null && this.#receipts === null) {
      throw new TypeError('RegistrarEgresoUseCase needs a receipts repository for a comprobante');
    }
    const receipt =
      comprobante === null ? null : validarComprobante(comprobante, parsed.businessId);
    await this.#quota.assertCanCreate();
    await this.#assertTemplate(parsed.gastoRecurrenteId);
    const egreso = await this.#expenses.create(parsed);
    if (receipt !== null) await this.#receipts?.create({ ...receipt, gastoId: egreso.id });
    return egreso;
  }

  async #assertTemplate(id: NewExpense['gastoRecurrenteId']): Promise<void> {
    if (!id) return;
    const template = await this.#recurring.findById(id);
    if (!template) {
      throw new TypeError(`GastoRecurrente ${id} no existe`);
    }
    if (!template.activo) {
      throw new TypeError(`GastoRecurrente ${id} está inactivo`);
    }
  }
}
