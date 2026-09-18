import 'server-only';

import type { TrialCheckout, TrialCheckoutResult } from '@xangarro/application';

/**
 * **Stub** for [Probar 14 días] (N-13). B-10 is not built: there is no Stripe
 * account, price or webhook yet. This is the seam — B-10 replaces
 * `startTrialCheckout` with a Checkout Session (`mode: 'subscription'`,
 * `subscription_data.trial_period_days: 14`,
 * `payment_method_collection: 'if_required'`, the `plan_`-prefixed lookup key
 * for the interval; ADR-059, ADR-067) and returns `{ status: 'redirect', url }`.
 * Nothing else changes: `SolicitarPruebaUseCase` already records the intent
 * and the screen already follows a redirect.
 */
export const trialCheckout: TrialCheckout = {
  startTrialCheckout(): Promise<TrialCheckoutResult> {
    return Promise.resolve({ status: 'unavailable' });
  },
};
