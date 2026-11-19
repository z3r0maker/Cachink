import type { Money } from '../../money/index.js';
import { fechaDeCargo } from '../ledger/recurrentes.js';
import type { Servicio } from './tipos.js';
import { ServicioInvalidoError } from './validar.js';

/**
 * What a service costs (E-24): its monthly average from what it posted, the
 * current month's projection for one that charges by use, and a free plan's
 * share of its limit. Every amount is MXN centavos.
 */

/** `YYYY-MM` → what the service posted for that month (the month it pays, not the day). */
export type CostosPorMes = ReadonlyMap<string, Money>;

/** A projection needs this many days of the month (plan E-24's acceptance). */
export const DIAS_MINIMOS = 3;

/** A free plan at or above this share of its limit is «cerca del límite». */
export const CERCA_DEL_LIMITE = 60;

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** The month `n` months after `mes` (before, when negative). */
export function mesMas(mes: string, n: number): string {
  const m = MES.exec(mes);
  if (m === null) throw new ServicioInvalidoError(`«${mes}» no es un mes`);
  const i = Number(m[1]) * 12 + Number(m[2]) - 1 + n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
}

/** Half up, for non-negative amounts. */
const entre = (total: Money, n: bigint): Money => (total * 2n + n) / (2n * n);

/**
 * The monthly average of the last three months with a posted cost before
 * `mes`; an annual service's is its last twelve months' total over 12. Null
 * when nothing posted yet.
 */
export function promedioMensual(
  cobro: Servicio['cobro'],
  costos: CostosPorMes,
  mes: string,
): Money | null {
  if (cobro === 'anual') {
    let total = 0n;
    for (let i = 1; i <= 12; i += 1) total += costos.get(mesMas(mes, -i)) ?? 0n;
    return total === 0n ? null : entre(total, 12n);
  }
  const ultimos = [...costos]
    .filter(([m, v]) => m < mes && v > 0n)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3);
  if (ultimos.length === 0) return null;
  return entre(
    ultimos.reduce((t, [, v]) => t + v, 0n),
    BigInt(ultimos.length),
  );
}

export interface Proyeccion {
  readonly monto: Money;
  /** The days of use it was read on. */
  readonly dias: number;
}

/**
 * The month's cost at its pace so far: `gasto` over the days up to `al`,
 * carried to the month's last day. None before day 3, nor for a reading of
 * another month.
 */
export function proyeccionDelMes(gasto: Money, al: string, mes: string): Proyeccion | null {
  if (al.slice(0, 7) !== mes) return null;
  const dias = Number(al.slice(8, 10));
  if (dias < DIAS_MINIMOS) return null;
  const delMes = Number(fechaDeCargo(31, mes).slice(8, 10));
  return { monto: entre(gasto * BigInt(delMes), BigInt(dias)), dias };
}

/** A free plan's use as a whole percent of its limit, rounded down. */
export function usoDelPlan(uso: number, limite: number): number {
  if (!(limite > 0)) throw new ServicioInvalidoError('el límite del plan debe ser mayor a cero');
  return Math.floor((uso * 100) / limite);
}

function renovacion(renueva: string, hoy: string): string {
  let anio = Number(renueva.slice(0, 4));
  const dia = Number(renueva.slice(8, 10));
  let fecha = renueva;
  while (fecha < hoy) {
    anio += 1;
    fecha = fechaDeCargo(dia, `${anio}${renueva.slice(4, 7)}`);
  }
  return fecha;
}

/** The next day it charges, from `hoy` on; null for one that does not charge on a day. */
export function proximoCargo(s: Servicio, hoy: string): string | null {
  if (s.estado !== 'activo') return null;
  if (s.cobro === 'anual') return s.renueva === null ? null : renovacion(s.renueva, hoy);
  if ((s.cobro !== 'fijo' && s.cobro !== 'uso') || s.diaCargo === null) return null;
  const este = fechaDeCargo(s.diaCargo, hoy.slice(0, 7));
  return este >= hoy ? este : fechaDeCargo(s.diaCargo, mesMas(hoy.slice(0, 7), 1));
}
