/**
 * CFDI records for Xangarro's own subscription payments (N-33).
 *
 * Run on the `xangarro_billing` connection — the only role granted these
 * tables (`0009_metering_cfdi_grants.sql`). Rows are plain data; the portal's
 * adapter maps them to the application's `IssuedCfdiRepository` records.
 * Timestamps come back as ISO-8601. Nothing here deletes.
 */

import { and, asc, eq, inArray } from 'drizzle-orm';

import { cfdiGlobals, cfdiPayments, type CFDI_STATUSES } from '../schema/cfdi.js';
import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export type CfdiPaymentRow = Omit<typeof cfdiPayments.$inferSelect, 'createdAt' | 'updatedAt'>;
export type CfdiGlobalRow = Omit<typeof cfdiGlobals.$inferSelect, 'createdAt' | 'updatedAt'>;
export type CfdiStatusName = (typeof CFDI_STATUSES)[number];

const iso = (v: string): string => new Date(v).toISOString();

function paymentOut(r: typeof cfdiPayments.$inferSelect): CfdiPaymentRow {
  const { createdAt: _c, updatedAt: _u, ...row } = r;
  return { ...row, paidAt: iso(row.paidAt) };
}

function globalOut(r: typeof cfdiGlobals.$inferSelect): CfdiGlobalRow {
  const { createdAt: _c, updatedAt: _u, ...row } = r;
  return row;
}

export async function cfdiPaymentOf(db: Conn, id: string): Promise<CfdiPaymentRow | null> {
  const [row] = await db.select().from(cfdiPayments).where(eq(cfdiPayments.externalPaymentId, id));
  return row ? paymentOut(row) : null;
}

/** Insert unless the payment already has a row. True when this call inserted it. */
export async function claimCfdiPayment(db: Conn, row: CfdiPaymentRow): Promise<boolean> {
  const inserted = await db
    .insert(cfdiPayments)
    .values(row)
    .onConflictDoNothing()
    .returning({ id: cfdiPayments.externalPaymentId });
  return inserted.length > 0;
}

/** Replace an existing row. False when there was none. */
export async function updateCfdiPayment(db: Conn, row: CfdiPaymentRow): Promise<boolean> {
  const { externalPaymentId, ...fields } = row;
  const updated = await db
    .update(cfdiPayments)
    .set({ ...fields, updatedAt: new Date().toISOString() })
    .where(eq(cfdiPayments.externalPaymentId, externalPaymentId))
    .returning({ id: cfdiPayments.externalPaymentId });
  return updated.length > 0;
}

/** A period's payments in the given statuses, oldest payment first. */
export async function cfdiPaymentsOfPeriod(
  db: Conn,
  period: string,
  statuses: readonly CfdiStatusName[],
): Promise<CfdiPaymentRow[]> {
  if (statuses.length === 0) return [];
  const rows = await db
    .select()
    .from(cfdiPayments)
    .where(and(eq(cfdiPayments.period, period), inArray(cfdiPayments.status, [...statuses])))
    .orderBy(asc(cfdiPayments.paidAt), asc(cfdiPayments.externalPaymentId));
  return rows.map(paymentOut);
}

export async function cfdiGlobalsOfPeriod(db: Conn, period: string): Promise<CfdiGlobalRow[]> {
  const rows = await db
    .select()
    .from(cfdiGlobals)
    .where(eq(cfdiGlobals.period, period))
    .orderBy(asc(cfdiGlobals.sequence));
  return rows.map(globalOut);
}

/** Insert or replace a global CFDI by id. */
export async function saveCfdiGlobal(db: Conn, row: CfdiGlobalRow): Promise<void> {
  const { id: _id, ...fields } = row;
  await db
    .insert(cfdiGlobals)
    .values(row)
    .onConflictDoUpdate({
      target: cfdiGlobals.id,
      set: { ...fields, updatedAt: new Date().toISOString() },
    });
}
