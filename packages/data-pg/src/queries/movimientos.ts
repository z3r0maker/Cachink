/**
 * The ledger lists behind Ventas y gastos (B-3).
 *
 * Split out of `lists.ts` when the attribution joins — the operator through
 * the shift, the device through the sync receipt — pushed that file past its
 * line budget. The Productos lists stayed there.
 */

import { sql } from 'drizzle-orm';

import { cajaTurnos } from '../schema/caja.js';
import { expenses, sales, tickets } from '../schema/ledger.js';
import { devices } from '../schema/portal.js';
import { syncReceipts } from '../schema/sync.js';
import { users } from '../schema/tenant.js';
import type { Db } from '../client.js';

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
   * Who captured it and from what, both recovered rather than stored on the
   * row: the operator through the shift the ticket belongs to, the device
   * through the sync receipt that delivered it (B-3). A row captured in the
   * portal has neither, and says «—».
   */
  readonly operador: string | null;
  readonly dispositivo: string | null;
  /**
   * The ticket a venta line belongs to — several lines share one. «Ticket
   * promedio» is per ticket, not per line, so the screen needs to tell them
   * apart. Null on an egreso, which has no ticket.
   */
  readonly ticketId: string | null;
}

/**
 * The device that delivered a ledger row, from the receipt the sync wrote.
 *
 * `fila` is the alias of the row the receipt is *about* — the venta, not the
 * ticket it hangs from. Naming it was not optional: with the ticket's alias
 * the subquery joins on an id no receipt ever carries and every row reads
 * «—», which is also what a row the portal created looks like, so the
 * mistake would have been invisible.
 */
const dispositivoDe = (tabla: string, fila: string) => sql<string | null>`(
  SELECT d.nombre FROM ${syncReceipts} sr
    JOIN ${devices} d ON d.id = sr.device_id
   WHERE sr.table_name = ${tabla} AND sr.row_id = ${sql.raw(fila)}.id
   ORDER BY sr.received_at DESC LIMIT 1)`;

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
};

async function listVentas(tx: Tx): Promise<readonly MovimientoRow[]> {
  const rows = await tx.execute<VentaSqlRow>(sql`
    SELECT s.id, s.fecha, t.hora, s.concepto, t.id AS ticket_id,
           t.metodo AS clasificacion,
           s.monto_centavos::text AS amount,
           (t.cancelled_at IS NOT NULL) AS cancelada,
           u.nombre AS operador,
           ${dispositivoDe('sales', 's')} AS dispositivo
      FROM ${sales} s
      JOIN ${tickets} t ON t.id = s.ticket_id
      LEFT JOIN ${cajaTurnos} ct ON ct.id = t.caja_turno_id
      LEFT JOIN ${users} u ON u.id = ct.user_id
     WHERE s.deleted_at IS NULL
     ORDER BY s.fecha DESC, s.id DESC`);

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
};

async function listGastos(tx: Tx): Promise<readonly MovimientoRow[]> {
  // An egreso carries no `hora`: the table has a date and nothing finer, so
  // the stacked cell renders the date alone rather than inventing a time.
  const rows = await tx.execute<GastoSqlRow>(sql`
    SELECT t.id, t.fecha, t.concepto,
           t.categoria AS clasificacion,
           t.monto_centavos::text AS amount,
           u.nombre AS operador,
           ${dispositivoDe('expenses', 't')} AS dispositivo
      FROM ${expenses} t
      LEFT JOIN ${cajaTurnos} ct ON ct.id = t.caja_turno_id
      LEFT JOIN ${users} u ON u.id = ct.user_id
     WHERE t.deleted_at IS NULL
     ORDER BY t.fecha DESC, t.id DESC`);

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
  }));
}

/** One entry point; the two shapes differ enough to keep their queries apart. */
export async function listMovimientos(
  tx: Tx,
  kind: 'venta' | 'gasto',
): Promise<readonly MovimientoRow[]> {
  return kind === 'venta' ? listVentas(tx) : listGastos(tx);
}
