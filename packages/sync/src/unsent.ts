/**
 * What this device captured and the server has not accepted yet — the one
 * definition of «por enviar» (DB3-CAJA-02, ADR-121). The caja's pill, its
 * Registros por enviar and its cierre banner, and the phone's pill, all read
 * it; before, the caja counted `pending` rows only, so a sale captured
 * offline (no status row at all) counted as nothing.
 *
 *   - attempted and not accepted: `pending` (in flight, or its batch failed
 *     as a whole) and `rejected` + retryable (on automatic backoff) — these
 *     are `retrying`;
 *   - never attempted: the change log past the push cursor, coalesced per row
 *     and limited to pushable tables, exactly as `drainPush` will read it.
 *
 * Terminal rejections are not here: they wait for a person (No enviados on
 * the phone, the owner's Sincronización), and each surface shows them apart.
 */

import { and, eq, or } from 'drizzle-orm';
import { DrizzleAppConfigRepository, syncRowStatus, type XangarroDatabase } from '@xangarro/data';
import { coalesce, readChangeSlice } from './outbox-reader.js';
import { SYNC_CONFIG_KEYS } from './sync-keys.js';
import { rowKey } from './table-map.js';

export interface UnsentRow {
  readonly tableName: string;
  readonly rowId: string;
  /** Attempted at least once and on its way again by itself. */
  readonly retrying: boolean;
}

/** A device never holds this many unsent changes; the pusher sends 10 batches a run. */
export const UNSENT_SCAN_LIMIT = 5000;

async function attempted(db: XangarroDatabase, limit: number): Promise<readonly UnsentRow[]> {
  const rows = await db
    .select({ tableName: syncRowStatus.tableName, rowId: syncRowStatus.rowId })
    .from(syncRowStatus)
    .where(
      or(
        eq(syncRowStatus.status, 'pending'),
        and(eq(syncRowStatus.status, 'rejected'), eq(syncRowStatus.retryable, true)),
      ),
    )
    .limit(limit)
    .all();
  return rows.map((r) => ({ ...r, retrying: true }));
}

/** Every unsent (table, row), retries first then the change log's order, each once. */
export async function unsentRows(
  db: XangarroDatabase,
  limit: number = UNSENT_SCAN_LIMIT,
): Promise<readonly UnsentRow[]> {
  const cfg = new DrizzleAppConfigRepository(db);
  const hwm = Number((await cfg.get(SYNC_CONFIG_KEYS.pushHwm)) ?? '0') || 0;
  const fresh = coalesce(await readChangeSlice(db, hwm, limit)).map((c) => ({
    tableName: c.tableName,
    rowId: c.rowId,
    retrying: false,
  }));
  const seen = new Set<string>();
  return [...(await attempted(db, limit)), ...fresh]
    .filter((r) => {
      const k = rowKey(r.tableName, r.rowId);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, limit);
}
