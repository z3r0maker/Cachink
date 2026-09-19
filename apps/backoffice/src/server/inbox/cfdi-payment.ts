import type { StatusResult } from './status';

/**
 * Resolving a "pago sin CFDI" item with its folio fiscal (N-08, ADR-070,
 * CFDI_MODE=off) also marks the payment in `cfdi_payments`, through
 * `xangarro.cfdi_marcar_emitido()` (data-pg 0019): the customer's Facturas
 * list then shows it `timbrada`, issued by hand, and the monthly close stops
 * listing it. Runs in the same transaction as the status change and its audit
 * row, so a failure here rolls all three back.
 *
 * The monthly close's own item (`cfdi-global:<period>`, 0021) marks the
 * period's `pending_global` payments `in_global` under one hand-stamped
 * global CFDI, through `xangarro.cfdi_marcar_global()`; the item's folio
 * fiscal is the global's UUID.
 */
export type MarkCfdiIssued = (input: {
  readonly paymentId: string;
  readonly businessId: string;
  readonly uuid: string;
}) => Promise<boolean>;

export type MarkCfdiGlobal = (input: {
  readonly period: string;
  readonly uuid: string;
}) => Promise<number>;

export type MarkOutcome = 'marked' | 'already' | 'not_applicable';

const GLOBAL_REF = /^cfdi-global:(\d{4}-\d{2})$/;

export async function markPaymentInvoiced(
  mark: MarkCfdiIssued,
  { item }: StatusResult,
  markGlobal?: MarkCfdiGlobal,
): Promise<MarkOutcome> {
  const { kind, status, paymentRef, businessId, cfdiUuid } = item;
  if (kind !== 'factura' || status !== 'resuelto') return 'not_applicable';
  if (paymentRef === null || cfdiUuid === null) return 'not_applicable';
  const globalRef = GLOBAL_REF.exec(paymentRef);
  if (globalRef !== null) {
    if (markGlobal === undefined) return 'not_applicable';
    const period = globalRef[1] as string;
    return (await markGlobal({ period, uuid: cfdiUuid })) > 0 ? 'marked' : 'already';
  }
  if (businessId === null) return 'not_applicable';
  return (await mark({ paymentId: paymentRef, businessId, uuid: cfdiUuid })) ? 'marked' : 'already';
}
