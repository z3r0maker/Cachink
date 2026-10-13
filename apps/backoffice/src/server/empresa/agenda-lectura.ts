import 'server-only';

import {
  agendaDe,
  vistaDe,
  type DocumentoMeta,
  type ObligacionVista,
} from '@xangarro/application/corp';
import { createAgendaRepository, documentosDe } from '@xangarro/data-corp';
import { CATALOGO, esRecurrente, plantilla } from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import { sumarDias } from './fechas';

/**
 * The Agenda as every «Empresa» screen and the reminders read it (E-04):
 * the registration, the computed and stored obligations up to six months
 * ahead, and the row id of each stored one.
 */
export interface Agenda {
  readonly inscripcion: string | null;
  readonly vistas: readonly ObligacionVista[];
  /** `plantilla~periodo` → the stored row's id. */
  readonly ids: ReadonlyMap<string, string>;
}

export const HORIZONTE_DIAS = 183;

export interface DetalleObligacion {
  readonly vista: ObligacionVista;
  readonly documentos: readonly DocumentoMeta[];
}

/**
 * One obligation's page: null when the template is unknown or exempt, the
 * period is not one its rule reads, a recurring period precedes the SAT
 * registration, or a one-off was never added.
 */
export async function leerObligacion(
  plantillaId: string,
  periodo: string,
): Promise<DetalleObligacion | null> {
  const p = plantilla(plantillaId);
  if (p === undefined || p.exenta !== null) return null;
  const db = requireCorpDb();
  const agenda = createAgendaRepository(db);
  const [inscripcion, guardada] = await Promise.all([
    agenda.inscripcionRfc(),
    agenda.buscar(p.id, periodo),
  ]);
  if (esRecurrente(p)) {
    if (inscripcion === null || periodo < inscripcion.slice(0, periodo.length)) return null;
  } else if (guardada === null) {
    return null;
  }
  let vista: ObligacionVista;
  try {
    vista = vistaDe(p, periodo, guardada ?? undefined);
  } catch {
    return null;
  }
  const docs = guardada === null ? new Map() : await documentosDe(db, [guardada.id]);
  return { vista, documentos: guardada === null ? [] : (docs.get(guardada.id) ?? []) };
}

export async function leerAgenda(hoy: string): Promise<Agenda> {
  const agenda = createAgendaRepository(requireCorpDb());
  const [inscripcion, guardadas] = await Promise.all([
    agenda.inscripcionRfc(),
    agenda.obligaciones(),
  ]);
  return {
    inscripcion,
    vistas: agendaDe({
      catalogo: CATALOGO,
      inscripcion,
      guardadas,
      hasta: sumarDias(hoy, HORIZONTE_DIAS),
    }),
    ids: new Map(guardadas.map((g) => [`${g.plantillaId}~${g.periodo}`, g.id])),
  };
}
