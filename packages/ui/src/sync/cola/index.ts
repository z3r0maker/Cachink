/**
 * Registros por enviar on the phone (M-09, the web's O-27): the outbox as
 * `drainPush` sees it, through the one definition of «por enviar» shared with
 * the web caja and the pill (`unsentRows`, DB3-CAJA-02), grouped the way the
 * operator captured it: a sale with its lines, a gasto, an abono, the
 * inventory ledger folded into one line. Rows the server refused for good are
 * not in it; they wait in «No enviados» and are listed apart.
 */
import type { PendienteCrudo } from '@xangarro/caja/lectura';
import type { XangarroDatabase } from '@xangarro/data';
import { unsentRows } from '@xangarro/sync';
import { agrupar } from './cola-filas';

export async function colaPendiente(db: XangarroDatabase): Promise<readonly PendienteCrudo[]> {
  const rows = await unsentRows(db);
  return agrupar(
    db,
    rows.map((r) => ({ tabla: r.tableName, id: r.rowId, reintento: r.retrying })),
  );
}
