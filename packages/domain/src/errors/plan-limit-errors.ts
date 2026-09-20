/**
 * Typed errors for plan limits (A-10, Q14).
 *
 * Thrown before a capture is created when the business already used its
 * plan's records for the server-anchored month. The server always accepts;
 * the limit is enforced on the phone and is informational — the UI shows
 * where to upgrade, never a purchase flow.
 */

import type { PlanId } from '../entities/plan.js';

export class PlanLimitError extends Error {
  readonly code = 'PLAN_LIMIT_RECORDS' as const;
  readonly limit: number;
  readonly plan: PlanId;

  constructor(plan: PlanId, limit: number) {
    super(`Llegaste a ${limit} registros este mes.`);
    this.name = 'PlanLimitError';
    this.plan = plan;
    this.limit = limit;
  }
}
