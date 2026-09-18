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
import { parseFeatureFlags, type Entitlement, type FeatureFlags } from '@xangarro/domain';
import { isNull } from 'drizzle-orm';

import { tenantEntitlement } from '../billing/plan';
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

/**
 * The tenant layer only — what the owner switched on in Funciones (P-15). The
 * device resolves platform × plan × tenant itself (§3).
 */
export async function tenantFeatureFlags(tx: Tx): Promise<FeatureFlags> {
  const [row] = await tx.select({ flags: businesses.featureFlags }).from(businesses);
  return parseFeatureFlags(row?.flags ?? '{}');
}

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
    feature_flags: await tenantFeatureFlags(tx),
  };
}

/**
 * The entitlement for this business: `computeEntitlement` over its
 * `subscriptions` rows (B-10), read inside the caller's tenant transaction —
 * activation, pull and `GET /entitlement` all hold one. No row is the free
 * plan; the rules (grace, Q14's lapse to the free plan) are the application's.
 */
export function entitlementFor(tx: Tx, businessId: string, now: Date): Promise<Entitlement> {
  return tenantEntitlement(tx, businessId, now);
}
