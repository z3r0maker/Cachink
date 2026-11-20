import 'server-only';

import type { DatosDelTablero, DocumentoMeta, ObligacionVista } from '@xangarro/application/corp';
import {
  createCierreRepository,
  documentosDe,
  eventosDeCierre,
  importesDeResultados,
  leerTablero,
  listFounders,
  movimientosDeCaja,
} from '@xangarro/data-corp';
import {
  rangoDelResumen,
  type EstadoDelResumen,
  type ImporteResultados,
  type MovimientoCajaConTipo,
} from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import { leerAgenda } from './agenda-lectura';
import { fechaEnMexico } from './fechas';
import { nombresDe, type Nombres } from './socios-view';

/**
 * What Socios › Trimestre reads (E-17, board CD-17b): the ledger's P&L lines
 * and cash movements up to the quarter's last day (or today, while it runs),
 * the Tablero, the quarter's obligations with their evidence, and the day
 * each of its months was closed.
 */
export interface LecturaTrimestre {
  readonly hoy: string;
  readonly trimestre: string;
  readonly rango: {
    readonly desde: string;
    readonly hasta: string;
    readonly estado: EstadoDelResumen;
  };
  readonly importes: readonly ImporteResultados[];
  readonly movs: readonly MovimientoCajaConTipo[];
  readonly tablero: DatosDelTablero;
  readonly nombres: Nombres;
  /** Due inside the quarter, up to today. */
  readonly obligaciones: readonly ObligacionVista[];
  /** By `plantilla~periodo`. */
  readonly documentos: ReadonlyMap<string, readonly DocumentoMeta[]>;
  /** `YYYY-MM` → the day it was closed, Mexico City; null while open. */
  readonly cierres: ReadonlyMap<string, string | null>;
}

const clave = (o: Pick<ObligacionVista, 'plantilla' | 'periodo'>) =>
  `${o.plantilla.id}~${o.periodo}`;

async function cierresDe(db: ReturnType<typeof requireCorpDb>, meses: readonly string[]) {
  const [cerrados, eventos] = await Promise.all([
    createCierreRepository(db).cerrados(),
    eventosDeCierre(db),
  ]);
  return new Map(
    meses.map((mes) => {
      const ultimo = [...(eventos.get(mes) ?? [])].reverse().find((e) => e.kind === 'cerrado');
      return [mes, cerrados.has(mes) && ultimo !== undefined ? fechaEnMexico(ultimo.at) : null];
    }),
  );
}

/** The quarter's months up to its range's end. */
const mesesDe = (desde: string, hasta: string): string[] =>
  [0, 1, 2]
    .map((i) => {
      const d = new Date(`${desde}T12:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + i);
      return d.toISOString().slice(0, 7);
    })
    .filter((m) => m <= hasta.slice(0, 7));

export async function leerTrimestre(trimestre: string, hoy: string): Promise<LecturaTrimestre> {
  const db = requireCorpDb();
  const rango = rangoDelResumen(trimestre, hoy);
  const [importes, movs, tablero, founders, agenda] = await Promise.all([
    importesDeResultados(db, '2000-01-01', rango.hasta),
    movimientosDeCaja(db, rango.hasta),
    leerTablero(db),
    listFounders(db),
    leerAgenda(hoy),
  ]);
  const obligaciones = agenda.vistas.filter(
    (o) => o.vence >= rango.desde && o.vence <= rango.hasta,
  );
  const ids = obligaciones.flatMap((o) => agenda.ids.get(clave(o)) ?? []);
  const porId = await documentosDe(db, ids);
  const documentos = new Map(
    obligaciones.map((o) => [clave(o), porId.get(agenda.ids.get(clave(o)) ?? '') ?? []]),
  );
  return {
    hoy,
    trimestre,
    rango,
    importes,
    movs,
    tablero,
    nombres: nombresDe(founders),
    obligaciones,
    documentos,
    cierres: await cierresDe(db, mesesDe(rango.desde, rango.hasta)),
  };
}
