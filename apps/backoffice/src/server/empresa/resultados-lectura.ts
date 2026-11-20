import 'server-only';

import { importesDeResultados, leerTablero } from '@xangarro/data-corp';
import {
  costoDeSudor,
  estadoDeResultados,
  mesesHasta,
  periodoAnterior,
  puenteEbitda,
  tendencia,
  type CostoDeSudor,
  type EstadoResultados,
  type MesDeTendencia,
  type PuenteEbitda,
} from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import type { VistaResultados } from './resultados-view';

/** Months in «Ingresos contra costos» (board CD-07). */
export const MESES_TENDENCIA = 6;

export interface DatosResultados {
  readonly actual: EstadoResultados;
  readonly anterior: EstadoResultados;
  readonly puente: PuenteEbitda;
  readonly tendencia: readonly MesDeTendencia[];
  /** The Tablero's accepted value finished in the period (the «Costo de sudor» memo). */
  readonly sudor: CostoDeSudor;
}

/**
 * What Resultados reads (E-12): the ledger's P&L lines from the earliest day
 * any of its parts needs (the previous period, the six months of the trend)
 * to the period's last, then the domain does the rest.
 */
export async function leerResultados(v: VistaResultados, hoy: string): Promise<DatosResultados> {
  const previo = periodoAnterior(v.periodo);
  const ultimoMes = v.periodo.hasta.slice(0, 7);
  const primerMes = mesesHasta(ultimoMes, MESES_TENDENCIA)[0] ?? ultimoMes;
  const desde = [`${primerMes}-01`, previo.desde].sort()[0] ?? previo.desde;
  const db = requireCorpDb();
  const [importes, tablero] = await Promise.all([
    importesDeResultados(db, desde, v.periodo.hasta),
    leerTablero(db),
  ]);
  const actual = estadoDeResultados(importes, v.periodo, v.base);
  const anterior = estadoDeResultados(importes, previo, v.base);
  return {
    actual,
    anterior,
    puente: puenteEbitda(actual, anterior),
    tendencia: tendencia(importes, ultimoMes, MESES_TENDENCIA, v.base),
    sudor: costoDeSudor(tablero.tarjetas, v.periodo, hoy),
  };
}
