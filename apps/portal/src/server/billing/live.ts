import 'server-only';

import {
  ApplyStripeEventUseCase,
  OpenCustomerPortalUseCase,
  StartSpeiAnnualUseCase,
  StartTrialCheckoutUseCase,
  type InvoicePaidListener,
} from '@xangarro/application/billing';

import { pendingPaidAnswersListener } from '../onboarding/paid-answers';
import { billingDb, stripeClient, webhookSecret } from './config';
import { stripeGateway } from './gateway';
import { pgBillingRepository, pgStripeEventLedger } from './repository';
import type { WebhookDeps } from './webhook';

/**
 * The composition root for billing: real Stripe, the `xangarro_billing`
 * connection. Nothing is built until a request needs it, so a portal without
 * Stripe configured only fails on the billing paths.
 */

/**
 * Until N-08 files "pago sin CFDI" items (ADR-070, `CFDI_MODE=off`), each paid
 * invoice is one structured log line — ids and centavos, no PII — and its
 * event stays in `stripe_events` for the backfill.
 */
export const pagoSinCfdiLog: InvoicePaidListener = {
  onInvoicePaid(invoice) {
    console.log(
      JSON.stringify({
        evt: 'pago_sin_cfdi',
        business_id: invoice.businessId,
        invoice_id: invoice.stripeInvoiceId,
        subtotal_centavos: invoice.subtotalCentavos,
        tax_centavos: invoice.taxCentavos,
        total_centavos: invoice.totalCentavos,
        collection_method: invoice.collectionMethod,
        paid_at: invoice.paidAt,
      }),
    );
    return Promise.resolve();
  },
};

function parts() {
  const db = billingDb();
  return { repo: pgBillingRepository(db), gateway: stripeGateway(stripeClient()), db };
}

export function liveWebhookDeps(): WebhookDeps {
  const { repo, gateway, db } = parts();
  const useCase = new ApplyStripeEventUseCase({
    repo,
    gateway,
    ledger: pgStripeEventLedger(db),
    invoices: pagoSinCfdiLog,
    entitlements: pendingPaidAnswersListener,
    now: () => new Date(),
  });
  return { stripe: stripeClient(), secret: webhookSecret(), apply: (e) => useCase.execute(e) };
}

export function liveBillingUseCases() {
  const { repo, gateway } = parts();
  return {
    trial: new StartTrialCheckoutUseCase(repo, gateway),
    spei: new StartSpeiAnnualUseCase(repo, gateway),
    portal: new OpenCustomerPortalUseCase(repo, gateway),
  };
}
