import 'server-only';

import {
  lineasDeCuenta,
  listFounders,
  listPartnerEntries,
  sumasAl,
  type CorpDb,
} from '@xangarro/data-corp';
import { balanceGeneral, cuentasDeSocios, type Balance } from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import {
  filasSocios,
  movimientosDeCuenta,
  type Desconocida,
  type FilaSocioBalance,
} from './balance-cuadre-view';
import type { VistaBalance } from './balance-view';
import { sumarDias } from './fechas';
import { nombresDe } from './socios-view';

export interface DatosBalance {
  readonly actual: Balance;
  readonly anterior: Balance;
  /** The first movement in an account outside the chart, when there is one. */
  readonly desconocida: Desconocida | null;
  readonly socios: readonly FilaSocioBalance[];
  /** The open account's movements of the month, or null when none is open. */
  readonly abiertos: ReturnType<typeof movimientosDeCuenta> | null;
}

async function desconocidaDe(db: CorpDb, b: Balance, hasta: string): Promise<Desconocida | null> {
  const primera = b.sinClasificar[0];
  if (primera === undefined) return null;
  const lineas = await lineasDeCuenta(db, primera.cuenta, '0001-01-01', hasta);
  const linea = lineas.find((l) => l.entryId === primera.entryId) ?? lineas[0];
  return linea === undefined
    ? null
    : { fecha: linea.fecha, concepto: linea.concepto, cuenta: primera.cuenta };
}

/**
 * What Balance reads (E-12): the ledger summed to the sheet's day and to the
 * previous month's last, the partners' money to that day, and the open
 * account's month. The domain does the sheet; the view words it.
 */
export async function leerBalance(v: VistaBalance): Promise<DatosBalance> {
  const db = requireCorpDb();
  const [sumas, previas, founders, partner, lineas] = await Promise.all([
    sumasAl(db, v.hasta),
    sumasAl(db, v.hastaAnterior),
    listFounders(db),
    listPartnerEntries(db, { hasta: sumarDias(v.hasta, 1) }),
    v.abrir === null ? null : lineasDeCuenta(db, v.abrir, `${v.mes}-01`, v.hasta),
  ]);
  const actual = balanceGeneral(sumas);
  return {
    actual,
    anterior: balanceGeneral(previas),
    desconocida: await desconocidaDe(db, actual, v.hasta),
    socios: filasSocios(cuentasDeSocios(partner), nombresDe(founders)),
    abiertos: v.abrir === null || lineas === null ? null : movimientosDeCuenta(v.abrir, lineas),
  };
}
