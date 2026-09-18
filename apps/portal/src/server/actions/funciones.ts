'use server';

import { ToggleFeatureFlagUseCase } from '@xangarro/application';
import {
  FEATURE_FLAG_KEYS,
  PLAN_LIMITS,
  PLATFORM_AVAILABLE,
  type BusinessId,
  type FeatureFlagKey,
  type FeatureFlags,
} from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { PLAN_FIXTURE } from '@/fixtures/business';

import { requireMember } from '../auth';
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

function allowedKeys(): ReadonlySet<FeatureFlagKey> {
  // The plan is still the fixture's until B-10 gives each business its own.
  const inPlan = PLAN_LIMITS[PLAN_FIXTURE.planId].features;
  return new Set(FEATURE_FLAG_KEYS.filter((k) => PLATFORM_AVAILABLE[k] && inPlan.includes(k)));
}

export async function cambiarFuncion(key: FeatureFlagKey, on: boolean): Promise<FuncionResult> {
  try {
    const session = await requireMember('owner');
    const businessId = session.business_id as BusinessId;
    const flags = await withTenant(businessId, (tx) =>
      new ToggleFeatureFlagUseCase(pgBusinessesRepository(tx, businessId)).execute({
        businessId,
        flagKey: key,
        newValue: on,
        allowed: allowedKeys(),
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
