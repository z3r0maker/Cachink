/**
 * Usage metering and limit thresholds (N-02 / N-03 / N-04, ADR-065, OQ-5).
 * Pure functions; the server use case and the phone estimate share them.
 */

export * from './types.js';
export * from './errors.js';
export {
  APERTURA_MOTIVO,
  countsTowardUsage,
  classifyMovementOrigin,
  PORTAL_DEVICE_ID,
} from './counts-toward-usage.js';
export {
  DEFAULT_USAGE_TIME_ZONE,
  usagePeriod,
  isUsagePeriod,
  assertUsagePeriod,
  nextUsagePeriod,
  previousUsagePeriod,
} from './usage-period.js';
export { usageLimitsOf } from './plan-limits.js';
export { computeUsage } from './compute-usage.js';
export { assertUsageLimits, limitFor } from './limits.js';
export {
  USAGE_MESSAGE_CODES,
  THRESHOLD_MESSAGE_CODE,
  usageMessageCode,
  type UsageMessageCode,
} from './messages.js';
export { crossedThresholds, THRESHOLD_RECIPIENTS, type ThresholdCrossing } from './thresholds.js';
export { consecutiveMonthsOver, type ConsecutiveMonthsOptions } from './consecutive-months.js';
export { canCreateProduct, isFreePlan, type ProductCapResult } from './product-cap.js';
