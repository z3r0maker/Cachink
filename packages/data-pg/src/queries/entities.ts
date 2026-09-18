import { and, asc, count, desc, eq, isNull, ne } from 'drizzle-orm';

import { businesses, clients, employees, users } from '../schema/tenant.js';
import { expenses, sales } from '../schema/ledger.js';
import { devices, notices, syncRejections } from '../schema/portal.js';
import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/* ── Equipo, Empleados, Negocio, Sync, Avisos ────────────────────────── */

export async function listOperadores(tx: Tx) {
  return tx
    .select({ id: users.id, nombre: users.nombre, permissions: users.permissions })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(asc(users.nombre));
}

export async function listDispositivos(tx: Tx) {
  return tx
    .select({
      id: devices.id,
      nombre: devices.nombre,
      plataforma: devices.plataforma,
      modelo: devices.modelo,
      lastPushAt: devices.lastPushAt,
      revokedAt: devices.revokedAt,
    })
    .from(devices)
    .orderBy(asc(devices.nombre));
}

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
      tableName: syncRejections.tableName,
      rowId: syncRejections.rowId,
      code: syncRejections.code,
      payload: syncRejections.payload,
      receivedAt: syncRejections.receivedAt,
    })
    .from(syncRejections)
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
export async function periodLedger(tx: Tx, from: string, to: string) {
  const [v, g] = await Promise.all([
    tx
      .select()
      .from(sales)
      .where(and(isNull(sales.deletedAt), isNull(sales.cancelledAt))),
    tx.select().from(expenses).where(isNull(expenses.deletedAt)),
  ]);
  return {
    ventas: v.filter((r) => (r.fecha ?? '') >= from && (r.fecha ?? '') <= to),
    egresos: g.filter((r) => (r.fecha ?? '') >= from && (r.fecha ?? '') <= to),
  };
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
export async function shellCounts(tx: Tx): Promise<{ pendingRows: number; unreadNotices: number }> {
  const [pending] = await tx
    .select({ n: count() })
    .from(syncRejections)
    .where(isNull(syncRejections.resolvedAt));

  const [unread] = await tx
    .select({ n: count() })
    .from(notices)
    .where(
      and(isNull(notices.resolvedAt), eq(notices.state, 'nuevo'), ne(notices.source, 'asesor')),
    );

  return { pendingRows: pending?.n ?? 0, unreadNotices: unread?.n ?? 0 };
}
