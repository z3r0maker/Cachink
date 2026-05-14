/**
 * CerrarCajaUseCase — closes an open cash drawer turn.
 *
 * Calculates expected cash, computes discrepancy, requires a reason
 * when discrepancy ≠ 0, and MANDATORILY auto-creates an Egreso when
 * the reason is 'gasto-no-registrado'.
 *
 * Phase 6 of the Feature Flags plan: Caja.
 */

import {
  now,
  today,
  type CajaTurno,
  type CerrarCajaInput,
  CerrarCajaSchema,
} from '@cachink/domain';
import type {
  CajaTurnosRepository,
  ExpensesRepository,
  SalesRepository,
} from '@cachink/data';
import type { BusinessId, ExpenseId } from '@cachink/domain';
import { sum, ZERO, type Money } from '@cachink/domain';
import type { UseCase } from '../_use-case.js';

export interface CerrarCajaFullInput extends CerrarCajaInput {
  readonly businessId: BusinessId;
}

export class CerrarCajaUseCase
  implements UseCase<CerrarCajaFullInput, CajaTurno>
{
  readonly #turnos: CajaTurnosRepository;
  readonly #sales: SalesRepository;
  readonly #expenses: ExpensesRepository;

  constructor(
    turnos: CajaTurnosRepository,
    sales: SalesRepository,
    expenses: ExpensesRepository,
  ) {
    this.#turnos = turnos;
    this.#sales = sales;
    this.#expenses = expenses;
  }

  async execute(input: CerrarCajaFullInput): Promise<CajaTurno> {
    const parsed = CerrarCajaSchema.parse(input);
    const turno = await this.#turnos.findById(parsed.turnoId);
    if (!turno) throw new TypeError('Turno no encontrado');
    if (turno.cierreAt !== null) throw new TypeError('Este turno ya fue cerrado');

    const [salesDuringTurn, expensesDuringTurn] = await Promise.all([
      this.#sales.findByDateRange(turno.fecha, today(), input.businessId),
      this.#expenses.findByDateRange(turno.fecha, today(), input.businessId),
    ]);
    const totals = this.#computeTotals(salesDuringTurn, expensesDuringTurn);
    const esperado = this.#computeExpected(turno, totals);
    const diferencia = parsed.montoCierreCentavos - esperado;

    if (diferencia !== ZERO && !parsed.discrepancyReason) {
      throw new TypeError('Se requiere una razón para la diferencia en el cierre');
    }
    const egresoAutoId = await this.#maybeCreateAutoEgreso(
      parsed, diferencia, input.businessId,
    );
    return this.#turnos.update(parsed.turnoId, {
      cierreAt: now(),
      montoCierreCentavos: parsed.montoCierreCentavos,
      efectivoEsperadoCentavos: esperado,
      diferenciaCentavos: diferencia,
      discrepancyReason: parsed.discrepancyReason,
      explicacion: parsed.explicacion,
      totalTransferencias: totals.transferencias,
      totalTarjeta: totals.tarjeta,
      totalQr: totals.qr,
      totalCredito: totals.credito,
      egresoAutoId,
    });
  }

  #computeExpected(
    turno: CajaTurno,
    totals: { efectivoVentas: Money; efectivoEgresos: Money },
  ): Money {
    return (
      turno.montoAperturaCentavos +
      turno.efectivoAdicionalCentavos +
      totals.efectivoVentas -
      totals.efectivoEgresos
    );
  }

  async #maybeCreateAutoEgreso(
    parsed: ReturnType<typeof CerrarCajaSchema.parse>,
    diferencia: Money,
    businessId: BusinessId,
  ): Promise<ExpenseId | null> {
    if (parsed.discrepancyReason !== 'gasto-no-registrado' || diferencia >= ZERO) {
      return null;
    }
    const abs = diferencia < 0n ? -diferencia : diferencia;
    const egreso = await this.#expenses.create({
      fecha: today(),
      concepto: parsed.explicacion ?? 'Gasto no registrado (Caja)',
      categoria: 'Otro',
      monto: abs,
      businessId,
    });
    return egreso.id;
  }

  #computeTotals(
    sales: readonly { metodo: string; monto: Money }[],
    expenses: readonly { monto: Money }[],
  ): {
    efectivoVentas: Money;
    transferencias: Money;
    tarjeta: Money;
    qr: Money;
    credito: Money;
    efectivoEgresos: Money;
  } {
    return {
      efectivoVentas: sum(sales.filter((s) => s.metodo === 'Efectivo').map((s) => s.monto)),
      transferencias: sum(sales.filter((s) => s.metodo === 'Transferencia').map((s) => s.monto)),
      tarjeta: sum(sales.filter((s) => s.metodo === 'Tarjeta').map((s) => s.monto)),
      qr: sum(sales.filter((s) => s.metodo === 'QR/CoDi').map((s) => s.monto)),
      credito: sum(sales.filter((s) => s.metodo === 'Crédito').map((s) => s.monto)),
      efectivoEgresos: sum(expenses.map((e) => e.monto)),
    };
  }
}
