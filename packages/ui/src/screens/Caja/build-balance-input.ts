/**
 * buildBalanceInput — maps raw query data into CajaBalanceInput.
 *
 * Shared by useTurnBalance and useExpectedCash to avoid duplication.
 * Cash tickets carry their lines' total and the tendered cash (ADR-073).
 */

import type {
  CajaBalanceInput,
  CajaMovimiento,
  CajaTurno,
  Expense,
  Ticket,
} from '@xangarro/domain';
import { conTotales } from '@xangarro/domain';
import type { Sale } from '@xangarro/domain';

export function buildBalanceInput(
  turno: CajaTurno,
  tickets: readonly Ticket[],
  lines: readonly Sale[],
  expenses: readonly Expense[],
  movimientos: readonly CajaMovimiento[],
): CajaBalanceInput {
  const conTotal = conTotales(tickets, lines);
  const cash = conTotal.filter(
    (v) => v.ticket.metodo === 'Efectivo' && v.ticket.cancelledAt === null,
  );
  const cancelledCash = conTotal.filter(
    (v) => v.ticket.metodo === 'Efectivo' && v.ticket.cancelledAt !== null,
  );

  return {
    aperturaCentavos: turno.montoAperturaCentavos,
    adicionalCentavos: turno.efectivoAdicionalCentavos,
    ventasEfectivoCentavos: cash.map((v) => v.total),
    efectivoRecibidoPorVenta: cash
      .filter((v) => v.ticket.efectivoRecibidoCentavos != null)
      .map((v) => ({ monto: v.total, efectivoRecibido: v.ticket.efectivoRecibidoCentavos! })),
    egresosEfectivoCentavos: expenses.map((e) => e.monto),
    depositosCentavos: movimientos.filter((m) => m.tipo === 'deposito').map((m) => m.montoCentavos),
    retirosCentavos: movimientos.filter((m) => m.tipo === 'retiro').map((m) => m.montoCentavos),
    cancelacionesEfectivoCentavos: cancelledCash.map((v) => v.total),
  };
}
