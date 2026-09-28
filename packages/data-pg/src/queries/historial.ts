import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Sincronización's «Historial» (P-11), derived — no new table. Three kinds of
 * event, each grouped per device per minute so a 40-row push is one line:
 *
 * - `envio`: rows a phone pushed and the server accepted (`sync_receipts`);
 * - `rechazo`: rows it refused, kept for the owner (`sync_rejections`);
 * - `portal`: changes made in the portal for the phones to pull — `sync_log`
 *   entries no receipt accounts for.
 *
 * Receipts keep only a row's latest push, so a row re-sent later moves to its
 * newest minute; for a recent-activity log that is the honest reading.
 */
export interface EventoSync {
  readonly tipo: 'envio' | 'rechazo' | 'portal';
  /** The device's name; null for portal changes. */
  readonly dispositivo: string | null;
  readonly registros: number;
  /** ISO timestamp of the minute. */
  readonly at: string;
}

type Raw = {
  tipo: EventoSync['tipo'];
  dispositivo: string | null;
  registros: number;
  at: string;
};

/** How far back Historial looks: a recent-activity log, not an archive. */
export const HISTORIAL_DIAS = 30;

/**
 * Bounded to the last `HISTORIAL_DIAS` days on all three sources (897 →
 * 127 ms on the audit's whale). Receipts are one row per pushed row, kept
 * forever (DB2-SYNC-03), so an unbounded read grew with every sale.
 *
 * «Portal» is a log entry with no receipt at the **same** seq. That anti-join
 * used to match receipts on `(business_id, seq)`, which no index covers, so it
 * hashed the tenant's every receipt. The receipt of a pushed row is keyed by
 * the row itself — `(business_id, table_name, row_id)`, the primary key — and
 * carries the seq it was accepted at, so the test is one primary-key probe per
 * log entry in the window. It is written as a scalar subquery on purpose: a
 * NOT EXISTS becomes an anti-join, and with RLS hiding the tenant's size the
 * planner hashed all 1.4M receipts again (660 ms against 118 ms measured).
 *
 * The log's window is cut by seq, not by `created_at` (which no index
 * covers): seq and `created_at` rise together, so the newest entry older than
 * the window — found walking the primary key backwards — marks where it
 * starts, and the scan runs over the window only.
 */
export async function historialSync(tx: Tx, limit = 20): Promise<readonly EventoSync[]> {
  const desde = sql`now() - make_interval(days => ${HISTORIAL_DIAS})`;
  const rows = await tx.execute<Raw>(sql`
    SELECT tipo, dispositivo, registros::int, to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS at
      FROM (
        SELECT 'envio' AS tipo, d.nombre AS dispositivo, count(*) AS registros,
               date_trunc('minute', r.received_at) AS at
          FROM sync_receipts r LEFT JOIN devices d ON d.id = r.device_id
         WHERE r.received_at >= ${desde}
         GROUP BY d.nombre, r.device_id, date_trunc('minute', r.received_at)
        UNION ALL
        SELECT 'rechazo', d.nombre, count(*), date_trunc('minute', j.received_at)
          FROM sync_rejections j LEFT JOIN devices d ON d.id = j.device_id
         WHERE j.received_at >= ${desde}
         GROUP BY d.nombre, j.device_id, date_trunc('minute', j.received_at)
        UNION ALL
        SELECT 'portal', NULL, count(*), date_trunc('minute', l.created_at)
          FROM sync_log l
         WHERE l.seq > (SELECT coalesce(max(o.seq), 0)
                          FROM (SELECT o.seq FROM sync_log o
                                 WHERE o.created_at < ${desde}
                                 ORDER BY o.seq DESC LIMIT 1) o)
           AND l.created_at >= ${desde}
           AND (SELECT r.seq FROM sync_receipts r
                 WHERE r.business_id = l.business_id AND r.table_name = l.table_name
                   AND r.row_id = l.row_id) IS DISTINCT FROM l.seq
         GROUP BY date_trunc('minute', l.created_at)
      ) e
     ORDER BY at DESC, tipo
     LIMIT ${limit}`);
  return [...rows].map((r) => ({ ...r, registros: Number(r.registros) }));
}
