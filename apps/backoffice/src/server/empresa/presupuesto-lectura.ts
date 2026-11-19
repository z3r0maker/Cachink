import 'server-only';

import {
  createRecurringTemplateRepository,
  importesDeResultados,
  listarPresupuestos,
  listarSolicitudes,
  listFounders,
  type CorpDb,
} from '@xangarro/data-corp';
import {
  mesesDelLimite,
  rangoDelTrimestre,
  recurrentesDelMes,
  trimestreAnterior,
  trimestreDe,
  type RecurrenteDelMes,
} from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import { mesesDelTrimestre, type DatosPresupuesto } from './presupuesto-view';

/**
 * What Presupuesto reads (E-22, board CD-15d): Resultados' P&L lines from the
 * previous quarter's first day (or the Límite's three months, if earlier) to
 * today; this quarter's recurring charges from this month on, and which
 * entries came from a template in the three months the averages use; every
 * budget, this quarter's requests, and the founders' names.
 */
async function recurrentes(db: CorpDb, hoy: string, previos: readonly string[]) {
  const repo = createRecurringTemplateRepository(db);
  const mes = hoy.slice(0, 7);
  const meses = mesesDelTrimestre(trimestreDe(hoy)).filter((m) => m >= mes);
  const [todas, registradas, facturadas, anteriores] = await Promise.all([
    repo.list(),
    Promise.all(meses.map((m) => repo.registradasEn(m))),
    repo.facturadasEn(mes),
    Promise.all(previos.map((m) => repo.registradasEn(m))),
  ]);
  const delMes = new Map<string, readonly RecurrenteDelMes[]>(
    meses.map((m, i) => [
      m,
      recurrentesDelMes(
        todas,
        registradas[i] ?? new Map(),
        m,
        hoy,
        m === mes ? facturadas : undefined,
      ),
    ]),
  );
  const ids = new Set(anteriores.flatMap((r) => [...r.values()]));
  return { delMes, ids };
}

export async function leerPresupuesto(hoy: string): Promise<DatosPresupuesto> {
  const db = requireCorpDb();
  const trimestre = trimestreDe(hoy);
  const previos = mesesDelLimite(hoy.slice(0, 7));
  const [desdeAnterior] = rangoDelTrimestre(trimestreAnterior(trimestre));
  const desde = [desdeAnterior, `${previos[0] ?? hoy.slice(0, 7)}-01`].sort()[0] ?? desdeAnterior;
  const meses = new Set(mesesDelTrimestre(trimestre));
  const [importes, rec, presupuestos, solicitudes, founders] = await Promise.all([
    importesDeResultados(db, desde, hoy),
    recurrentes(db, hoy, previos),
    listarPresupuestos(db),
    listarSolicitudes(db),
    listFounders(db),
  ]);
  return {
    hoy,
    importes,
    recurrentes: rec.delMes,
    deRecurrentes: rec.ids,
    presupuestos,
    solicitudes: solicitudes.filter((s) => meses.has(s.periodo)),
    socios: new Map(founders.map((f) => [f.id, f.nombre])),
  };
}
