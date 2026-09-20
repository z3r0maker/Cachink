import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Inicio's «Últimos 30 días» (P-13): ventas and gastos per day, **every** day
 * of the range present — a quiet Sunday is a zero on the line, not a gap the
 * chart would draw straight across. Same rules as `totalsForRange`: deleted
 * rows never count, cancelled sales never count. Money stays bigint centavos.
 * `fecha` is text on both sides of the wire, so it is compared as its first
 * ten characters — a malformed row is left out, never an error for the page.
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
  const rows = await tx.execute<Raw>(sql`
    SELECT to_char(d, 'YYYY-MM-DD') AS fecha,
           coalesce((SELECT sum(s.monto_centavos) FROM sales s
                      WHERE left(s.fecha, 10) = to_char(d, 'YYYY-MM-DD') AND s.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.id = s.ticket_id AND t.cancelled_at IS NOT NULL)), 0)::text AS ventas,
           coalesce((SELECT sum(e.monto_centavos) FROM expenses e
                      WHERE left(e.fecha, 10) = to_char(d, 'YYYY-MM-DD') AND e.deleted_at IS NULL), 0)::text AS gastos
      FROM generate_series(${desde}::date, ${hasta}::date, interval '1 day') AS d
     ORDER BY d`);
  return [...rows].map((r) => ({
    fecha: r.fecha,
    ventas: BigInt(r.ventas),
    gastos: BigInt(r.gastos),
  }));
}
