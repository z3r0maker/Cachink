/**
 * GenerarInformeMensualUseCase (P1B-M6-T07).
 *
 * Pulls a month's data from the repositories and returns a structured
 * `InformeMensual` — ventas + egresos + NIF Estado de Resultados +
 * per-categoría breakdowns. The UI serialises to PDF in P1C-M9; this
 * use-case stays format-agnostic.
 *
 * `yearMonth` is a `YYYY-MM` string. The use-case derives the first
 * and last day of the month so the Estado de Resultados ISR tasa can
 * be scoped via the Business record (future extension).
 */

import {
  calculateEstadoDeResultados,
  type BusinessId,
  type EstadoDeResultados,
  type Expense,
  type ExpenseCategory,
  type Money,
  type Sale,
  type SaleCategory,
} from '@cachink/domain';
import type {
  BusinessesRepository,
  ExpensesRepository,
  SalesRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface GenerarInformeMensualInput {
  businessId: BusinessId;
  /** `YYYY-MM`, e.g. `"2026-04"`. */
  yearMonth: string;
}

export interface InformeMensual {
  businessId: BusinessId;
  yearMonth: string;
  ventas: readonly Sale[];
  egresos: readonly Expense[];
  estadoResultados: EstadoDeResultados;
  ventasPorCategoria: Record<SaleCategory, Money>;
  egresosPorCategoria: Record<ExpenseCategory, Money>;
}

export class GenerarInformeMensualUseCase
  implements UseCase<GenerarInformeMensualInput, InformeMensual>
{
  readonly #sales: SalesRepository;
  readonly #expenses: ExpensesRepository;
  readonly #businesses: BusinessesRepository;

  constructor(
    sales: SalesRepository,
    expenses: ExpensesRepository,
    businesses: BusinessesRepository,
  ) {
    this.#sales = sales;
    this.#expenses = expenses;
    this.#businesses = businesses;
  }

  async execute(input: GenerarInformeMensualInput): Promise<InformeMensual> {
    if (!/^\d{4}-\d{2}$/.test(input.yearMonth)) {
      throw new TypeError(`yearMonth must be in YYYY-MM format, got "${input.yearMonth}"`);
    }
    const business = await this.#businesses.findById(input.businessId);
    if (!business) {
      throw new TypeError(`Business ${input.businessId} no existe`);
    }

    const [ventas, egresos] = await Promise.all([
      this.#findSalesForMonth(input.yearMonth, input.businessId),
      this.#expenses.findByMonth(input.yearMonth, input.businessId),
    ]);

    const estadoResultados = calculateEstadoDeResultados({
      ventas,
      egresos,
      isrTasa: business.isrTasa,
    });

    return {
      businessId: input.businessId,
      yearMonth: input.yearMonth,
      ventas,
      egresos,
      estadoResultados,
      ventasPorCategoria: groupByCategory(ventas, (v) => v.categoria, (v) => v.monto),
      egresosPorCategoria: groupByCategory(egresos, (e) => e.categoria, (e) => e.monto),
    };
  }

  /**
   * SalesRepository doesn't expose a findByMonth helper — there is no
   * Phase 1 UI that lists a full month of sales, only of a single
   * date. For the informe we aggregate by calling findByDate across
   * the days of the month. The cost is negligible for the monthly
   * scope (max 31 round trips against SQLite).
   *
   * When P1C adds a monthly ventas view we'll promote findByMonth to
   * the SalesRepository interface and simplify this call.
   */
  async #findSalesForMonth(
    yearMonth: string,
    businessId: BusinessId,
  ): Promise<readonly Sale[]> {
    const [year, month] = yearMonth.split('-').map(Number) as [number, number];
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return `${yearMonth}-${day}` as never;
    });
    const results = await Promise.all(
      dates.map((date) => this.#sales.findByDate(date, businessId)),
    );
    return results.flat();
  }
}

function groupByCategory<T, K extends string>(
  rows: readonly T[],
  keyOf: (r: T) => K,
  montoOf: (r: T) => Money,
): Record<K, Money> {
  const acc = {} as Record<K, Money>;
  for (const row of rows) {
    const key = keyOf(row);
    acc[key] = (acc[key] ?? 0n) + montoOf(row);
  }
  return acc;
}
