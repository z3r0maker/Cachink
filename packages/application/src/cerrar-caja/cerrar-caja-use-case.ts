/**
 * CerrarCajaUseCase — closes an open cash drawer turn.
 *
 * Calculates expected cash, computes discrepancy, requires a reason
 * when discrepancy ≠ 0, and MANDATORILY auto-creates an Egreso when
 * the reason is 'gasto-no-registrado'.
 *
 * Phase 6 of the Feature Flags plan: Caja.
 */

import { conTotales, esperadoDelTurno, vigentes } from '@xangarro/domain';
import {
  now,
  today,
  type CajaTurno,
  type CerrarCajaInput,
  CerrarCajaSchema,
} from '@xangarro/domain';
import type {
  CajaTurnosRepository,
  ClientPaymentsRepository,
  ExpensesRepository,
  SalesRepository,
  TicketsRepository,
} from '@xangarro/data';
import type { BusinessId, ExpenseId } from '@xangarro/domain';
import { sum, ZERO, type Money } from '@xangarro/domain';
import type { UseCase } from '../_use-case.js';

export interface CerrarCajaFullInput extends CerrarCajaInput {
  readonly businessId: BusinessId;
}

export class CerrarCajaUseCase implements UseCase<CerrarCajaFullInput, CajaTurno> {
  readonly #turnos: CajaTurnosRepository;
  readonly #tickets: TicketsRepository;
  readonly #sales: SalesRepository;
  readonly #expenses: ExpensesRepository;
  readonly #clientPayments: ClientPaymentsRepository;

  constructor(
    turnos: CajaTurnosRepository,
    tickets: TicketsRepository,
    sales: SalesRepository,
    expenses: ExpensesRepository,
    clientPayments: ClientPaymentsRepository,
  ) {
    this.#turnos = turnos;
    this.#tickets = tickets;
    this.#sales = sales;
    this.#expenses = expenses;
    this.#clientPayments = clientPayments;
  }

  /** The day's raw rows, from the turno's fecha to today (broad on purpose). */
  async #rowsDelDia(turno: CajaTurno, businessId: BusinessId) {
    const [tickets, lines, expenses, abonos] = await Promise.all([
      this.#tickets.findByDateRange(turno.fecha, today(), businessId),
      this.#sales.findByDateRange(turno.fecha, today(), businessId),
      this.#expenses.findByDateRange(turno.fecha, today(), businessId),
      this.#clientPayments.findByDateRange(turno.fecha, today(), businessId),
    ]);
    const ventas = conTotales(vigentes(tickets), lines).map((t) => ({
      metodo: t.ticket.metodo as string,
      monto: t.total,
    }));
    return { tickets, lines, expenses, abonos, ventas };
  }

  async execute(input: CerrarCajaFullInput): Promise<CajaTurno> {
    const parsed = CerrarCajaSchema.parse(input);
    const turno = await this.#turnos.findById(parsed.turnoId);
    if (!turno) throw new TypeError('Turno no encontrado');
    if (turno.cierreAt !== null) throw new TypeError('Este turno ya fue cerrado');

    const rows = await this.#rowsDelDia(turno, input.businessId);
    const totals = this.#computeTotals(rows.ventas, rows.expenses);
    // O-03: the one calculator, scoped by cajaTurnoId — never a date sum.
    const esperado = esperadoDelTurno(turno, rows.tickets, rows.lines, rows.abonos, rows.expenses);
    const diferencia = parsed.montoCierreCentavos - esperado;

    if (diferencia !== ZERO && !parsed.discrepancyReason) {
      throw new TypeError('Se requiere una razón para la diferencia en el cierre');
    }
    const egresoAutoId = await this.#maybeCreateAutoEgreso(parsed, diferencia, input.businessId);
    // The count is written once (ADR-074 §4): at close when it carries one,
    // never over a blind count saved before.
    const conteo =
      parsed.denominaciones === undefined
        ? {}
        : {
            conteoCentavos: parsed.montoCierreCentavos,
            conteoAt: now(),
            denominaciones: parsed.denominaciones,
          };
    return this.#turnos.update(parsed.turnoId, {
      cierreAt: now(),
      ...conteo,
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
