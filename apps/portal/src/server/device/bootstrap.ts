import 'server-only';

import {
  businesses,
  clients,
  conversionRecetas,
  employees,
  products,
  recurringExpenses,
  users,
} from '@xangarro/data-pg';
import { computeEntitlement } from '@xangarro/application';
import type { Entitlement } from '@xangarro/domain';
import { isNull } from 'drizzle-orm';

import { PLAN_FIXTURE } from '@/fixtures/business';

import type { Tx } from '../db';
import { rowToWire } from '../sync/codec';

/**
 * The reference tables a phone receives on activation (contract §3), and the
 * entitlement that rides with them.
 *
 * Everything here runs inside the tenant transaction activation opened after
 * redeeming the code, so RLS scopes every read to the business the code
 * belongs to. Nothing takes a business id as a filter.
 *
 * Rows are sent in the **domain** shape, because the contract validates them
 * with `wireSchema(DomainSchema)`. Postgres renders `timestamptz` as
 * `2026-01-02 15:00:00+00`, which is a valid timestamp and not the ISO 8601 the
 * domain requires — the same conversion the portal's repositories do.
 */

/** Tenant layer only; the device resolves platform × plan itself (§3). */
export const tenantFeatureFlags = () => ({ ...PLAN_FIXTURE.features });

export async function referenceTables(tx: Tx) {
  const live = <T extends { deletedAt: unknown }>(t: T) => isNull(t.deletedAt as never);

  const [b, p, c, u, e, r, cr] = await Promise.all([
    tx.select().from(businesses),
    tx.select().from(products).where(live(products)),
    tx.select().from(clients).where(live(clients)),
    tx.select().from(users).where(live(users)),
    tx.select().from(employees).where(live(employees)),
    tx.select().from(recurringExpenses).where(live(recurringExpenses)),
    tx.select().from(conversionRecetas).where(live(conversionRecetas)),
  ]);

  return {
    businesses: b.map((row) => rowToWire('businesses', row)),
    products: p.map((row) => rowToWire('products', row)),
    clients: c.map((row) => rowToWire('clients', row)),
    users: u.map((row) => rowToWire('users', row)),
    employees: e.map((row) => rowToWire('employees', row)),
    recurring_expenses: r.map((row) => rowToWire('recurring_expenses', row)),
    conversion_recetas: cr.map((row) => rowToWire('conversion_recetas', row)),
    feature_flags: tenantFeatureFlags(),
  };
}

/**
 * The entitlement for this business: `computeEntitlement` over its subscription.
 *
 * The subscription is still the fixture plan: plans ride in
 * `billing.subscriptions`, which has no writer until payments land (B-10). This
 * is the one place that changes when it does — the rules (grace, Q14's lapse to
 * the free plan) are already the application's.
 */
export function entitlementFor(businessId: string, now: Date): Entitlement {
  const periodEnd = new Date(now.getTime() + 30 * 86_400_000).toISOString();
  return computeEntitlement(
    businessId,
    { planId: PLAN_FIXTURE.planId, status: 'active', currentPeriodEnd: periodEnd },
    now,
  );
}
