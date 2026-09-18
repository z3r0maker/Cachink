import { and, desc, eq, gt, inArray, isNull, lte, or } from 'drizzle-orm';
import { PlanOverrideSchema, type PlanOverride } from '@xangarro/domain';

import type { PlanOverrideRepository } from '../tenants/port';
import type { Db, Tx } from './client';
import { planOverrides, type PlanOverrideRow } from './override-schema';

/**
 * Postgres adapter for `PlanOverrideRepository`. Rows are re-validated on the
 * way out, so a row the CHECKs let through but the domain would refuse
 * surfaces as an error instead of reaching a screen — or an entitlement.
 */
function toOverride(row: PlanOverrideRow): PlanOverride {
  const { days, planId, reason, ...rest } = row;
  return PlanOverrideSchema.parse({
    ...rest,
    ...(days === null ? {} : { days }),
    ...(planId === null ? {} : { planId }),
    ...(reason === null ? {} : { reason }),
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
  });
}

function toRow(o: PlanOverride): PlanOverrideRow {
  return {
    id: o.id,
    businessId: o.businessId,
    kind: o.kind,
    days: o.kind === 'extend_trial' ? o.days : null,
    planId: o.kind === 'comp_plan' ? o.planId : null,
    reason: o.kind === 'comp_plan' ? o.reason : null,
    expiresAt: o.expiresAt === null ? null : new Date(o.expiresAt),
    createdBy: o.createdBy,
    createdAt: new Date(o.createdAt),
  };
}

export function drizzlePlanOverrides(conn: Db | Tx): PlanOverrideRepository {
  const t = planOverrides;
  return {
    async insert(override) {
      await conn.insert(t).values(toRow(override));
    },
    async listFor(businessId) {
      const rows = await conn
        .select()
        .from(t)
        .where(eq(t.businessId, businessId))
        .orderBy(desc(t.createdAt), desc(t.id));
      return rows.map(toOverride);
    },
    async activeFor(ids, now) {
      if (ids.length === 0) return [];
      const rows = await conn
        .select()
        .from(t)
        .where(
          and(
            inArray(t.businessId, [...ids]),
            lte(t.createdAt, now),
            or(isNull(t.expiresAt), gt(t.expiresAt, now)),
          ),
        );
      return rows.map(toOverride);
    },
  };
}
