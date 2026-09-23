import 'server-only';

import type { PaymentFailedListener } from '@xangarro/application/billing';
import type { EmailSender, OwnerRecipients } from '@xangarro/application/email';
import { renderPaymentFailedEmail } from '@xangarro/email';

import { billingDb, stripeClient } from '../billing/config';
import { pgBillingRepository } from '../billing/repository';
import { ownersViaBilling, stripeRecipients } from './recipients';
import { portalEmailSender, portalUrl, sendReported } from './sender';

/**
 * The `PaymentFailedListener` the webhook is built with (B-10 step 3, B-14):
 * one `payment-failed` email to the Stripe customer's address per failed
 * period. The key carries the period start, so Stripe's retries of the same
 * invoice (and its own dunning emails, which are switched off) never send a
 * second one; a new period is a new email.
 */
export interface PaymentFailedEmailDeps {
  readonly owners: OwnerRecipients;
  readonly sender?: EmailSender;
  /** The public origin for the Suscripción link; `PORTAL_URL` wins when set. */
  readonly origin?: string;
}

export const DEFAULT_PORTAL_ORIGIN = 'https://app.xangarro.mx';

export function paymentFailedEmailListener(deps: PaymentFailedEmailDeps): PaymentFailedListener {
  return {
    async onPaymentFailed(notice) {
      const to = await deps.owners.of(notice.businessId);
      if (to === null) return;
      const content = await renderPaymentFailedEmail({
        plan: notice.planId,
        graceUntil: notice.entitlement.graceUntil,
        subscriptionUrl: `${portalUrl(deps.origin ?? DEFAULT_PORTAL_ORIGIN)}/suscripcion`,
        name: to.name,
      });
      const period = (notice.periodStart ?? notice.entitlement.graceUntil).slice(0, 10);
      await sendReported(
        deps.sender ?? portalEmailSender(),
        {
          ...content,
          to: to.email,
          tags: [{ name: 'kind', value: 'payment-failed' }],
          idempotencyKey: `payment-failed:${notice.businessId}:${period}`,
        },
        { endpoint: 'stripe/webhook', businessId: notice.businessId },
      );
    },
  };
}

/** Real Stripe, the billing connection, the portal's sender. */
export function livePaymentFailedListener(): PaymentFailedListener {
  const repo = pgBillingRepository(billingDb());
  return paymentFailedEmailListener({
    owners: ownersViaBilling((id) => repo.customerOf(id), stripeRecipients(stripeClient())),
  });
}
