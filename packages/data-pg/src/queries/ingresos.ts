/**
 * A month of Xangarro's own subscription payments and their CFDIs, for the
 * backoffice's «Empresa» (E-10, board CD-06i; 0054_ingresos_del_periodo.sql).
 * Runs on the `xangarro_admin` connection, which has no grant on
 * `cfdi_payments` itself: the function is its only way in.
 */

import { sql } from 'drizzle-orm';

import { CFDI_ROUTES, CFDI_STATUSES } from '../schema/cfdi.js';
import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

export type CfdiRoute = (typeof CFDI_ROUTES)[number];
export type CfdiStatus = (typeof CFDI_STATUSES)[number];

export interface IngresoDelPeriodo {
  /** The Stripe invoice id: the payment's key, and the import's idempotency key. */
  readonly paymentId: string;
  /** ISO-8601. */
  readonly paidAt: string;
  /** IVA included, in centavos. */
  readonly totalCentavos: bigint;
  readonly route: CfdiRoute;
  readonly status: CfdiStatus;
  readonly formaPago: string;
  readonly description: string;
  /** Null for a payment without fiscal data (the global's). */
  readonly receptorRfc: string | null;
  readonly receptorNombre: string | null;
  readonly invoiceUuid: string | null;
  readonly complementUuid: string | null;
  /** The folio fiscal of the global that took it, once stamped. */
  readonly globalUuid: string | null;
  /** What its refunds' credit notes gave back, in centavos. */
  readonly notasDeCreditoCentavos: bigint;
}

interface Raw extends Record<string, unknown> {
  payment_id: string;
  paid_at: string | Date;
  total_centavos: string | number | bigint;
  route: string;
  status: string;
  forma_pago: string;
  description: string;
  receptor_rfc: string | null;
  receptor_nombre: string | null;
  invoice_uuid: string | null;
  complement_uuid: string | null;
  global_uuid: string | null;
  notas_de_credito_centavos: string | number | bigint;
}

function uno<T extends string>(valid: readonly T[], value: string, column: string): T {
  const found = valid.find((v) => v === value);
  if (found === undefined) throw new Error(`ingresos_del_periodo: unknown ${column} «${value}»`);
  return found;
}

function rowOut(r: Raw): IngresoDelPeriodo {
  return {
    paymentId: r.payment_id,
    paidAt: new Date(r.paid_at).toISOString(),
    // Parsed, never asserted: the driver may return a bigint as text (ADR-094).
    totalCentavos: BigInt(r.total_centavos),
    route: uno(CFDI_ROUTES, r.route, 'route'),
    status: uno(CFDI_STATUSES, r.status, 'status'),
    formaPago: r.forma_pago,
    description: r.description,
    receptorRfc: r.receptor_rfc,
    receptorNombre: r.receptor_nombre,
    invoiceUuid: r.invoice_uuid,
    complementUuid: r.complement_uuid,
    globalUuid: r.global_uuid,
    notasDeCreditoCentavos: BigInt(r.notas_de_credito_centavos),
  };
}

/** The payments of `period` (`YYYY-MM`, CDMX), newest first; none for anything else. */
export async function ingresosDelPeriodo(db: Conn, period: string): Promise<IngresoDelPeriodo[]> {
  const rows = await db.execute<Raw>(sql`SELECT * FROM xangarro.ingresos_del_periodo(${period})`);
  return [...rows].map(rowOut);
}
