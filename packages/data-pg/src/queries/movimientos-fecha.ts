import type { Db } from '../client.js';
import type { FiltroMovimientos } from './movimientos-filtro.js';
import { contarMovimientos } from './movimientos-resumen.js';
import { diaSiguiente } from './rango-fechas.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * «Ir a fecha» (DS-01): the 1-based page, `porPagina` rows a page, that holds
 * the newest row on `fecha` under `filtro`.
 *
 * Pages are newest first (`fecha DESC, id DESC`), so the rows before the day
 * are exactly the rows on later days: their count, cut into pages, is the
 * answer — the same count the pager's «de N» uses, with the period's start
 * moved to the day after. A day with no rows lands where it would sit, on the
 * page of the next older row; a day before every row can point one page past
 * the last, and the loader clamps it as it clamps any page.
 *
 * Throws a `TypeError` for anything that is not `YYYY-MM-DD` (`fechaEnDias`).
 */
export async function paginaDeFecha(
  tx: Tx,
  kind: 'venta' | 'gasto',
  filtro: FiltroMovimientos,
  fecha: string,
  porPagina: number,
): Promise<number> {
  const despues = diaSiguiente(fecha);
  if (despues === null) return 1;
  const desde =
    filtro.desde !== undefined && filtro.desde !== null && filtro.desde > despues
      ? filtro.desde
      : despues;
  const posteriores = await contarMovimientos(tx, kind, { ...filtro, desde });
  return Math.floor(posteriores / Math.max(1, Math.trunc(porPagina))) + 1;
}
