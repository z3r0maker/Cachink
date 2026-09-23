import 'server-only';

import { entitlementFromBilling, type EntitlementInputs } from '@xangarro/application/billing';
import {
  subscriptionsOfBusiness,
  tenantPlanOverrides,
  tenantPlatformRules,
} from '@xangarro/data-pg';
import {
  PLATFORM_FLAG_DEFAULTS,
  resolvePlatformFlags,
  type Entitlement,
  type PlatformFlagDefaults,
  type PlatformFlagKey,
} from '@xangarro/domain';

import type { Tx } from '../db';

/**
 * The one place the portal learns what a business may do (B-10, N-09, N-06).
 *
 * Reads, inside the caller's **tenant** transaction, the business's
 * subscriptions, the platform flags the console released to it and the plan
 * overrides staff granted it, and runs the one entitlement rule over all
 * three. Activation, pull, `GET /entitlement`, the session, the operator
 * allowance and the Funciones switches all come here, so the phone and the
 * portal can never disagree — and a flag flipped in the console reaches both
 * on their next request.
 */

/**
 * Code defaults for keys the console never touched. Outside production the
 * Asesor's model is on, so «locally nothing is gated» (ADR-059); in
 * production `asesorLlm` stays off until staff switch it on.
 */
export function platformDefaults(
  env: string | undefined = process.env.NODE_ENV,
): PlatformFlagDefaults {
  return env === 'production'
    ? PLATFORM_FLAG_DEFAULTS
    : { ...PLATFORM_FLAG_DEFAULTS, asesorLlm: true };
}

export async function tenantEntitlementInputs(
  tx: Tx,
  businessId: string,
): Promise<EntitlementInputs> {
  const [rules, overrides] = [await tenantPlatformRules(tx), await tenantPlanOverrides(tx)];
  return { overrides, platform: resolvePlatformFlags(businessId, rules, platformDefaults()) };
}

export interface TenantAccess {
  readonly entitlement: Entitlement;
  /** Every platform key for this business, kill switches included. */
  readonly platform: Readonly<Record<PlatformFlagKey, boolean>>;
}

export async function tenantAccess(tx: Tx, businessId: string, now: Date): Promise<TenantAccess> {
  const inputs = await tenantEntitlementInputs(tx, businessId);
  const rows = await subscriptionsOfBusiness(tx, businessId);
  return {
    entitlement: entitlementFromBilling(businessId, rows, now, inputs),
    platform: inputs.platform,
  };
}

export async function tenantEntitlement(
  tx: Tx,
  businessId: string,
  now: Date,
): Promise<Entitlement> {
  return (await tenantAccess(tx, businessId, now)).entitlement;
}
