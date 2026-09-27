/**
 * The device half of the snapshot's stock baseline (C-23, ADR-120).
 *
 * `__stock_baseline` is the table the A-11 retention purge already folds old
 * movements into; `sumStock` adds it to the movements on the device. A
 * snapshot replaces it with the server's baseline: the net units of every
 * movement the server holds that is older than the snapshot's cutoff.
 */

import { sql } from 'drizzle-orm';
import type { StockBaselineRow } from '@xangarro/contracts';
import type { XangarroDatabase } from '@xangarro/data';

/** Rows per INSERT — two variables each, far below SQLite's 32,766. */
export const BASELINE_CHUNK = 250;

/** `sumStock`'s own sign rule, so the baseline and the ledger agree. */
const SIGNED = sql.raw(`CASE WHEN t.tipo = 'entrada' THEN t.cantidad ELSE -t.cantidad END`);

/**
 * Start a snapshot's baseline from scratch. The server's baseline counts every
 * old movement it holds — including ones this device already has, when it
 * links again over a database it kept (A-12). Those are subtracted here, so
 * they are not counted twice. A movement the server cannot have counted — not
 * pushed yet, or refused — is left alone: it is still only this device's.
 */
export async function resetStockBaseline(
  db: XangarroDatabase,
  cutoff: string,
  pushHwm: number,
): Promise<void> {
  await db.run(sql`DELETE FROM __stock_baseline`);
  await db.run(sql`INSERT INTO __stock_baseline (producto_id, cantidad)
    SELECT t.producto_id, -SUM(${SIGNED}) FROM inventory_movements t
    WHERE t.deleted_at IS NULL AND t.created_at < ${cutoff}
      AND NOT EXISTS (SELECT 1 FROM __sync_row_status s WHERE s.table_name = 'inventory_movements'
        AND s.row_id = t.id AND s.status <> 'accepted')
      AND NOT EXISTS (SELECT 1 FROM __xangarro_change_log c WHERE c.table_name = 'inventory_movements'
        AND c.row_id = t.id AND c.id > ${pushHwm})
    GROUP BY t.producto_id`);
}

/** Add a page's baseline rows to what the snapshot's earlier pages brought. */
export async function addStockBaseline(
  db: XangarroDatabase,
  rows: readonly StockBaselineRow[],
): Promise<void> {
  for (let i = 0; i < rows.length; i += BASELINE_CHUNK) {
    const values = rows
      .slice(i, i + BASELINE_CHUNK)
      .map((r) => sql`(${r.productoId}, ${r.cantidad})`);
    await db.run(sql`INSERT INTO __stock_baseline (producto_id, cantidad)
      VALUES ${sql.join(values, sql`, `)}
      ON CONFLICT(producto_id) DO UPDATE SET cantidad = cantidad + excluded.cantidad`);
  }
}
