import { randomUUID } from 'node:crypto';

import type { TableroRepository } from '@xangarro/application/corp';
import { sql } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import {
  boardCards,
  boardClauses,
  boardNotices,
  boardObjectiveProgress,
  boardObjectives,
  boardPlanEvents,
} from '../schema/tablero.js';

/** The Tablero's plain inserts (E-20): rows that depend on no card's state. */
/** The database's clock to the microsecond: events in one millisecond keep their order. */
const ahora = () => sql`clock_timestamp()`;

type Repo = TableroRepository;

export async function crearTarjeta(
  db: CorpDb,
  t: Parameters<Repo['crearTarjeta']>[0],
  founderId: string,
) {
  const id = randomUUID();
  const at = ahora();
  await db.insert(boardCards).values({
    id,
    quarter: t.trimestre,
    kind: t.tipo,
    title: t.titulo,
    criterion: t.criterio,
    owner: t.responsable,
    due: t.vence,
    objectiveId: t.objetivoId,
    valueF1: t.valores[1],
    valueF2: t.valores[2],
    createdBy: founderId,
    createdAt: at,
    updatedBy: founderId,
    updatedAt: at,
  });
  return id;
}

export async function crearObjetivo(
  db: CorpDb,
  o: Parameters<Repo['crearObjetivo']>[0],
  founderId: string,
) {
  const id = randomUUID();
  await db.insert(boardObjectives).values({
    id,
    quarter: o.trimestre,
    who: o.quien,
    title: o.titulo,
    goal: o.meta,
    unit: o.unidad,
    createdBy: founderId,
    createdAt: ahora(),
  });
  return id;
}

export async function agregarAlPlan(
  db: CorpDb,
  e: Parameters<Repo['agregarAlPlan']>[0],
  founderId: string,
) {
  await db.insert(boardPlanEvents).values({
    id: randomUUID(),
    quarter: e.trimestre,
    kind: e.tipo,
    socio: e.socio,
    onDate: e.fecha,
    founderId,
    at: ahora(),
  });
}

export async function agregarAvance(
  db: CorpDb,
  objectiveId: string,
  a: Parameters<Repo['agregarAvance']>[1],
  founderId: string,
) {
  await db.insert(boardObjectiveProgress).values({
    id: randomUUID(),
    objectiveId,
    value: a.valor,
    onDate: a.fecha,
    socio: a.socio,
    founderId,
    at: ahora(),
  });
}

export async function guardarClausula(
  db: CorpDb,
  c: Parameters<Repo['guardarClausula']>[0],
  founderId: string,
) {
  const id = randomUUID();
  await db
    .insert(boardClauses)
    .values({ id, number: c.numero, body: c.texto, founderId, at: ahora() });
  return id;
}

export async function registrarAviso(db: CorpDb, a: Parameters<Repo['registrarAviso']>[0]) {
  await db.insert(boardNotices).values({
    id: randomUUID(),
    quarter: a.trimestre,
    toSocio: a.para,
    sentOn: a.enviadoEl,
    clauseId: a.clausulaId,
    documentId: a.documentoId,
    founderId: a.founderId,
    at: ahora(),
  });
}
