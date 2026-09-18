/**
 * The admin inbox items the usage recompute files (N-03 → N-08, kind
 * `limite`). The provider is told at 100 % and 150 % of a limit, and once per
 * period when a business was over for two closed months in a row.
 */

import type { ThresholdCrossing, UsagePeriod } from '@xangarro/domain/usage';

import type { InboxItemRequest } from '../support-inbox/index.js';

const METRIC_LABEL = {
  transactions: 'transacciones del mes',
  activeProducts: 'productos activos',
} as const;

export function limitItem(
  crossing: ThresholdCrossing,
  value: number,
  limit: number,
): InboxItemRequest {
  const metric = METRIC_LABEL[crossing.metric];
  return {
    kind: 'limite',
    urgent: false,
    businessId: crossing.businessId,
    title: `Límite al ${crossing.threshold} %: ${metric} (${crossing.period})`,
    body: `${value} de ${limit} ${metric} en ${crossing.period}. Nunca se bloquea una operación.`,
    source: 'usage-cron',
    sourceRef: crossing.idempotencyKey,
    paymentRef: null,
  };
}

export function upgradeKey(businessId: string, period: UsagePeriod): string {
  return `${businessId}:${period}:upgrade`;
}

export function upgradeItem(businessId: string, period: UsagePeriod): InboxItemRequest {
  return {
    kind: 'limite',
    urgent: false,
    businessId,
    title: `Sugerir upgrade (${period})`,
    body: 'Dos meses cerrados seguidos al 100 % o más de algún límite de su plan.',
    source: 'usage-cron',
    sourceRef: upgradeKey(businessId, period),
    paymentRef: null,
  };
}
