/**
 * Message codes for limit notices (ADR-069). Codes only: the phone maps them
 * to neutral copy ("Este negocio está cerca de su límite mensual. Avisamos
 * al dueño."); the portal and email map them to their own copy, where the
 * upsell lives. Nothing here names a plan or a price.
 */

import { anyMetricReaches, assertUsageLimits } from './limits.js';
import type { UsageCounts, UsageLimits, UsageThreshold } from './types.js';

export const USAGE_MESSAGE_CODES = [
  'USAGE_NEAR_LIMIT',
  'USAGE_AT_LIMIT',
  'USAGE_WELL_OVER_LIMIT',
  'PRODUCT_CAP_REACHED',
] as const;
export type UsageMessageCode = (typeof USAGE_MESSAGE_CODES)[number];

export const THRESHOLD_MESSAGE_CODE = {
  80: 'USAGE_NEAR_LIMIT',
  100: 'USAGE_AT_LIMIT',
  150: 'USAGE_WELL_OVER_LIMIT',
} as const satisfies Record<UsageThreshold, UsageMessageCode>;

/**
 * The phone/portal banner for the current counts, or `null` for none.
 * The phone does not distinguish 150 %: both are "at limit".
 */
export function usageMessageCode(
  counts: UsageCounts,
  limits: UsageLimits,
): 'USAGE_NEAR_LIMIT' | 'USAGE_AT_LIMIT' | null {
  assertUsageLimits(limits);
  if (anyMetricReaches(counts, limits, 100)) return 'USAGE_AT_LIMIT';
  if (anyMetricReaches(counts, limits, 80)) return 'USAGE_NEAR_LIMIT';
  return null;
}
