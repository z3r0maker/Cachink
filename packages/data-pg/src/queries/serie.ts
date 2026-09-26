import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';
import { fechaEnDias } from './rango-fechas.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Inicio's «Últimos 30 días» (P-13): ventas and gastos per day, **every** day
 * of the range present — a quiet Sunday is a zero on the line, not a gap the
 * chart would draw straight across. Same rules as `totalsForRange`: deleted
 * rows never count, cancelled sales never count. Money stays bigint centavos.
 *
 * One grouped pass per table over a range the `(business_id, fecha)` index
 * serves, then joined to the calendar (audit DB2-QRY-01). It used to be 30
 * days × 2 correlated subqueries, each comparing `left(fecha, 10)` — sixty
 * full-history scans, 8 s on a year-old heavy tenant against a 5 s statement
 * timeout. A timestamped `fecha` counts on its own day, as before.
 */
export interface DiaSerie {
  readonly fecha: string;
  readonly ventas: bigint;
  readonly gastos: bigint;
}

type Raw = { fecha: string; ventas: string; gastos: string };

export async function serieDiaria(
  tx: Tx,
  desde: string,
  hasta: string,
): Promise<readonly DiaSerie[]> {
  if (desde > hasta) return [];
  const rows = await tx.execute<Raw>(sql`
    WITH v AS (
      SELECT left(s.fecha, 10) AS fecha, sum(s.monto_centavos) AS total
        FROM sales s
       WHERE s.deleted_at IS NULL AND ${fechaEnDias(sql`s.fecha`, desde, hasta)}
         AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.id = s.ticket_id AND t.cancelled_at IS NOT NULL)
       GROUP BY 1),
    g AS (
      SELECT left(e.fecha, 10) AS fecha, sum(e.monto_centavos) AS total
        FROM expenses e
       WHERE e.deleted_at IS NULL AND ${fechaEnDias(sql`e.fecha`, desde, hasta)}
       GROUP BY 1)
    SELECT d.fecha, coalesce(v.total, 0)::text AS ventas, coalesce(g.total, 0)::text AS gastos
      FROM (SELECT to_char(d, 'YYYY-MM-DD') AS fecha
              FROM generate_series(${desde}::date, ${hasta}::date, interval '1 day') AS d) d
      LEFT JOIN v ON v.fecha = d.fecha
      LEFT JOIN g ON g.fecha = d.fecha
     ORDER BY d.fecha`);
  return [...rows].map((r) => ({
    fecha: r.fecha,
    ventas: BigInt(r.ventas),
    gastos: BigInt(r.gastos),
  }));
}
