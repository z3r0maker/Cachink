/**
 * The ledger lists behind Ventas y gastos (B-3).
 *
 * Split out of `lists.ts` when the attribution joins — the operator through
 * the shift, the device by the row's own `device_id` — pushed that file past
 * its line budget. The Productos lists stayed there. Pages only: the screen's
 * counter and KPIs come from `resumenMovimientos`, not from measuring rows.
 */

import { sql } from 'drizzle-orm';

import { cajaTurnos } from '../schema/caja.js';
import { expenses, sales, tickets } from '../schema/ledger.js';
import { devices } from '../schema/portal.js';
import { users } from '../schema/tenant.js';
import type { Db } from '../client.js';
import {
  acotar,
  condiciones,
  type FiltroMovimientos,
  type PaginaMovimientos,
} from './movimientos-filtro.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

const big = (v: unknown): bigint => (v === null || v === undefined ? 0n : BigInt(String(v)));

export interface MovimientoRow {
  readonly id: string;
  readonly kind: 'venta' | 'gasto';
  readonly fecha: string;
  /** `HH:MM`, when the row carries one — the design stacks it under the date. */
  readonly hora: string;
  readonly concepto: string;
  readonly clasificacion: string;
  readonly amount: bigint;
  readonly cancelada: boolean;
  /**
   * Who captured it and from what: the operator through the shift the ticket
   * belongs to (B-3), the device from the row's own `device_id`. A row
   * captured in the portal has neither, and says «—».
   */
  readonly operador: string | null;
  readonly dispositivo: string | null;
  /**
   * The ticket a venta line belongs to — several lines share one. «Ticket
   * promedio» is per ticket, not per line, so the screen needs to tell them
   * apart. Null on an egreso, which has no ticket.
   */
  readonly ticketId: string | null;
  /** The ticket's folio, for the drawer's field list. Null on an egreso. */
  readonly folio: number | null;
  /** The date of the shift it was captured on, when there was one. */
  readonly turno: string | null;
}

type VentaSqlRow = {
  readonly id: string;
  readonly fecha: string | null;
  readonly hora: string | null;
  readonly concepto: string | null;
  readonly clasificacion: string | null;
  readonly amount: string | null;
  readonly cancelada: boolean;
  readonly operador: string | null;
  readonly dispositivo: string | null;
  readonly ticket_id: string | null;
  readonly folio: number | null;
  readonly turno: string | null;
};

/**
 * One page of venta lines, newest first.
 *
 * **Subquery first, joins after** (audit DB2-QRY-03): the page of `sales` is
 * cut inside the subquery — ORDER BY, LIMIT — and only its rows meet
 * `tickets`, the shift, the operator and the device. Joined before the LIMIT,
 * an RLS-blind planner drove from `tickets` and sorted the whole history to
 * keep fifty rows (1.4–2.6 s against 0.5 ms).
 *
 * The device is the row's own `device_id` — the device that captured it —
 * not a per-row lookup into `sync_receipts` (DB2-SYNC-03). A row the portal
 * created carries the portal's id, which names no device, so it reads «—».
 */
async function listVentas(
  tx: Tx,
  filtro: FiltroMovimientos,
  pagina: PaginaMovimientos,
): Promise<readonly MovimientoRow[]> {
  const { limit, offset } = acotar(pagina);
  const rows = await tx.execute<VentaSqlRow>(sql`
    SELECT p.id, p.fecha, t.hora, p.concepto, t.id AS ticket_id, t.folio, ct.fecha AS turno,
           t.metodo AS clasificacion,
           p.monto_centavos::text AS amount,
           (t.cancelled_at IS NOT NULL) AS cancelada,
           u.nombre AS operador,
           d.nombre AS dispositivo
      FROM (SELECT s.id, s.fecha, s.concepto, s.ticket_id, s.monto_centavos, s.device_id
              FROM ${sales} s
             WHERE ${condiciones('venta', filtro)}
             ORDER BY s.fecha DESC, s.id DESC
             LIMIT ${limit} OFFSET ${offset}) p
      JOIN ${tickets} t ON t.id = p.ticket_id
      LEFT JOIN ${cajaTurnos} ct ON ct.id = t.caja_turno_id
      LEFT JOIN ${users} u ON u.id = ct.user_id
      LEFT JOIN ${devices} d ON d.id = p.device_id
     ORDER BY p.fecha DESC, p.id DESC`);

  return [...rows].map((r) => ({
    id: r.id,
    kind: 'venta' as const,
    fecha: r.fecha ?? '',
    hora: (r.hora ?? '').slice(0, 5),
    concepto: r.concepto ?? '',
    clasificacion: r.clasificacion ?? '',
    amount: big(r.amount),
    cancelada: r.cancelada,
    operador: r.operador,
    dispositivo: r.dispositivo,
    ticketId: r.ticket_id,
    folio: r.folio,
    turno: r.turno,
  }));
}

type GastoSqlRow = {
  readonly id: string;
  readonly fecha: string | null;
  readonly concepto: string | null;
  readonly clasificacion: string | null;
  readonly amount: string | null;
  readonly operador: string | null;
  readonly dispositivo: string | null;
  readonly turno: string | null;
};

/** One page of egresos, newest first — the same shape rules as `listVentas`. */
async function listGastos(
  tx: Tx,
  filtro: FiltroMovimientos,
  pagina: PaginaMovimientos,
): Promise<readonly MovimientoRow[]> {
  const { limit, offset } = acotar(pagina);
  // An egreso carries no `hora`: the table has a date and nothing finer, so
  // the stacked cell renders the date alone rather than inventing a time.
  const rows = await tx.execute<GastoSqlRow>(sql`
    SELECT p.id, p.fecha, p.concepto, ct.fecha AS turno,
           p.categoria AS clasificacion,
           p.monto_centavos::text AS amount,
           u.nombre AS operador,
           d.nombre AS dispositivo
      FROM (SELECT e.id, e.fecha, e.concepto, e.categoria, e.monto_centavos,
                   e.caja_turno_id, e.device_id
              FROM ${expenses} e
             WHERE ${condiciones('gasto', filtro)}
             ORDER BY e.fecha DESC, e.id DESC
             LIMIT ${limit} OFFSET ${offset}) p
      LEFT JOIN ${cajaTurnos} ct ON ct.id = p.caja_turno_id
      LEFT JOIN ${users} u ON u.id = ct.user_id
      LEFT JOIN ${devices} d ON d.id = p.device_id
     ORDER BY p.fecha DESC, p.id DESC`);

  return [...rows].map((r) => ({
    id: r.id,
    kind: 'gasto' as const,
    fecha: r.fecha ?? '',
    hora: '',
    concepto: r.concepto ?? '',
    clasificacion: r.clasificacion ?? '',
    amount: big(r.amount),
    cancelada: false,
    operador: r.operador,
    dispositivo: r.dispositivo,
    ticketId: null,
    folio: null,
    turno: r.turno,
  }));
}

/**
 * One entry point; the two shapes differ enough to keep their queries apart.
 * Bounded: one page (default the newest 50) of the rows `filtro` selects.
 */
export async function listMovimientos(
  tx: Tx,
  kind: 'venta' | 'gasto',
  filtro: FiltroMovimientos = {},
  pagina: PaginaMovimientos = { limit: 50, offset: 0 },
): Promise<readonly MovimientoRow[]> {
  return kind === 'venta' ? listVentas(tx, filtro, pagina) : listGastos(tx, filtro, pagina);
}
