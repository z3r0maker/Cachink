'use server';

import { ToggleFeatureFlagUseCase } from '@xangarro/application';
import {
  FEATURE_FLAG_KEYS,
  PLATFORM_AVAILABLE,
  type BusinessId,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { tenantEntitlement } from '../billing/plan';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { pgBusinessesRepository } from '../repositories/businesses';

/**
 * Switch a business feature on or off (P-15). The rules — dependencies, the
 * cascade when a parent goes off — are `ToggleFeatureFlagUseCase`'s, the same
 * one the phone runs. What only the server can add is **what may be turned
 * on**: released on the platform and included in the plan. Refused here, not
 * merely hidden in the screen.
 *
 * `businesses` is a DOWN table, so the write is logged and every phone gets it
 * on its next pull.
 */
export type FuncionResult = { ok: true; flags: FeatureFlags } | { ok: false; message: string };

const KNOWN = new Set([
  'FLAG_NOT_ALLOWED',
  'FLAG_DEPENDENCY',
  'BUSINESS_NOT_FOUND',
  'NOT_PERMITTED',
]);

/** Released on the platform ∩ included in the business's plan (B-10). */
function allowedKeys(inPlan: readonly string[]): ReadonlySet<FeatureFlagKey> {
  return new Set(FEATURE_FLAG_KEYS.filter((k) => PLATFORM_AVAILABLE[k] && inPlan.includes(k)));
}

export async function cambiarFuncion(key: FeatureFlagKey, on: boolean): Promise<FuncionResult> {
  try {
    const session = await requireMember('owner');
    const businessId = session.business_id as BusinessId;
    const flags = await withTenant(businessId, async (tx) =>
      new ToggleFeatureFlagUseCase(pgBusinessesRepository(tx, businessId)).execute({
        businessId,
        flagKey: key,
        newValue: on,
        allowed: allowedKeys((await tenantEntitlement(tx, businessId, new Date())).features),
      }),
    );
    revalidatePath('/negocio');
    return { ok: true, flags };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (error instanceof Error && code !== undefined && KNOWN.has(code)) {
      return { ok: false, message: error.message };
    }
    reportError(error, { endpoint: 'cambiarFuncion' });
    return { ok: false, message: 'No pudimos guardar el cambio. Intenta de nuevo.' };
  }
}
