import 'server-only';

import {
  ApplyStripeEventUseCase,
  CancelLinkUseCase,
  CancelSubscriptionUseCase,
  OpenCustomerPortalUseCase,
  ResumeSubscriptionUseCase,
  StartSpeiAnnualUseCase,
  StartTrialCheckoutUseCase,
} from '@xangarro/application/billing';

import { cancellationEmailListener } from '../email/cancellation';
import { livePaymentFailedListener } from '../email/payment-failed';
import { stripeRecipients } from '../email/recipients';
import { portalEmailSender } from '../email/sender';
import { reportError } from '../observability/report';
import { pgCancellationLedger, pgConsentLedger, pgRenewalNoticeStore } from './cancel-repository';
import { pendingPaidAnswersListener } from '../onboarding/paid-answers';
import { liveCfdiInvoiceListener, liveCfdiRefundListener } from './cfdi';
import { billingDb, stripeClient, webhookSecret } from './config';
import { stripeGateway } from './gateway';
import { pgBillingRepository, pgStripeEventLedger } from './repository';
import type { WebhookDeps } from './webhook';

/**
 * The composition root for billing: real Stripe, the `xangarro_billing`
 * connection. Nothing is built until a request needs it, so a portal without
 * Stripe configured only fails on the billing paths.
 */

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
    // N-33: records every paid invoice and, per CFDI_MODE, files it or stamps it.
    invoices: liveCfdiInvoiceListener(),
    refunds: liveCfdiRefundListener(),
    // B-14: the owner's «no pudimos cobrar» email, once per failed period.
    paymentFailures: livePaymentFailedListener(),
    entitlements: pendingPaidAnswersListener,
    // LFPC 76 Bis: the Términos box ticked in Checkout, copied here.
    consents: pgConsentLedger(db),
    now: () => new Date(),
  });
  return { stripe: stripeClient(), secret: webhookSecret(), apply: (e) => useCase.execute(e) };
}

/** Cancel at period end, with its acuse and confirmation email (LFPC 76 Bis, ADR-132). */
function cancelUseCase(p: ReturnType<typeof parts>) {
  const customers = stripeRecipients(stripeClient());
  return new CancelSubscriptionUseCase({
    repo: p.repo,
    gateway: p.gateway,
    ledger: pgCancellationLedger(p.db),
    notices: cancellationEmailListener({
      customerOf: (id) => p.repo.customerOf(id),
      customers,
      sender: portalEmailSender(),
    }),
    report: (error, businessId) => reportError(error, { endpoint: 'billing/cancel', businessId }),
    now: () => new Date(),
  });
}

export function liveBillingUseCases() {
  const p = parts();
  const { repo, gateway } = p;
  return {
    trial: new StartTrialCheckoutUseCase(repo, gateway),
    spei: new StartSpeiAnnualUseCase(repo, gateway),
    portal: new OpenCustomerPortalUseCase(repo, gateway),
    cancel: cancelUseCase(p),
    resume: new ResumeSubscriptionUseCase(repo, gateway),
  };
}

/**
 * The renewal reminder's one-click link (`/cancelar`). Opening it reads only
 * Postgres: Stripe is reached for the business's name (optional) and for the
 * tap, so a Stripe outage still shows the link's state.
 */
export function liveCancelLink(): CancelLinkUseCase {
  const db = billingDb();
  return new CancelLinkUseCase({
    store: pgRenewalNoticeStore(db),
    repo: pgBillingRepository(db),
    cancel: { execute: (input) => cancelUseCase(parts()).execute(input) },
    customerName: async (id) => (await stripeRecipients(stripeClient()).of(id))?.name ?? null,
    now: () => new Date(),
  });
}
