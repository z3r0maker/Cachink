/**
 * DescartarGastoRecurrenteUseCase (Phase 17, Gap B).
 *
 * Advances a recurring expense template's `proximoDisparo` to the next
 * cycle WITHOUT creating an egreso. Used when the user taps "Descartar"
 * on a PendientesCard row — they acknowledge the pendiente but choose
 * not to register the expense this period.
 */

import type { IsoDate, RecurringExpense } from '@cachink/domain';
import type { RecurringExpensesRepository } from '@cachink/data';
import type { UseCase } from '../_use-case.js';
import { advanceProximoDisparo } from '../procesar-gasto-recurrente/procesar-gasto-recurrente-use-case.js';

export interface DescartarGastoRecurrenteInput {
  template: RecurringExpense;
  today: IsoDate;
}

export interface DescartarGastoRecurrenteResult {
  skipped: boolean;
  nextProximoDisparo: IsoDate | null;
}

export class DescartarGastoRecurrenteUseCase
  implements UseCase<DescartarGastoRecurrenteInput, DescartarGastoRecurrenteResult>
{
  readonly #recurring: RecurringExpensesRepository;

  constructor(recurring: RecurringExpensesRepository) {
    this.#recurring = recurring;
  }

  async execute(
    input: DescartarGastoRecurrenteInput,
  ): Promise<DescartarGastoRecurrenteResult> {
    const { template, today } = input;
    if (!template.activo || template.proximoDisparo > today) {
      return { skipped: true, nextProximoDisparo: null };
    }

    const next = advanceProximoDisparo(
      template.proximoDisparo,
      template.frecuencia,
      template.diaDelMes,
    );
    await this.#recurring.markFired(template.id, next);

    return { skipped: false, nextProximoDisparo: next };
  }
}
