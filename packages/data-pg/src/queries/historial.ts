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

export async function historialSync(tx: Tx, limit = 20): Promise<readonly EventoSync[]> {
  const rows = await tx.execute<Raw>(sql`
    SELECT tipo, dispositivo, registros::int, to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS at
      FROM (
        SELECT 'envio' AS tipo, d.nombre AS dispositivo, count(*) AS registros,
               date_trunc('minute', r.received_at) AS at
          FROM sync_receipts r LEFT JOIN devices d ON d.id = r.device_id
         GROUP BY d.nombre, r.device_id, date_trunc('minute', r.received_at)
        UNION ALL
        SELECT 'rechazo', d.nombre, count(*), date_trunc('minute', j.received_at)
          FROM sync_rejections j LEFT JOIN devices d ON d.id = j.device_id
         GROUP BY d.nombre, j.device_id, date_trunc('minute', j.received_at)
        UNION ALL
        SELECT 'portal', NULL, count(*), date_trunc('minute', l.created_at)
          FROM sync_log l
         WHERE NOT EXISTS (
           SELECT 1 FROM sync_receipts r WHERE r.business_id = l.business_id AND r.seq = l.seq)
         GROUP BY date_trunc('minute', l.created_at)
      ) e
     ORDER BY at DESC, tipo
     LIMIT ${limit}`);
  return [...rows].map((r) => ({ ...r, registros: Number(r.registros) }));
}
