/**
 * Flujo de Efectivo (NIF B-2) — simplified per CLAUDE.md §10.
 *
 * Distinguishes cash cobros from Crédito ventas:
 *   Cash methods: Efectivo, Transferencia, Tarjeta, QR/CoDi.
 *   Crédito ventas contribute cash only via PagoCliente rows — they
 *   don't count as cash-in when the sale is made.
 *
 * Flow:
 *   operacion = cash-in from cash ventas
 *             + cash-in from pagos of Crédito ventas
 *             − cash-out from egresos (all categorias except 'Inventario')
 *   inversion = −(egresos with categoria = 'Inventario')
 *   total     = operacion + inversion
 */

import type { ClientPayment } from '../entities/client-payment.js';
import type { Expense } from '../entities/expense.js';
import type { PaymentMethod, Sale } from '../entities/sale.js';
import type { Money } from '../money/index.js';
import { ZERO, sum } from '../money/index.js';

const CASH_METHODS = new Set<PaymentMethod>(['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi']);

export interface FlujoDeEfectivo {
  operacion: Money;
  inversion: Money;
  total: Money;
}

export interface FlujoDeEfectivoInput {
  ventas: readonly Sale[];
  egresos: readonly Expense[];
  pagosClientes: readonly ClientPayment[];
}

export function calculateFlujoDeEfectivo(input: FlujoDeEfectivoInput): FlujoDeEfectivo {
  const cashInFromSales = sum(
    input.ventas.filter((v) => CASH_METHODS.has(v.metodo)).map((v) => v.monto),
  );
  const cashInFromPagos = sum(input.pagosClientes.map((p) => p.montoCentavos));

  const cashOutOperativo = sum(
    input.egresos.filter((e) => e.categoria !== 'Inventario').map((e) => e.monto),
  );
  const cashOutInversion = sum(
    input.egresos.filter((e) => e.categoria === 'Inventario').map((e) => e.monto),
  );

  const operacion = cashInFromSales + cashInFromPagos - cashOutOperativo;
  const inversion = ZERO - cashOutInversion;
  const total = operacion + inversion;

  return { operacion, inversion, total };
}
