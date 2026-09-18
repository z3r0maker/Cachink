import 'server-only';

import { billingStatusSnapshot, type BillingStatusSnapshot } from '@xangarro/application/billing';
import { subscriptionsOfBusiness } from '@xangarro/data-pg';
import type { PlanId } from '@xangarro/domain';
import { sql } from 'drizzle-orm';

import { tenantEntitlement } from './billing/plan';
import { withTenant } from './db';
import { usageFor } from './usage/live';

/**
 * Suscripción's read model (P-10): Stripe's status as the webhook stored it,
 * this month's real consumption, and the entitlement the phones are signed —
 * one tenant transaction, plus the metering counter when it is configured
 * (`null` renders as «—», never as a made-up number).
 */
export interface SuscripcionData {
  readonly estado: BillingStatusSnapshot | null;
  readonly uso: {
    readonly operadores: number;
    readonly dispositivos: number;
    readonly registros: number | null;
  };
  readonly recibe: { readonly plan: PlanId; readonly validUntil: string };
}

type Counts = { operadores: number; dispositivos: number };

export async function loadSuscripcion(businessId: string): Promise<SuscripcionData> {
  const now = new Date();
  const base = await withTenant(businessId, async (tx) => {
    const [c] = await tx.execute<Counts>(sql`
      SELECT (SELECT count(*)::int FROM users WHERE role = 'operativo' AND active AND deleted_at IS NULL) AS operadores,
             (SELECT count(*)::int FROM devices WHERE revoked_at IS NULL) AS dispositivos`);
    const ent = await tenantEntitlement(tx, businessId, now);
    return {
      estado: billingStatusSnapshot(await subscriptionsOfBusiness(tx, businessId)),
      counts: c ?? { operadores: 0, dispositivos: 0 },
      recibe: { plan: ent.plan, validUntil: ent.validUntil },
    };
  });
  const uso = await usageFor(businessId, now).catch(() => null);
  return {
    estado: base.estado,
    uso: { ...base.counts, registros: uso?.transactions ?? null },
    recibe: base.recibe,
  };
}
