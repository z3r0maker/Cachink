import { formatMonth } from '@xangarro/domain';
import { periodOf } from '@xangarro/domain/corp';

import { FechaDePagoError } from './errors.js';

/**
 * The day an invoice on credit was paid (E-11, board CD-06e): the day it
 * left the bank, so never before the invoice, never after today, and never
 * in a closed month.
 */
const nombreMes = (mes: string) => formatMonth(mes).split(' ')[0] ?? mes;

function mesDespues(mes: string): string {
  const t = Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5, 7));
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

/** The first month after `mes` that is not closed. */
function primeroAbierto(mes: string, cerrados: ReadonlySet<string>): string {
  let m = mesDespues(mes);
  while (cerrados.has(m)) m = mesDespues(m);
  return m;
}

export function assertFechaDePago(
  fecha: string,
  limites: { readonly factura: string; readonly hoy: string },
  cerrados: ReadonlySet<string>,
): void {
  const mes = periodOf(fecha);
  const dia = Date.parse(`${fecha}T12:00:00Z`);
  if (mes === null || Number.isNaN(dia) || new Date(dia).toISOString().slice(0, 10) !== fecha) {
    throw new FechaDePagoError('Elige la fecha de pago.');
  }
  if (fecha < limites.factura) {
    throw new FechaDePagoError('El pago no puede ser antes de la fecha de la factura.');
  }
  if (fecha > limites.hoy) throw new FechaDePagoError('El pago no puede ser después de hoy.');
  if (cerrados.has(mes)) {
    const cerrado = nombreMes(mes);
    throw new FechaDePagoError(
      `${cerrado.charAt(0).toUpperCase()}${cerrado.slice(1)} ya está cerrado. ` +
        `Elige una fecha de ${nombreMes(primeroAbierto(mes, cerrados))} en adelante.`,
    );
  }
}
