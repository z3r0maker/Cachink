import 'server-only';

import type { DocumentoMeta } from '@xangarro/application/corp';
import {
  conceptosDe,
  createAgendaRepository,
  listarDocumentos,
  listFounders,
} from '@xangarro/data-corp';
import { plantilla } from '@xangarro/domain/corp';

import { requireCorpDb } from '../db/corp';
import type { Contexto, Vinculo } from './expediente-view';
import { tituloDe } from './obligacion-view';

/**
 * The Expediente's read (E-05): every document's metadata and what each is
 * linked to, the obligation's title or the movement's concept, so the table
 * can say «Agenda · ISR provisional de agosto de 2026».
 */
export interface Expediente {
  readonly docs: readonly DocumentoMeta[];
  readonly contexto: Contexto;
}

export async function leerExpediente(): Promise<Expediente> {
  const db = requireCorpDb();
  const [docs, obligaciones, socios] = await Promise.all([
    listarDocumentos(db),
    createAgendaRepository(db).obligaciones(),
    listFounders(db),
  ]);
  const entryIds = [...new Set(docs.flatMap((d) => (d.entryId === null ? [] : [d.entryId])))];
  const conceptos = await conceptosDe(db, entryIds);
  const deObligacion = obligaciones.flatMap((o): [string, Vinculo][] => {
    const p = plantilla(o.plantillaId);
    if (p === undefined) return [];
    const titulo = tituloDe({ titulo: o.titulo ?? p.titulo, periodo: o.periodo });
    return [[o.id, { texto: `Agenda · ${titulo}`, href: `/empresa/agenda/${p.id}/${o.periodo}` }]];
  });
  const deMovimiento = [...conceptos].map(([id, c]): [string, Vinculo] => [
    id,
    { texto: `Movimiento · ${c.concepto}`, href: `/empresa/movimientos/${id}` },
  ]);
  return {
    docs,
    contexto: {
      obligaciones: new Map(deObligacion),
      movimientos: new Map(deMovimiento),
      socios: new Map(socios.map((s) => [s.id, s.numero])),
    },
  };
}
