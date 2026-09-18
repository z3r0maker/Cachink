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
import { PLAN_LIMITS, type Entitlement } from '@xangarro/domain';
import { isNull } from 'drizzle-orm';

import { PLAN_FIXTURE } from '@/fixtures/business';

import type { Tx } from '../db';

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

const TIMESTAMPS = ['createdAt', 'updatedAt', 'deletedAt'] as const;

type Row = Record<string, unknown>;

function toWire(row: Row): Row {
  const out: Row = { ...row };
  for (const key of TIMESTAMPS) {
    const v = out[key];
    if (typeof v === 'string') out[key] = new Date(v).toISOString();
  }
  return out;
}

/**
 * Columns stored as JSON text for device parity, which the **domain** types as
 * structures. They must be decoded or `wireSchema(DomainSchema)` rejects them.
 *
 * Deliberately absent: `users.permissions`. It is also JSON text, but
 * `UserSchema` does not declare it — the phone decodes it itself with
 * `parsePermissions` — so it travels as the string it is. Decoding it here
 * would send a shape the phone does not expect.
 *
 * Found by the conformance suite, which failed on `atributosProducto` alone.
 */
function decodeJson(row: Row, columns: readonly string[]): Row {
  const out: Row = { ...row };
  for (const c of columns) {
    if (typeof out[c] === 'string') out[c] = JSON.parse(out[c] as string) as unknown;
  }
  return out;
}

const productToWire = (row: Row): Row => toWire(decodeJson(row, ['atributos']));
const businessToWire = (row: Row): Row => toWire(decodeJson(row, ['atributosProducto']));

/** Operators never carry an email over the wire (contract §5). */
function userToWire(row: Row): Row {
  const { email: _email, ...rest } = row;
  return toWire(rest);
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
    businesses: b.map((row) => businessToWire(row as Row)),
    products: p.map((row) => productToWire(row as Row)),
    clients: c.map((row) => toWire(row as Row)),
    users: u.map((row) => userToWire(row as Row)),
    employees: e.map((row) => toWire(row as Row)),
    recurring_expenses: r.map((row) => toWire(row as Row)),
    conversion_recetas: cr.map((row) => toWire(row as Row)),
    // Tenant layer only; the device resolves platform × plan itself (§3).
    feature_flags: { ...PLAN_FIXTURE.features },
  };
}

/**
 * The entitlement for this business.
 *
 * The plan is still the fixture plan: plans ride in `billing.subscriptions`,
 * which has no writer until payments land (B-10). This is the one place that
 * changes when it does. Validity windows mirror the contract's reference mock.
 */
export function entitlementFor(businessId: string, now: Date): Entitlement {
  const DAY = 86_400_000;
  const plan = PLAN_FIXTURE.planId;
  const limits = PLAN_LIMITS[plan];
  const validUntil = now.getTime() + 30 * DAY;
  return {
    businessId,
    plan,
    limits: {
      operators: limits.operators,
      devices: limits.devices,
      recordsPerMonth: limits.recordsPerMonth,
    },
    features: [...limits.features],
    capabilities: { ...limits.capabilities },
    validUntil: new Date(validUntil).toISOString(),
    graceUntil: new Date(validUntil + 7 * DAY).toISOString(),
    issuedAt: now.toISOString(),
    serverTime: now.toISOString(),
    version: 1,
  };
}
