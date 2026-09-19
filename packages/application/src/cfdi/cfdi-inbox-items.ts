/**
 * The admin inbox items the CFDI flow files (N-33 → N-08, kind `factura`).
 * Ids and amounts only — no fiscal data in the body; staff open the tenant
 * from `businessId`.
 */

import { formatMoney } from '@xangarro/domain';

import type { InboxItemRequest } from '../support-inbox/index.js';
import type { IssuedCfdiRecord } from './issued-cfdi-repository.js';
import type { SubscriptionPayment } from './types.js';

const MAX_LISTED = 150;

const ROUTE_LABEL = {
  individual_pue: 'individual (PUE)',
  individual_ppd: 'individual (PPD + complemento)',
  global: 'global «público en general»',
} as const;

function errorLine(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
  const message = error instanceof Error ? error.message : String(error);
  return `Error: ${typeof code === 'string' ? `${code} — ` : ''}${message}`;
}

function instant(date: Date): string {
  return Number.isNaN(date.getTime()) ? 'fecha inválida' : date.toISOString();
}

/** One payment still owed its CFDI: `off`, or a failure in `test` / `live`. */
export function paymentItem(
  payment: SubscriptionPayment,
  record: IssuedCfdiRecord | null,
  error: unknown,
): InboxItemRequest {
  const total = formatMoney(payment.totalCentavos);
  const lines = [
    `Pago: ${payment.externalId}`,
    `Total: ${total} ${payment.currency.toUpperCase()} (IVA incluido)`,
    `Pagado: ${instant(payment.paidAt)} · ${payment.method === 'spei' ? 'SPEI' : 'tarjeta'}`,
  ];
  if (record) lines.push(`Ruta: ${ROUTE_LABEL[record.route]} · periodo ${record.period}`);
  if (error !== null) lines.push(errorLine(error));
  return {
    kind: 'factura',
    urgent: error !== null,
    businessId: payment.tenantId,
    title: `${error === null ? 'Pago sin CFDI' : 'No se pudo timbrar'} · ${total}`,
    body: lines.join('\n'),
    source: 'stripe-webhook',
    sourceRef: payment.externalId,
    paymentRef: payment.externalId,
  };
}

/** The monthly close with `CFDI_MODE=off`: every payment of the period still owed a CFDI. */
export function periodItem(period: string, records: readonly IssuedCfdiRecord[]): InboxItemRequest {
  const total = records.reduce((sum, r) => sum + r.totalCentavos, 0n);
  const listed = records.slice(0, MAX_LISTED).map((r) => {
    const route = ROUTE_LABEL[r.route];
    return `· ${r.externalPaymentId} · ${r.tenantId} · ${formatMoney(r.totalCentavos)} · ${route}`;
  });
  if (records.length > MAX_LISTED) listed.push(`… y ${records.length - MAX_LISTED} más`);
  return {
    kind: 'factura',
    urgent: false,
    businessId: null,
    title: `Cierre ${period}: ${records.length} pagos sin CFDI · ${formatMoney(total)}`,
    body: [`Pagos del periodo ${period} sin CFDI (IVA incluido):`, ...listed].join('\n'),
    source: 'cfdi-cron',
    sourceRef: `cfdi-global:${period}`,
    paymentRef: `cfdi-global:${period}`,
  };
}

/** The monthly global CFDI could not be stamped in `test` / `live`. */
export function closeFailureItem(period: string, error: unknown): InboxItemRequest {
  return {
    kind: 'factura',
    urgent: true,
    businessId: null,
    title: `No se pudo timbrar el CFDI global de ${period}`,
    body: [`Cierre mensual ${period}.`, errorLine(error)].join('\n'),
    source: 'cfdi-cron',
    sourceRef: `cfdi-global-error:${period}`,
    paymentRef: `cfdi-global:${period}`,
  };
}

/** A Stripe refund arrived; the CFDI it hit needs cancelling by hand (N-33). */
export function refundItem(
  record: IssuedCfdiRecord,
  refund: { readonly refundId: string; readonly amountRefundedCentavos: number },
): InboxItemRequest {
  const uuid = record.invoice?.uuid;
  const motivo =
    record.status === 'cancel_requested'
      ? 'Tiene CFDI: cancelarlo en el portal del SAT (parcial → CFDI de egreso, pendiente de contador, O-14).'
      : 'No llegó a timbrarse; solo se da de baja del periodo.';
  return {
    kind: 'factura',
    urgent: false,
    businessId: record.tenantId,
    title: 'Reembolso recibido — dar de baja su CFDI',
    body: [
      `Reembolo ${formatMoney(BigInt(refund.amountRefundedCentavos))} (IVA incluido) del pago ${record.externalPaymentId}.`,
      uuid !== undefined ? `CFDI afectado: ${uuid}.` : 'El pago no tenía CFDI individual.',
      motivo,
    ].join('\n'),
    source: 'stripe-webhook',
    sourceRef: `refund:${refund.refundId}`,
    paymentRef: record.externalPaymentId,
  };
}
