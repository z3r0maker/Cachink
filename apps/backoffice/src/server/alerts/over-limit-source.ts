import { PLAN_LABELS } from '../tenants/labels';
import { listUsage, type UsageListDeps } from '../usage/list';
import type { UsageRow } from '../usage/row';
import type { OverLimitRow, OverLimitSource } from './over-limit';

/**
 * The over-limit tenants, by `/uso`'s own filter (`filtro: 'sobre'`) — one
 * page of 100, which is the digest's whole appetite; `partial` says when the
 * scan stopped before the end.
 */
function worstPercent(r: UsageRow): number {
  const ps = Object.values(r.current).map((m) => m.percent ?? 0);
  return Math.round(Math.max(0, ...ps));
}

function toRow(r: UsageRow): OverLimitRow {
  return {
    nombre: r.tenant.nombre,
    plan: r.plan.effective === null ? null : PLAN_LABELS[r.plan.effective],
    percent: worstPercent(r),
    twoMonths: r.twoMonthsOver,
  };
}

export function usageOverLimitSource(deps: UsageListDeps): OverLimitSource {
  return {
    async list(now) {
      const result = await listUsage(deps, { filtro: 'sobre', limit: 100 }, now);
      return {
        rows: result.rows.map(toRow),
        partial: result.partial || result.nextCursor !== null,
      };
    },
  };
}
