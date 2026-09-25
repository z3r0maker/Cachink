import { and, asc, count, desc, eq, gt, isNull, ne, sql } from 'drizzle-orm';

import { businesses, clients, employees } from '../schema/tenant.js';
import { expenses, sales } from '../schema/ledger.js';
import { products } from '../schema/catalog.js';
import { activationCodes, devices, notices } from '../schema/portal.js';
import { syncRejections } from '../schema/sync.js';
import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/* ── Equipo, Empleados, Negocio, Sync, Avisos ────────────────────────── */

export async function listEmpleados(tx: Tx) {
  return tx
    .select({
      id: employees.id,
      nombre: employees.nombre,
      puesto: employees.puesto,
      salario: employees.salarioCentavos,
      periodo: employees.periodo,
    })
    .from(employees)
    .where(isNull(employees.deletedAt))
    .orderBy(asc(employees.nombre));
}

export async function getBusiness(tx: Tx) {
  const [row] = await tx.select().from(businesses).where(isNull(businesses.deletedAt)).limit(1);
  return row;
}

export async function listRejections(tx: Tx) {
  return tx
    .select({
      id: syncRejections.id,
      deviceId: syncRejections.deviceId,
      /** The device's name, for the owner; null if the device row is gone. */
      dispositivo: devices.nombre,
      tableName: syncRejections.tableName,
      rowId: syncRejections.rowId,
      code: syncRejections.code,
      payload: syncRejections.payload,
      receivedAt: syncRejections.receivedAt,
    })
    .from(syncRejections)
    .leftJoin(devices, eq(devices.id, syncRejections.deviceId))
    .where(isNull(syncRejections.resolvedAt))
    .orderBy(desc(syncRejections.receivedAt));
}

export async function listNotices(tx: Tx, source?: 'sistema' | 'operacion' | 'asesor') {
  const base = tx
    .select({
      id: notices.id,
      source: notices.source,
      severity: notices.severity,
      title: notices.title,
      body: notices.body,
      ctaLabel: notices.ctaLabel,
      ctaHref: notices.ctaHref,
      state: notices.state,
      createdAt: notices.createdAt,
    })
    .from(notices);
  const rows = source
    ? await base
        .where(and(eq(notices.source, source), isNull(notices.resolvedAt)))
        .orderBy(desc(notices.createdAt))
    : await base.where(isNull(notices.resolvedAt)).orderBy(desc(notices.createdAt));
  return rows;
}

export async function listClientes(tx: Tx) {
  return tx.select().from(clients).where(isNull(clients.deletedAt)).orderBy(asc(clients.nombre));
}

/** Real `Sale` and `Expense` rows for the NIF statements. */
/**
 * A period's ledger for the statements (P-14): live sales and expenses whose
 * day falls in [from, to]. Filtered in SQL on the first ten characters of
 * `fecha` (text on both sides of the wire), so a timestamped fecha on the last
 * day still counts and a year's statement does not pull every row ever sold.
 */
export async function periodLedger(tx: Tx, from: string, to: string) {
  const inRange = (col: typeof sales.fecha | typeof expenses.fecha) =>
    sql`left(${col}, 10) BETWEEN ${from} AND ${to}`;
  const [ventas, egresos] = await Promise.all([
    tx
      .select()
      .from(sales)
      .where(
        and(
          isNull(sales.deletedAt),
          sql`NOT EXISTS (SELECT 1 FROM tickets t WHERE t.id = ${sales.ticketId} AND t.cancelled_at IS NOT NULL)`,
          inRange(sales.fecha),
        ),
      ),
    tx
      .select()
      .from(expenses)
      .where(and(isNull(expenses.deletedAt), inRange(expenses.fecha))),
  ]);
  return { ventas, egresos };
}

/**
 * The two counts the app shell shows on every page: unsent rows and unread
 * notices.
 *
 * Counted in SQL rather than by fetching rows and measuring the array — the
 * shell renders on every navigation, and the lists it would otherwise pull are
 * unbounded.
 *
 * The bell excludes the Asesor: the design gives the badge and the Asesor nav
 * item separate unread notions (ADR-060). `state = 'nuevo'` is what "unread"
 * means for a notice.
 */
export async function shellCounts(
  tx: Tx,
  businessId: string,
): Promise<{ pendingRows: number; unreadNotices: number; revisionPendiente: number }> {
  const [pending] = await tx
    .select({ n: count() })
    .from(syncRejections)
    .leftJoin(devices, eq(devices.id, syncRejections.deviceId))
    .where(isNull(syncRejections.resolvedAt));

  const [unread] = await tx
    .select({ n: count() })
    .from(notices)
    .where(
      and(isNull(notices.resolvedAt), eq(notices.state, 'nuevo'), ne(notices.source, 'asesor')),
    );

  const [productos] = await tx
    .select({ n: count() })
    .from(products)
    .where(pendienteDeRevision(products, businessId));
  const [clientes] = await tx
    .select({ n: count() })
    .from(clients)
    .where(pendienteDeRevision(clients, businessId));

  return {
    pendingRows: pending?.n ?? 0,
    unreadNotices: unread?.n ?? 0,
    revisionPendiente: (productos?.n ?? 0) + (clientes?.n ?? 0),
  };
}

/**
 * `estado_revision = 'pendiente'`, alive, this business (ADR-074 §2).
 *
 * Exported because the Revisión de caja screen lists exactly these rows and
 * the sidebar badge counts exactly these rows. They were two definitions once
 * — the badge's was a fixture length — and production showed a 6 above a page
 * that said there was nothing to review.
 */
export function pendienteDeRevision(
  table: typeof products | typeof clients,
  businessId: string,
): ReturnType<typeof and> {
  return and(
    eq(table.businessId, businessId),
    eq(table.estadoRevision, 'pendiente'),
    isNull(table.deletedAt),
  );
}

/**
 * The code a shopkeeper can hand to a phone right now, if any.
 *
 * "Live" means unredeemed **and** unexpired — both, because either one alone
 * would show a code that `/activate` is about to refuse. `generarCodigo`
 * expires every other unredeemed code when it mints one, so there is at most
 * one, but the ordering makes that a property of the query rather than an
 * assumption about the writer.
 */
export async function liveActivationCode(
  tx: Tx,
): Promise<{ code: string; expiresAt: string } | null> {
  const [row] = await tx
    .select({ code: activationCodes.code, expiresAt: activationCodes.expiresAt })
    .from(activationCodes)
    .where(and(isNull(activationCodes.redeemedAt), gt(activationCodes.expiresAt, sql`now()`)))
    .orderBy(desc(activationCodes.createdAt))
    .limit(1);
  return row ?? null;
}
