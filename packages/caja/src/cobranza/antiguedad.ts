/**
 * How old an account's debt and its last abono are, said the way the phone's
 * Fiado y abonos says them (MvCobranza): «Abonó hoy · debe desde hace 16
 * días», «No debe nada · último abono 9 may». Over the same derivations as
 * the web's cards (`abiertas`, `ultimoAbono`). Pure.
 */

import { diasEntre } from '../comun/frases';
import { abiertas, estadoCuenta, ultimoAbono } from './cliente/derive';
import type { CuentaCliente } from './cliente/types';

export interface Antiguedad {
  /** Days since the oldest open ticket; null with nothing owed. */
  readonly diasDeuda: number | null;
  /** Days since the last abono; null with no abono. */
  readonly diasAbono: number | null;
}

export function antiguedad(c: CuentaCliente, hoy: string): Antiguedad {
  const vieja = abiertas(c, estadoCuenta(c))[0];
  const ultimo = ultimoAbono(c);
  return {
    diasDeuda: vieja ? Math.max(0, diasEntre(vieja.venta.fecha.slice(0, 10), hoy)) : null,
    diasAbono: ultimo ? Math.max(0, diasEntre(ultimo.fecha.slice(0, 10), hoy)) : null,
  };
}

/** «hoy», «1 día», «16 días». */
export const haceDiasTexto = (n: number): string =>
  n === 0 ? 'hoy' : n === 1 ? '1 día' : `${n} días`;

/** The row's second line on the phone's list. */
export function lineaCuenta(c: CuentaCliente, hoy: string): string {
  const a = antiguedad(c, hoy);
  if (a.diasDeuda === null) {
    const ultimo = ultimoAbono(c);
    return ultimo ? `No debe nada · último abono ${ultimo.dia}` : 'No debe nada';
  }
  const abono =
    a.diasAbono === null
      ? 'Sin abonos'
      : a.diasAbono === 0
        ? 'Abonó hoy'
        : `Sin abonar hace ${haceDiasTexto(a.diasAbono)}`;
  return `${abono} · debe desde hace ${haceDiasTexto(a.diasDeuda)}`;
}
