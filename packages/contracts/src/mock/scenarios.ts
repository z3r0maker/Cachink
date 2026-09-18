/**
 * `X-Mock-Scenario` header switches the mock's behaviour per request so a
 * single running server can exercise every branch Track A needs.
 */

import type { Entitlement, PlanId } from '@xangarro/domain';
import { PLAN_LIMITS } from '@xangarro/domain';

export const SCENARIOS = ['xangarro', 'xangarrito', 'grace', 'lapsed', 'revoked', 'flaky'] as const;
export type Scenario = (typeof SCENARIOS)[number];
export const SCENARIO_HEADER = 'x-mock-scenario';

export function scenarioOf(headers: Record<string, string>): Scenario {
  const v = headers[SCENARIO_HEADER];
  return (SCENARIOS as readonly string[]).includes(v ?? '') ? (v as Scenario) : 'xangarro';
}

const DAY = 86_400_000;

export function entitlementFor(scenario: Scenario, businessId: string, now: Date): Entitlement {
  const plan: PlanId = scenario === 'xangarrito' ? 'xangarrito' : 'xangarro';
  const limits = PLAN_LIMITS[plan];
  const t = now.getTime();
  const shift = scenario === 'grace' ? -12 * DAY : scenario === 'lapsed' ? -40 * DAY : 0;
  const validUntil = plan === 'xangarrito' ? t + 36_500 * DAY : t + 30 * DAY + shift;
  return {
    businessId,
    plan,
    limits: {
      operators: limits.operators,
      devices: limits.devices,
      recordsPerMonth: limits.recordsPerMonth,
    },
    features: [...limits.features],
    capabilities: { ...limits.capabilities },
    validUntil: new Date(validUntil).toISOString(),
    graceUntil: new Date(validUntil + 7 * DAY).toISOString(),
    issuedAt: now.toISOString(),
    serverTime: now.toISOString(),
    version: 1,
  };
}

/** Flaky scenario: ~30 % of pushed rows come back INTERNAL/retryable, deterministically by row id. */
export function isFlakyReject(rowId: string): boolean {
  let h = 0;
  for (const ch of rowId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 10 < 3;
}
