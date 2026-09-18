/**
 * Threshold crossings (N-03, ADR-065). Pure detection: the caller records
 * each crossing under its `idempotencyKey` and fires it at most once.
 *
 * 80 % → owner; 100 % → owner + provider; 150 % → provider. Nothing here
 * blocks a write — a crossing is a notice, on every tier.
 */

import { UsageSnapshotMismatchError } from './errors.js';
import { assertUsageLimits, limitFor, reaches } from './limits.js';
import { THRESHOLD_MESSAGE_CODE, type UsageMessageCode } from './messages.js';
import { assertUsagePeriod } from './usage-period.js';
import {
  USAGE_METRICS,
  USAGE_THRESHOLDS,
  type UsageLimits,
  type UsageMetric,
  type UsagePeriod,
  type UsageRecipient,
  type UsageSnapshot,
  type UsageThreshold,
} from './types.js';

export interface ThresholdCrossing {
  readonly businessId: string;
  readonly period: UsagePeriod;
  readonly metric: UsageMetric;
  readonly threshold: UsageThreshold;
  readonly recipients: readonly UsageRecipient[];
  readonly messageCode: UsageMessageCode;
  /** `(businessId, period, metric, threshold)` — fire once per key. */
  readonly idempotencyKey: string;
}

export const THRESHOLD_RECIPIENTS = {
  80: ['owner'],
  100: ['owner', 'provider'],
  150: ['provider'],
} as const satisfies Record<UsageThreshold, readonly UsageRecipient[]>;

function previousValue(prev: UsageSnapshot | null, next: UsageSnapshot, metric: UsageMetric) {
  if (prev === null || prev.period !== next.period) return 0;
  return prev[metric];
}

function crossing(next: UsageSnapshot, metric: UsageMetric, threshold: UsageThreshold) {
  const { businessId, period } = next;
  return {
    businessId,
    period,
    metric,
    threshold,
    recipients: THRESHOLD_RECIPIENTS[threshold],
    messageCode: THRESHOLD_MESSAGE_CODE[threshold],
    idempotencyKey: `${businessId}:${period}:${metric}:${threshold}`,
  } satisfies ThresholdCrossing;
}

/**
 * Thresholds that `next` reaches and `prev` did not, ordered by metric then
 * threshold. A `prev` from another period (or none) counts as zero, so the
 * first computation of a month reports everything already reached.
 */
export function crossedThresholds(
  prev: UsageSnapshot | null,
  next: UsageSnapshot,
  limits: UsageLimits,
): ThresholdCrossing[] {
  assertUsageLimits(limits);
  assertUsagePeriod(next.period);
  if (prev !== null && prev.businessId !== next.businessId) {
    throw new UsageSnapshotMismatchError(prev.businessId, next.businessId);
  }
  const out: ThresholdCrossing[] = [];
  for (const metric of USAGE_METRICS) {
    const limit = limitFor(limits, metric);
    const before = previousValue(prev, next, metric);
    for (const threshold of USAGE_THRESHOLDS) {
      if (reaches(next[metric], limit, threshold) && !reaches(before, limit, threshold)) {
        out.push(crossing(next, metric, threshold));
      }
    }
  }
  return out;
}
