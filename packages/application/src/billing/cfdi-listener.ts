/**
 * The CFDI side of `invoice.paid` (N-33): the `InvoicePaidListener` the
 * webhook is built with. Maps Stripe's paid invoice to the CFDI core's
 * `SubscriptionPayment` and hands it to `RecordPaymentForCfdiUseCase`, which
 * decides what `CFDI_MODE` does with it.
 */

import type { SubscriptionPayment } from '../cfdi/types.js';
import type { RecordPaymentForCfdiUseCase } from '../cfdi/record-payment-for-cfdi.js';
import type { InvoicePaidListener, PaidInvoice } from './ports.js';

/** `send_invoice` subscriptions are the annual SPEI ones (B-10); the rest are card. */
export function paymentFromInvoice(invoice: PaidInvoice): SubscriptionPayment {
  return {
    externalId: invoice.stripeInvoiceId,
    tenantId: invoice.businessId,
    totalCentavos: BigInt(invoice.totalCentavos),
    currency: invoice.currency,
    paidAt: new Date(invoice.paidAt),
    method: invoice.collectionMethod === 'send_invoice' ? 'spei' : 'card',
    cardFunding: 'unknown',
    description: 'Suscripción Xangarro',
  };
}

export function cfdiInvoicePaidListener(
  useCase: Pick<RecordPaymentForCfdiUseCase, 'execute'>,
): InvoicePaidListener {
  return {
    async onInvoicePaid(invoice) {
      await useCase.execute({ payment: paymentFromInvoice(invoice) });
    },
  };
}
