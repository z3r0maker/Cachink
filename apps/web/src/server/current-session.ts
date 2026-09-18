import 'server-only';

import { getBusiness } from '@xangarro/data-pg';
import {
  FEATURE_FLAG_KEYS,
  PLATFORM_AVAILABLE,
  parseFeatureFlags,
  type Entitlement,
  type FeatureFlagKey,
} from '@xangarro/domain';

import type { Role, Session } from '@/session/types';

import { requireSession } from './auth';
import { tenantEntitlement } from './billing/plan';
import { withTenant } from './db';

/**
 * The `Session` the screens render from, assembled server-side.
 *
 * Identity and role are the signed cookie and `business_members`; the name is
 * the business row. `planId`, `capabilities` and `features` come from the
 * business's subscription through `tenantEntitlement` (B-10) — the same
 * entitlement its phones are signed — read in the same tenant transaction.
 *
 * `features` is resolved three ways, as on the phone: released on the
 * platform, included in the plan, and switched on by the owner (P-15).
 */
function resolveFeatures(
  entitlement: Entitlement,
  flagsJson: string | undefined,
): Record<FeatureFlagKey, boolean> {
  const tenant = parseFeatureFlags(flagsJson ?? '{}');
  const inPlan = new Set<string>(entitlement.features);
  return Object.fromEntries(
    FEATURE_FLAG_KEYS.map((k) => [k, PLATFORM_AVAILABLE[k] && inPlan.has(k) && tenant[k]]),
  ) as Record<FeatureFlagKey, boolean>;
}

export async function currentSession(): Promise<Session> {
  const claims = await requireSession();
  const businessId = claims.business_id;

  const { business, entitlement } = await withTenant(businessId, async (tx) => ({
    business: await getBusiness(tx),
    entitlement: await tenantEntitlement(tx, businessId, new Date()),
  }));

  return {
    role: claims.member_role as Role,
    businessId,
    businessName: business?.nombre ?? 'Tu negocio',
    planId: entitlement.plan,
    capabilities: entitlement.capabilities,
    features: resolveFeatures(entitlement, business?.featureFlags),
  };
}
