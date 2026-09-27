import { sql } from 'drizzle-orm';

import type { IsoDate } from '@xangarro/domain';

import type { Db } from '../client.js';

/**
 * The capacidades' lifetime counts (P-26, ADR-115), split out of `asesor.ts`
 * only to keep that file under the §2.6 ceiling.
 */
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

const SIN_CONTEOS = {
  dias_con_venta: 0,
  dias_con_movimiento: 0,
  primer_dia: null,
  compras: 0,
  cortes: 0,
  meses_con_gasto: 0,
} as const;

/** The counts as `calcularCapacidades` wants them. */
export function contarCapacidades(
  hoy: IsoDate,
  conteos: Awaited<ReturnType<typeof conteosAsesor>>,
) {
  // One fallback, not seven: `?? 0` per field put this function over the §2.6
  // complexity ceiling for no gain, since the row is present or it is not.
  const c = conteos ?? SIN_CONTEOS;
  return {
    hoy,
    diasConVenta: Number(c.dias_con_venta),
    diasConMovimiento: Number(c.dias_con_movimiento),
    diasDeHistorial: diasDesde(c.primer_dia, hoy),
    compras: Number(c.compras),
    cortes: Number(c.cortes),
    mesesConGasto: Number(c.meses_con_gasto),
  };
}

/**
 * The capacidades' lifetime counts, in one row.
 *
 * Two of them are **maxima over a group, not estate-wide totals**, because the
 * insights they predict are per-product and per-category:
 * `costosQueSubieron` needs two entradas **of one product**, and
 * `gastosFueraDeLoNormal` needs three prior months **of one category**. Counting
 * every entrada, or every month any egreso exists, unlocks a capacidad while the
 * insight it promises still computes nothing — and after ADR-113 an unlocked
 * capacidad is what lets a Diagnóstico section assert a finding.
 *
 * `meses_con_gasto` excludes the current month for the same reason: the baseline
 * the insight averages is the months *before* this one.
 */
export async function conteosAsesor(tx: Tx, hoy: IsoDate) {
  const r = await tx.execute<{
    dias_con_venta: number;
    dias_con_movimiento: number;
    primer_dia: string | null;
    compras: number;
    cortes: number;
    meses_con_gasto: number;
  }>(sql`
    SELECT (SELECT count(DISTINCT left(s.fecha, 10)) FROM sales s
             WHERE s.deleted_at IS NULL
               AND NOT EXISTS (SELECT 1 FROM tickets t
                                WHERE t.id = s.ticket_id AND t.cancelled_at IS NOT NULL))
             AS dias_con_venta,
           (SELECT count(DISTINCT left(im.fecha, 10)) FROM inventory_movements im
             WHERE im.deleted_at IS NULL) AS dias_con_movimiento,
           (SELECT min(d) FROM (
              SELECT min(left(s.fecha, 10)) AS d FROM sales s
               WHERE s.deleted_at IS NULL
                 AND NOT EXISTS (SELECT 1 FROM tickets t
                                  WHERE t.id = s.ticket_id AND t.cancelled_at IS NOT NULL)
              UNION ALL
              SELECT min(left(fecha, 10)) FROM expenses WHERE deleted_at IS NULL) t) AS primer_dia,
           (SELECT coalesce(max(n), 0) FROM (
              SELECT count(*) AS n FROM inventory_movements
               WHERE deleted_at IS NULL AND tipo = 'entrada'
               GROUP BY producto_id) t) AS compras,
           (SELECT count(*) FROM day_closes WHERE deleted_at IS NULL) AS cortes,
           (SELECT coalesce(max(n), 0) FROM (
              SELECT count(DISTINCT left(e.fecha, 7)) AS n FROM expenses e
               WHERE e.deleted_at IS NULL
                 AND left(e.fecha, 7) <> ${hoy.slice(0, 7)}
               GROUP BY e.categoria) t) AS meses_con_gasto`);
  return r[0];
}

function diasDesde(primerDia: string | null, hoy: IsoDate): number {
  if (primerDia === null) return 0;
  const ms = Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${primerDia}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}
