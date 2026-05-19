/**
 * buildBalanceInput — maps raw query data into CajaBalanceInput.
 *
 * Shared by useTurnBalance and useExpectedCash to avoid duplication.
 */

import type {
  CajaBalanceInput,
  CajaMovimiento,
  CajaTurno,
  Expense,
  Sale,
} from '@cachink/domain';

function cashSales(sales: readonly Sale[]): readonly Sale[] {
  return sales.filter((s) => s.metodo === 'Efectivo' && !s.cancelledAt);
}

function cancelledCashSales(sales: readonly Sale[]): readonly Sale[] {
  return sales.filter((s) => s.metodo === 'Efectivo' && s.cancelledAt != null);
}

export function buildBalanceInput(
  turno: CajaTurno,
  sales: readonly Sale[],
  expenses: readonly Expense[],
  movimientos: readonly CajaMovimiento[],
): CajaBalanceInput {
  const cash = cashSales(sales);

  return {
    aperturaCentavos: turno.montoAperturaCentavos,
    adicionalCentavos: turno.efectivoAdicionalCentavos,
    ventasEfectivoCentavos: cash.map((s) => s.monto),
    efectivoRecibidoPorVenta: cash
      .filter((s) => s.efectivoRecibidoCentavos != null)
      .map((s) => ({ monto: s.monto, efectivoRecibido: s.efectivoRecibidoCentavos! })),
    egresosEfectivoCentavos: expenses.map((e) => e.monto),
    depositosCentavos: movimientos.filter((m) => m.tipo === 'deposito').map((m) => m.montoCentavos),
    retirosCentavos: movimientos.filter((m) => m.tipo === 'retiro').map((m) => m.montoCentavos),
    cancelacionesEfectivoCentavos: cancelledCashSales(sales).map((s) => s.monto),
  };
}
