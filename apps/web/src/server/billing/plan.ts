import 'server-only';

import { entitlementFromBilling } from '@xangarro/application/billing';
import { subscriptionsOfBusiness } from '@xangarro/data-pg';
import type { Entitlement } from '@xangarro/domain';

import type { Tx } from '../db';

/**
 * The one place the portal learns a business's plan (B-10).
 *
 * Reads `subscriptions` inside the caller's **tenant** transaction — RLS lets
 * a tenant read its own billing rows — and runs `computeEntitlement` over
 * them. No row is the free plan. Activation, pull, `GET /entitlement`, the
 * session, the operator allowance and the Funciones switches all come here,
 * so the phone and the portal can never disagree about the plan.
 */
export async function tenantEntitlement(
  tx: Tx,
  businessId: string,
  now: Date,
): Promise<Entitlement> {
  return entitlementFromBilling(businessId, await subscriptionsOfBusiness(tx, businessId), now);
}
