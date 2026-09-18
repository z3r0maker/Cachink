/**
 * The customer's "Facturas" list (N-33, P-10): each subscription payment with
 * the state of its CFDI, as the Suscripción screen shows it.
 *
 * The database maps the internal statuses to the four customer states
 * (data-pg `0019_facturas_del_negocio.sql`, tenant-scoped); this module adds
 * what depends on `CFDI_MODE`: a PDF/XML can be downloaded only from the PAC,
 * so never with `off`. A CFDI issued by hand in the SAT portal and marked with
 * its UUID in the backoffice is `timbrada` with `emitidaManual` and no download.
 */

import type { Money } from '@xangarro/domain';

import type { CfdiMode } from './cfdi-mode.js';

export const FACTURA_ESTADOS = ['timbrada', 'en_global', 'pendiente', 'error'] as const;
export type FacturaEstado = (typeof FACTURA_ESTADOS)[number];
export type FacturaRuta = 'individual' | 'global';
export type FacturaFormato = 'pdf' | 'xml';

/** A payment as the database returns it for the customer. */
export interface FacturaRegistrada {
  readonly paymentId: string;
  readonly stripeInvoiceId: string;
  /** ISO-8601. */
  readonly paidAt: string;
  /** IVA included, in centavos. */
  readonly totalCentavos: Money;
  readonly ruta: FacturaRuta;
  readonly estado: FacturaEstado;
  readonly cfdiUuid: string | null;
  /** A PAC document exists (whatever the mode). */
  readonly pdfDisponible: boolean;
  readonly xmlDisponible: boolean;
  readonly emitidaManual: boolean;
}

/** One row of the Facturas list. */
export interface Factura extends FacturaRegistrada {
  /** Only `en_global` payments can ask for a nominative CFDI. */
  readonly puedeSolicitarNominal: boolean;
}

export type FacturaErrorCode =
  | 'NO_ENCONTRADA'
  | 'NO_DISPONIBLE'
  | 'NO_APLICA'
  | 'DATOS_FISCALES_INCOMPLETOS'
  | 'DATO_INVALIDO';

/** A typed refusal the screen shows as is; `message` is for the customer. */
export class FacturaError extends Error {
  readonly code: FacturaErrorCode;

  constructor(code: FacturaErrorCode, message: string) {
    super(message);
    this.name = 'FacturaError';
    this.code = code;
  }
}

/** Where the list comes from: the tenant-scoped database function. */
export type FacturasSource = (businessId: string) => Promise<readonly FacturaRegistrada[]>;

function checked(row: FacturaRegistrada): FacturaRegistrada {
  if (!(FACTURA_ESTADOS as readonly string[]).includes(row.estado)) {
    throw new FacturaError('DATO_INVALIDO', `Estado de factura desconocido: ${row.estado}`);
  }
  return row;
}

/** Apply the mode's rules to one payment. */
export function facturaParaCliente(row: FacturaRegistrada, mode: CfdiMode): Factura {
  const r = checked(row);
  const pac = mode !== 'off' && r.estado === 'timbrada' && !r.emitidaManual;
  return {
    ...r,
    pdfDisponible: pac && r.pdfDisponible,
    xmlDisponible: pac && r.xmlDisponible,
    puedeSolicitarNominal: r.estado === 'en_global',
  };
}

/** The business's payments, newest first, with the mode's rules applied. */
export async function facturasDelNegocio(
  deps: { readonly source: FacturasSource; readonly mode: CfdiMode },
  businessId: string,
): Promise<Factura[]> {
  if (businessId.trim() === '') throw new FacturaError('DATO_INVALIDO', 'Falta el negocio.');
  const rows = await deps.source(businessId);
  return rows.map((row) => facturaParaCliente(row, deps.mode));
}

/** One payment of the business, or `NO_ENCONTRADA`. */
export async function facturaDelNegocio(
  deps: { readonly source: FacturasSource; readonly mode: CfdiMode },
  businessId: string,
  paymentId: string,
): Promise<Factura> {
  const found = (await facturasDelNegocio(deps, businessId)).find((f) => f.paymentId === paymentId);
  if (!found) throw new FacturaError('NO_ENCONTRADA', 'No encontramos ese pago.');
  return found;
}
