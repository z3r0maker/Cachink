import type { Money } from '../../money/index.js';
import { ultimoDia } from '../cierre/reglas.js';
import { MontoInvalidoError } from '../ledger/errors.js';
import type { MovementKind } from '../ledger/movements.js';
import { cajaAl, type Autonomia, type MovimientoCaja } from './autonomia.js';

/**
 * Caja (E-23, board CD-15c): cash at each month's close, its projection under
 * the Resumen's three scenarios, the minimum reserve, and what moved it in a
 * month, by kind. The averages are `autonomia`'s, so both screens agree. Pure.
 */
export const RESERVA_MESES = 3n;

/** Three months of what goes out each month. */
export const reservaMinima = (sale: Money): Money => sale * RESERVA_MESES;

/** A partner loan can be repaid today without the cash going below the reserve. */
export const devolverCabe = (caja: Money, reserva: Money, saldo: Money): boolean =>
  caja - saldo >= reserva;

export interface CajaDelMes {
  readonly mes: string;
  readonly caja: Money;
}

/** Cash at each month's last day; the month running is read at `hoy`. */
export function cajaAlCierre(
  movs: readonly MovimientoCaja[],
  meses: readonly string[],
  hoy: string,
): readonly CajaDelMes[] {
  return meses.map((mes) => {
    const fin = ultimoDia(mes);
    return { mes, caja: cajaAl(movs, fin < hoy ? fin : hoy) };
  });
}

const siguiente = (mes: string): string => {
  const t = Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5, 7));
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
};

/** The months from the first with money to today's, oldest first. */
export function mesesDeHistoria(movs: readonly MovimientoCaja[], hoy: string): readonly string[] {
  const primero = movs
    .filter((m) => m.fecha <= hoy)
    .map((m) => m.fecha.slice(0, 7))
    .sort()[0];
  if (primero === undefined) return [];
  const out: string[] = [];
  for (let m = primero; m <= hoy.slice(0, 7); m = siguiente(m)) out.push(m);
  return out;
}

export type Escenario = 'mantener' | 'equilibrio' | 'detener';

/**
 * Cash at the close of each of the next `meses` months: today's net kept
 * («Si los ingresos se mantienen»), flat («Si bajan al equilibrio»), or only
 * what goes out («Si se detuvieran hoy»). Never below zero.
 */
export function proyeccion(a: Autonomia, escenario: Escenario, meses: number): readonly Money[] {
  if (!Number.isInteger(meses) || meses < 0) {
    throw new MontoInvalidoError('la proyección necesita un número de meses');
  }
  const porMes = escenario === 'mantener' ? a.neto : escenario === 'equilibrio' ? 0n : -a.sale;
  return Array.from({ length: meses }, (_, i) => {
    const v = a.caja + porMes * BigInt(i + 1);
    return v < 0n ? 0n : v;
  });
}

export type TipoFlujo = 'cobros' | 'gastos' | 'impuestos' | 'comisiones' | 'otros';

export interface MovimientoCajaConTipo extends MovimientoCaja {
  readonly kind: MovementKind;
}

export interface FlujoPorTipo {
  /** Each kind's signed total, in the board's order, only the kinds the month had. */
  readonly tipos: readonly { readonly tipo: TipoFlujo; readonly importe: Money }[];
  /** The operation's change: every kind but partner money. */
  readonly operacion: Money;
  /** Partner money in the month, apart. */
  readonly socios: Money;
}

const TIPO: Partial<Record<MovementKind, TipoFlujo>> = {
  cobro: 'cobros',
  gasto: 'gastos',
  pago_proveedor: 'gastos',
  pago_impuestos: 'impuestos',
  comision_bancaria: 'comisiones',
  payout: 'comisiones',
};

const ORDEN: readonly TipoFlujo[] = ['cobros', 'gastos', 'impuestos', 'comisiones', 'otros'];

export function flujoPorTipo(movs: readonly MovimientoCajaConTipo[], mes: string): FlujoPorTipo {
  const sumas = new Map<TipoFlujo, Money>();
  let socios = 0n;
  for (const m of movs) {
    if (m.fecha.slice(0, 7) !== mes) continue;
    if (m.socios) {
      socios += m.importe;
      continue;
    }
    const tipo = TIPO[m.kind] ?? 'otros';
    sumas.set(tipo, (sumas.get(tipo) ?? 0n) + m.importe);
  }
  const tipos = ORDEN.flatMap((tipo) => {
    const importe = sumas.get(tipo);
    return importe === undefined ? [] : [{ tipo, importe }];
  });
  return { tipos, operacion: tipos.reduce((t, x) => t + x.importe, 0n), socios };
}
