/**
 * «Agregar foto» on a saved gasto (M-18, ADR-149): the gasto's receipt, taken
 * after the fact, becomes an `expense_receipts` row on the gasto's business.
 * Only a gasto with none takes one: once saved, a receipt is never replaced.
 * A gasto this device does not hold, or another business's, is refused alike.
 */

import {
  ExpenseNotFoundError,
  ExpenseReceiptExistsError,
  type BusinessId,
  type ExpenseId,
  type ExpenseReceipt,
} from '@xangarro/domain';
import type { ExpenseReceiptsRepository, ExpensesRepository } from '@xangarro/data';
import type { UseCase } from '../_use-case.js';
import { validarComprobante, type ComprobanteGasto } from './comprobante.js';

export interface AgregarComprobanteGastoInput extends ComprobanteGasto {
  readonly gastoId: ExpenseId;
  /** The session's business: the gasto must be its. */
  readonly businessId: BusinessId;
}

export class AgregarComprobanteGastoUseCase implements UseCase<
  AgregarComprobanteGastoInput,
  ExpenseReceipt
> {
  constructor(
    private readonly expenses: Pick<ExpensesRepository, 'findById'>,
    private readonly receipts: Pick<ExpenseReceiptsRepository, 'create' | 'findLatestByGasto'>,
  ) {}

  async execute(input: AgregarComprobanteGastoInput): Promise<ExpenseReceipt> {
    const gasto = await this.expenses.findById(input.gastoId);
    if (gasto === null || gasto.businessId !== input.businessId) {
      throw new ExpenseNotFoundError(input.gastoId);
    }
    if ((await this.receipts.findLatestByGasto(gasto.id)) !== null) {
      throw new ExpenseReceiptExistsError(gasto.id);
    }
    const valido = validarComprobante(input, gasto.businessId);
    return this.receipts.create({ ...valido, gastoId: gasto.id });
  }
}
