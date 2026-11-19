import 'server-only';

import {
  createAgendaRepository,
  createCorpLedgerRepository,
  createDeclaracionRepository,
  createDocumentRepository,
  fuentesFiscales,
} from '@xangarro/data-corp';
import {
  estimadosDeImpuestos,
  mesesFiscales,
  PLANTILLA_IMPUESTOS,
  refPagoImpuestos,
} from '@xangarro/domain/corp';

import { almacenParaNuevos } from '../blobs';
import { requireCorpDb } from '../db/corp';
import type { DatosImpuestos } from './impuestos-view';

function primerMes(inscripcion: string | null, mes: string): string {
  const desde = inscripcion?.slice(0, 7) ?? `${mes.slice(0, 4)}-01`;
  return desde > mes ? mes : desde;
}

/**
 * What Impuestos reads (E-13): the ledger's cash-basis figures from the
 * company's first month (its SAT registration; January without one) to the
 * month on screen, the contador's declarations, the Agenda's «ISR e IVA» of
 * each month, the month's papers and its payment. The domain estimates.
 */
export async function leerImpuestos(mes: string, hoy: string): Promise<DatosImpuestos> {
  const db = requireCorpDb();
  const agenda = createAgendaRepository(db);
  const desde = primerMes(await agenda.inscripcionRfc(), mes);
  const [fuentes, declaradas, guardadas, pago] = await Promise.all([
    fuentesFiscales(db, desde, mes),
    createDeclaracionRepository(db).lista(desde, mes),
    agenda.obligaciones(),
    createCorpLedgerRepository(db).findBySource('manual', refPagoImpuestos(mes)),
  ]);
  const declaraciones = new Map(declaradas.map((d) => [d.periodo, d]));
  const obligaciones = new Map(
    guardadas.filter((o) => o.plantillaId === PLANTILLA_IMPUESTOS).map((o) => [o.periodo, o]),
  );
  const delMes = obligaciones.get(mes);
  const papeles =
    delMes === undefined
      ? []
      : await createDocumentRepository(db, almacenParaNuevos(db)).porObligacion(delMes.id);
  const meses = mesesFiscales(fuentes);
  const estimados = estimadosDeImpuestos(meses, declaraciones);
  return { mes, hoy, meses, estimados, declaraciones, obligaciones, papeles, pago };
}
