import type { AvisoGuardado, ClausulaGuardada, DatosDelTablero } from '@xangarro/application/corp';
import type {
  EventoPlan,
  EventoTarjeta,
  Objetivo,
  Socio,
  Tarjeta,
  TipoEventoPlan,
} from '@xangarro/domain/corp';
import { asc, desc, eq } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import {
  boardCardEvents,
  boardCards,
  boardClauses,
  boardNotices,
  boardObjectiveProgress,
  boardObjectives,
  boardPlanEvents,
} from '../schema/tablero.js';

/**
 * The Tablero as rows (E-20). Amounts are parsed, never asserted (ADR-094):
 * a column that does not come back as bigint is an error, not a value.
 */
/** The connection, or a transaction open on it. */
export type CorpTx = Parameters<Parameters<CorpDb['transaction']>[0]>[0];
type Lector = CorpDb | CorpTx;

export function socioDe(n: number | null, que: string): Socio {
  if (n !== 1 && n !== 2) throw new Error(`corp tablero: ${que} is no partner`);
  return n;
}

const montoDe = (v: unknown, que: string): bigint | null => {
  if (v === null) return null;
  if (typeof v !== 'bigint') throw new Error(`corp tablero: ${que} is not bigint`);
  return v;
};

type FilaEvento = typeof boardCardEvents.$inferSelect;
type FilaTarjeta = typeof boardCards.$inferSelect;

const eventoDe = (e: FilaEvento): EventoTarjeta => ({
  tipo: e.kind,
  socio: socioDe(e.socio, `event ${e.id}`),
  fecha: e.onDate,
  enlace: e.link,
  documentoId: e.documentId,
  motivo: e.reason,
  aceptada: e.accepted,
});

export function tarjetaDe(t: FilaTarjeta, eventos: readonly FilaEvento[]): Tarjeta {
  return {
    id: t.id,
    trimestre: t.quarter,
    tipo: t.kind,
    titulo: t.title,
    criterio: t.criterion,
    responsable: socioDe(t.owner, `owner of ${t.id}`),
    vence: t.due,
    objetivoId: t.objectiveId,
    valores: {
      1: montoDe(t.valueF1, `value_f1 of ${t.id}`),
      2: montoDe(t.valueF2, `value_f2 of ${t.id}`),
    },
    cotizacion: montoDe(t.quote, `quote of ${t.id}`),
    cotizacionDocId: t.quoteDocumentId,
    descartadaEn: t.droppedIn,
    eventos: eventos.filter((e) => e.cardId === t.id).map(eventoDe),
  };
}

/** One card and its events, read inside the caller's transaction. */
export async function leerTarjeta(tx: Lector, id: string): Promise<Tarjeta | null> {
  const [t] = await tx.select().from(boardCards).where(eq(boardCards.id, id));
  if (t === undefined) return null;
  const eventos = await tx
    .select()
    .from(boardCardEvents)
    .where(eq(boardCardEvents.cardId, id))
    .orderBy(asc(boardCardEvents.at), asc(boardCardEvents.id));
  return tarjetaDe(t, eventos);
}

async function objetivos(db: Lector): Promise<Objetivo[]> {
  const [os, avances] = await Promise.all([
    db.select().from(boardObjectives).orderBy(asc(boardObjectives.createdAt)),
    db
      .select()
      .from(boardObjectiveProgress)
      .orderBy(asc(boardObjectiveProgress.onDate), asc(boardObjectiveProgress.at)),
  ]);
  return os.map((o) => ({
    id: o.id,
    trimestre: o.quarter,
    quien: o.who === null ? null : socioDe(o.who, `objective ${o.id}`),
    titulo: o.title,
    meta: o.goal,
    unidad: o.unit,
    avances: avances
      .filter((a) => a.objectiveId === o.id)
      .map((a) => ({
        valor: a.value,
        fecha: a.onDate,
        socio: socioDe(a.socio, `progress ${a.id}`),
      })),
  }));
}

async function planes(db: Lector): Promise<EventoPlan[]> {
  const rows = await db
    .select()
    .from(boardPlanEvents)
    .orderBy(asc(boardPlanEvents.at), asc(boardPlanEvents.id));
  return rows.map((p) => ({
    trimestre: p.quarter,
    tipo: p.kind satisfies TipoEventoPlan,
    socio: socioDe(p.socio, `plan event ${p.id}`),
    fecha: p.onDate,
  }));
}

async function clausula(db: Lector): Promise<ClausulaGuardada | null> {
  const [c] = await db.select().from(boardClauses).orderBy(desc(boardClauses.at)).limit(1);
  return c === undefined ? null : { id: c.id, numero: c.number, texto: c.body, at: c.at };
}

async function avisos(db: Lector): Promise<AvisoGuardado[]> {
  const rows = await db.select().from(boardNotices).orderBy(asc(boardNotices.at));
  return rows.map((a) => ({
    trimestre: a.quarter,
    para: socioDe(a.toSocio, `notice ${a.id}`),
    enviadoEl: a.sentOn,
    clausulaId: a.clauseId,
    documentoId: a.documentId,
    founderId: a.founderId,
  }));
}

export async function leerTablero(db: CorpDb): Promise<DatosDelTablero> {
  const [cards, eventos, p, o, c, a] = await Promise.all([
    db.select().from(boardCards).orderBy(asc(boardCards.createdAt), asc(boardCards.id)),
    db.select().from(boardCardEvents).orderBy(asc(boardCardEvents.at), asc(boardCardEvents.id)),
    planes(db),
    objetivos(db),
    clausula(db),
    avisos(db),
  ]);
  return {
    tarjetas: cards.map((t) => tarjetaDe(t, eventos)),
    planes: p,
    objetivos: o,
    clausula: c,
    avisos: a,
  };
}
