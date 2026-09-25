import 'server-only';

import type { TrialCheckout } from '@xangarro/application';
import type { BillingBusiness } from '@xangarro/application/billing';

import { liveBillingUseCases } from '../billing/live';
import { trialCheckoutWith } from '../billing/trial-seam';
import { reportError } from '../observability/report';

/**
 * [Probar 14 días] (N-13) through B-10's Stripe Checkout: a subscription
 * session with a card-less 14-day trial on the plan and interval chosen
 * (ADR-059, ADR-067). `SolicitarPruebaUseCase` records the intent first, so
 * the tap is kept even when Checkout fails.
 *
 * Billing is built only when the owner taps: a portal without Stripe
 * configured, a refusal (already subscribed) or a Stripe error is reported and
 * answers `unavailable`, which the wizard already renders.
 */
export function trialCheckoutFor(business: BillingBusiness, origin: string): TrialCheckout {
  const trial = {
    execute: (input: Parameters<ReturnType<typeof liveBillingUseCases>['trial']['execute']>[0]) =>
      liveBillingUseCases().trial.execute(input),
  };
  return trialCheckoutWith(
    trial,
    business,
    {
      // P-36.2: both paths end on the guide; the plan is confirmed there.
      successUrl: `${origin}/como-empiezo?pago=listo&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/bienvenida/plan`,
    },
    (error) =>
      reportError(error, { endpoint: 'onboarding/trial-checkout', businessId: business.id }),
  );
}
