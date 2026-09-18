import 'server-only';

import { AplicarRespuestasPendientesUseCase } from '@xangarro/application';
import type { EntitlementListener } from '@xangarro/application/billing';
import type { BusinessId } from '@xangarro/domain';

import { allowedFor } from '@/onboarding/plan-copy';

import { withTenant } from '../db';
import { pgBusinessesRepository } from '../repositories/businesses';
import { pgOnboardingStore } from './store';

/**
 * B-10's `EntitlementListener`, filled by N-13: when a Stripe event leaves the
 * business on a plan that covers answers [Seguir gratis] kept pending, apply
 * them in a tenant transaction. Anything else is a no-op (see
 * `AplicarRespuestasPendientesUseCase`). A failure propagates, so the webhook
 * answers 500 and Stripe retries the event; applying is idempotent.
 */
export const pendingPaidAnswersListener: EntitlementListener = {
  async onEntitlementChanged(businessId, entitlement) {
    const id = businessId as BusinessId;
    await withTenant(id, (tx) =>
      new AplicarRespuestasPendientesUseCase(
        pgBusinessesRepository(tx, id),
        pgOnboardingStore(tx, id),
      ).execute({ businessId: id, plan: entitlement.plan, allowed: allowedFor(entitlement.plan) }),
    );
  },
};
