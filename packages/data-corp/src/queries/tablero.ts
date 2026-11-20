import { randomUUID } from 'node:crypto';

import type { CambioDeTarjeta, TableroRepository } from '@xangarro/application/corp';
import type { EventoTarjeta, Tarjeta } from '@xangarro/domain/corp';
import { eq, sql } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { boardCardEvents, boardCards } from '../schema/tablero.js';
import {
  agregarAlPlan,
  agregarAvance,
  crearObjetivo,
  crearTarjeta,
  guardarClausula,
  registrarAviso,
} from './tablero-altas.js';
import { leerTablero, leerTarjeta, type CorpTx } from './tablero-lectura.js';

/**
 * The Tablero's storage (E-20). A write that depends on a card's state takes
 * the card's lock (the one 0016_zz's triggers take), reads the card again and
 * lets the use case decide on that; the triggers refuse what the use cases
 * already do, so a bug in the console cannot freeze, move or approve wrong.
 */
/** The database's clock to the microsecond: events in one millisecond keep their order. */
const ahora = () => sql`clock_timestamp()`;

async function bloquear(tx: CorpTx, id: string): Promise<Tarjeta | null> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`corp.board_card:${id}`}))`);
  return leerTarjeta(tx, id);
}

async function mover(
  db: CorpDb,
  id: string,
  decidir: (t: Tarjeta) => EventoTarjeta,
  founderId: string,
): Promise<EventoTarjeta | null> {
  return db.transaction(async (tx) => {
    const t = await bloquear(tx, id);
    if (t === null) return null;
    const ev = decidir(t);
    await tx.insert(boardCardEvents).values({
      id: randomUUID(),
      cardId: id,
      kind: ev.tipo,
      socio: ev.socio,
      onDate: ev.fecha,
      link: ev.enlace,
      documentId: ev.documentoId,
      reason: ev.motivo,
      accepted: ev.aceptada,
      founderId,
      at: ahora(),
    });
    return ev;
  });
}

async function cambiar(
  db: CorpDb,
  id: string,
  decidir: (t: Tarjeta) => CambioDeTarjeta,
  founderId: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const t = await bloquear(tx, id);
    if (t === null) return false;
    const c = decidir(t);
    await tx
      .update(boardCards)
      .set({
        ...(c.valores === undefined ? {} : { valueF1: c.valores[1], valueF2: c.valores[2] }),
        ...(c.cotizacion === undefined
          ? {}
          : { quote: c.cotizacion.monto, quoteDocumentId: c.cotizacion.documentoId }),
        ...(c.descartadaEn === undefined ? {} : { droppedIn: c.descartadaEn }),
        updatedBy: founderId,
        updatedAt: ahora(),
      })
      .where(eq(boardCards.id, id));
    return true;
  });
}

export function createTableroRepository(db: CorpDb): TableroRepository {
  return {
    leer: () => leerTablero(db),
    crearTarjeta: (t, f) => crearTarjeta(db, t, f),
    mover: (id, decidir, f) => mover(db, id, decidir, f),
    cambiar: (id, decidir, f) => cambiar(db, id, decidir, f),
    agregarAlPlan: (e, f) => agregarAlPlan(db, e, f),
    crearObjetivo: (o, f) => crearObjetivo(db, o, f),
    agregarAvance: (id, a, f) => agregarAvance(db, id, a, f),
    guardarClausula: (c, f) => guardarClausula(db, c, f),
    registrarAviso: (a) => registrarAviso(db, a),
  };
}
