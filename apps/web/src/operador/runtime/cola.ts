/**
 * Registros por enviar, live (O-27): the outbox exactly as `drainPush` sees it,
 * through the one definition of «por enviar» the phone shares (`unsentRows`,
 * DB3-CAJA-02): what the pusher has not reached yet plus what is in flight or
 * waiting a retry. The pill, this screen and the cierre banner all count it.
 * Rows refused for good are not in the queue: they wait in the owner's
 * Sincronización, and Avisos counts them apart.
 */

import { unsentRows } from '@xangarro/sync';

import { agrupar, type Entrada } from './cola-filas';
import type { PendienteCrudo } from '@xangarro/caja/lectura';
import type { Db } from './db-types';

/** Every unsent (table, row), retries first, each once. */
export async function entradasDeCola(db: Db): Promise<readonly Entrada[]> {
  return (await unsentRows(db as never)).map((r) => ({
    tabla: r.tableName,
    id: r.rowId,
    reintento: r.retrying,
  }));
}

/** The queue as the operator thinks of it: a sale with its lines, a gasto, an abono… */
export async function colaPendiente(db: Db): Promise<readonly PendienteCrudo[]> {
  return agrupar(db, await entradasDeCola(db));
}
