/**
 * ProcesarGastoRecurrenteUseCase (P1B-M6-T06).
 *
 * Given a RecurringExpense whose `proximoDisparo <= today`, creates an
 * Egreso linked via `gastoRecurrenteId` and advances `proximoDisparo`
 * per the template's `frecuencia`:
 *   semanal   → +7 días
 *   quincenal → +15 días
 *   mensual   → +1 mes calendario (clampa diaDelMes al fin de mes)
 *
 * Inactive templates are skipped with a noop ExecuteResult.processed=false.
 * Callers pass a batch of templates (repo.findDue) and process them one
 * by one; each call is atomic at the app level but not cross-template.
 */

import type {
  Expense,
  IsoDate,
  RecurringExpense,
} from '@cachink/domain';
import type {
  ExpensesRepository,
  RecurringExpensesRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface ProcesarGastoRecurrenteInput {
  template: RecurringExpense;
  today: IsoDate;
}

export interface ProcesarGastoRecurrenteResult {
  processed: boolean;
  egreso: Expense | null;
  nextProximoDisparo: IsoDate | null;
}

export class ProcesarGastoRecurrenteUseCase
  implements UseCase<ProcesarGastoRecurrenteInput, ProcesarGastoRecurrenteResult>
{
  readonly #expenses: ExpensesRepository;
  readonly #recurring: RecurringExpensesRepository;

  constructor(
    expenses: ExpensesRepository,
    recurring: RecurringExpensesRepository,
  ) {
    this.#expenses = expenses;
    this.#recurring = recurring;
  }

  async execute(
    input: ProcesarGastoRecurrenteInput,
  ): Promise<ProcesarGastoRecurrenteResult> {
    const { template, today } = input;
    if (!template.activo) {
      return { processed: false, egreso: null, nextProximoDisparo: null };
    }
    if (template.proximoDisparo > today) {
      return { processed: false, egreso: null, nextProximoDisparo: null };
    }

    const egreso = await this.#expenses.create({
      fecha: today,
      concepto: template.concepto,
      categoria: template.categoria,
      monto: template.montoCentavos,
      proveedor: template.proveedor ?? undefined,
      gastoRecurrenteId: template.id,
      businessId: template.businessId,
    });

    const next = advanceProximoDisparo(
      template.proximoDisparo,
      template.frecuencia,
      template.diaDelMes,
    );
    await this.#recurring.markFired(template.id, next);

    return { processed: true, egreso, nextProximoDisparo: next };
  }
}

/**
 * Calendar math lives here (not in the domain) because it's app-layer
 * orchestration — the domain has no date libraries (CLAUDE.md §4.2).
 *
 *   semanal   → +7 días
 *   quincenal → +15 días
 *   mensual   → +1 mes calendario, clampa al fin de mes para evitar
 *               que "31 de marzo" resbale a "31 de abril" (no existe).
 */
function advanceProximoDisparo(
  current: IsoDate,
  frecuencia: RecurringExpense['frecuencia'],
  diaDelMes: number | null,
): IsoDate {
  const base = new Date(`${current}T00:00:00.000Z`);
  if (frecuencia === 'semanal') {
    base.setUTCDate(base.getUTCDate() + 7);
    return base.toISOString().slice(0, 10) as IsoDate;
  }
  if (frecuencia === 'quincenal') {
    base.setUTCDate(base.getUTCDate() + 15);
    return base.toISOString().slice(0, 10) as IsoDate;
  }
  // mensual — keep month 0-indexed end-to-end to avoid off-by-one bugs.
  const year = base.getUTCFullYear();
  const month0 = base.getUTCMonth(); // 0 = Jan, 11 = Dec
  const nextMonth0 = (month0 + 1) % 12;
  const nextYear = month0 === 11 ? year + 1 : year;
  const target = diaDelMes ?? base.getUTCDate();
  const daysInNextMonth = new Date(Date.UTC(nextYear, nextMonth0 + 1, 0)).getUTCDate();
  const clampedDay = Math.min(target, daysInNextMonth);
  const next = new Date(Date.UTC(nextYear, nextMonth0, clampedDay));
  return next.toISOString().slice(0, 10) as IsoDate;
}
