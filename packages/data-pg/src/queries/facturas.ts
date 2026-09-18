/**
 * The customer's "Facturas" list and the backoffice's "marcar UUID" (N-33,
 * 0019_facturas_del_negocio.sql).
 *
 * `facturasDelNegocioRows` runs on the tenant connection inside `withTenant`:
 * the function returns rows only for the business in the request's claim.
 * `marcarCfdiEmitido` runs on the backoffice's `xangarro_admin` connection.
 * Neither role has a grant on `cfdi_payments` itself.
 */

import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

/** The customer states 0019 maps to; the application checks them on the way in. */
type FacturaEstado = 'timbrada' | 'en_global' | 'pendiente' | 'error';
type FacturaRuta = 'individual' | 'global';

/** One subscription payment as the database maps it for the customer. */
export interface FacturaDelNegocioRow {
  readonly paymentId: string;
  readonly stripeInvoiceId: string;
  /** ISO-8601. */
  readonly paidAt: string;
  /** IVA included, in centavos. */
  readonly totalCentavos: bigint;
  readonly ruta: FacturaRuta;
  readonly estado: FacturaEstado;
  readonly cfdiUuid: string | null;
  readonly pdfDisponible: boolean;
  readonly xmlDisponible: boolean;
  /** Issued by hand in the SAT portal and marked with its UUID (CFDI_MODE=off). */
  readonly emitidaManual: boolean;
}

interface Raw extends Record<string, unknown> {
  payment_id: string;
  stripe_invoice_id: string;
  paid_at: string | Date;
  total_centavos: string | number | bigint;
  route: FacturaRuta;
  estado: FacturaEstado;
  cfdi_uuid: string | null;
  pdf_disponible: boolean;
  xml_disponible: boolean;
  emitida_manual: boolean;
}

function rowOut(r: Raw): FacturaDelNegocioRow {
  return {
    paymentId: r.payment_id,
    stripeInvoiceId: r.stripe_invoice_id,
    paidAt: new Date(r.paid_at).toISOString(),
    totalCentavos: BigInt(r.total_centavos),
    ruta: r.route,
    estado: r.estado,
    cfdiUuid: r.cfdi_uuid,
    pdfDisponible: r.pdf_disponible,
    xmlDisponible: r.xml_disponible,
    emitidaManual: r.emitida_manual,
  };
}

/** Newest payment first; empty unless `businessId` is the connection's own tenant. */
export async function facturasDelNegocioRows(
  db: Conn,
  businessId: string,
): Promise<FacturaDelNegocioRow[]> {
  const rows = await db.execute<Raw>(
    sql`SELECT * FROM xangarro.facturas_del_negocio(${businessId})`,
  );
  return [...rows].map(rowOut);
}

/**
 * Record that staff issued this payment's CFDI by hand, with its folio fiscal.
 * True when a payment still owed a CFDI changed; false for an unknown payment,
 * another business's, or one already invoiced.
 */
export async function marcarCfdiEmitido(
  db: Conn,
  input: { readonly paymentId: string; readonly businessId: string; readonly uuid: string },
): Promise<boolean> {
  const rows = await db.execute<{ marked: boolean }>(
    sql`SELECT xangarro.cfdi_marcar_emitido(${input.paymentId}, ${input.businessId}, ${input.uuid}) AS marked`,
  );
  return rows[0]?.marked === true;
}
