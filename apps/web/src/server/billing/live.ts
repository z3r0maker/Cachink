import 'server-only';

import {
  ApplyStripeEventUseCase,
  OpenCustomerPortalUseCase,
  StartSpeiAnnualUseCase,
  StartTrialCheckoutUseCase,
} from '@xangarro/application/billing';

import { pendingPaidAnswersListener } from '../onboarding/paid-answers';
import { liveCfdiInvoiceListener } from './cfdi';
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
