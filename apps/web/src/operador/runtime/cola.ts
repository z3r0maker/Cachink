/**
 * Registros por enviar, live (O-27): the outbox exactly as `drainPush` sees it.
 * What the pusher has not reached yet (the change log past `pushHwm`, coalesced
 * per row and limited to pushable tables) plus what is in flight or waiting a
 * retry (`__sync_row_status` pending, or rejected and retryable). Rows refused
 * for good are not in the queue: they wait in the owner's Sincronización.
 */

import { sql } from 'drizzle-orm';
import { DrizzleAppConfigRepository } from '@xangarro/data';
import { coalesce, readChangeSlice, SYNC_CONFIG_KEYS } from '@xangarro/sync';

import { agrupar, type Entrada } from './cola-filas';
import type { PendienteCrudo } from './cola-shapes';
import type { Db } from './db-types';

/** A register never holds this many unsent changes; the pusher sends 10 batches a run. */
const TOPE = 5000;

async function enVuelo(db: Db): Promise<readonly Entrada[]> {
  return (await db.all(
    sql`SELECT table_name AS tabla, row_id AS id FROM __sync_row_status
        WHERE status = 'pending' OR (status = 'rejected' AND retryable = 1)`,
  )) as Entrada[];
}

/** Every unsent (table, row), oldest first, each once. */
export async function entradasDeCola(db: Db): Promise<readonly Entrada[]> {
  const cfg = new DrizzleAppConfigRepository(db as never);
  const hwm = Number((await cfg.get(SYNC_CONFIG_KEYS.pushHwm)) ?? '0') || 0;
  const nuevas = coalesce(await readChangeSlice(db as never, hwm, TOPE)).map((c) => ({
    tabla: c.tableName,
    id: c.rowId,
  }));
  const vistos = new Set<string>();
  return [...(await enVuelo(db)), ...nuevas].filter((e) => {
    const k = `${e.tabla}:${e.id}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

/** The queue as the operator thinks of it: a sale with its lines, a gasto, an abono… */
export async function colaPendiente(db: Db): Promise<readonly PendienteCrudo[]> {
  return agrupar(db, await entradasDeCola(db));
}
