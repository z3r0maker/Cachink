import type { StatusResult } from './status';

/**
 * Resolving a "pago sin CFDI" item with its folio fiscal (N-08, ADR-070,
 * CFDI_MODE=off) also marks the payment in `cfdi_payments`, through
 * `xangarro.cfdi_marcar_emitido()` (data-pg 0019): the customer's Facturas
 * list then shows it `timbrada`, issued by hand, and the monthly close stops
 * listing it. Runs in the same transaction as the status change and its audit
 * row, so a failure here rolls all three back.
 *
 * The monthly close's own item (`cfdi-global:<period>`) names no single
 * payment and marks nothing.
 */
export type MarkCfdiIssued = (input: {
  readonly paymentId: string;
  readonly businessId: string;
  readonly uuid: string;
}) => Promise<boolean>;

export type MarkOutcome = 'marked' | 'already' | 'not_applicable';

export async function markPaymentInvoiced(
  mark: MarkCfdiIssued,
  { item }: StatusResult,
): Promise<MarkOutcome> {
  const { kind, status, paymentRef, businessId, cfdiUuid } = item;
  if (kind !== 'factura' || status !== 'resuelto') return 'not_applicable';
  if (paymentRef === null || businessId === null || cfdiUuid === null) return 'not_applicable';
  if (paymentRef.startsWith('cfdi-global')) return 'not_applicable';
  return (await mark({ paymentId: paymentRef, businessId, uuid: cfdiUuid })) ? 'marked' : 'already';
}
