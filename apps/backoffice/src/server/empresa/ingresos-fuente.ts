import type { PagoDeXangarro, RevenueSource } from '@xangarro/application/corp';
import { ingresosDelPeriodo, type IngresoDelPeriodo } from '@xangarro/data-pg';

import type { Db, Tx } from '../db/client';
import { hoyEnMexico } from '../db/corp';

/**
 * E-10's `RevenueSource` over the ADR-070 tables, never Stripe live: a month
 * of Xangarro's payments read through `xangarro.ingresos_del_periodo()` on the
 * backoffice's `xangarro_admin` connection.
 */

/** Refunded in full: cancelled, or its credit notes add up to what was paid. */
export const reembolsado = (i: IngresoDelPeriodo): boolean =>
  i.status === 'cancelled' ||
  (i.notasDeCreditoCentavos > 0n && i.notasDeCreditoCentavos >= i.totalCentavos);

/** One payment as the import posts it: dated in Mexico City, named by its receptor. */
export function pagoDeXangarro(i: IngresoDelPeriodo): PagoDeXangarro {
  return {
    paymentId: i.paymentId,
    pagadoEl: hoyEnMexico(new Date(i.paidAt)),
    total: i.totalCentavos,
    cliente: i.receptorNombre,
    reembolsado: reembolsado(i),
  };
}

export function fuenteDeIngresos(conn: Db | Tx): RevenueSource {
  return {
    pagosDelPeriodo: async (periodo) =>
      (await ingresosDelPeriodo(conn, periodo)).map(pagoDeXangarro),
  };
}
