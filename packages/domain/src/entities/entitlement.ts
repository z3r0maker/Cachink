/**
 * Entitlement — what the server says this business may do, signed so the
 * phone can verify it offline (docs/plan/02-contracts.md §6, ADR-053 §5).
 *
 * No crypto here: signing lives in the backend, verification in the app.
 * This module owns the payload shape and the two-clock state machine.
 */

import { z } from 'zod';
import { FEATURE_FLAG_KEYS } from './feature-flags.js';
import { PlanIdSchema } from './plan.js';

const isoDate = z.string().refine((v) => Number.isFinite(Date.parse(v)), 'ISO-8601 date');

export const EntitlementSchema = z.object({
  businessId: z.string().min(1),
  plan: PlanIdSchema,
  limits: z.object({
    operators: z.number().int().nonnegative(),
    devices: z.number().int().nonnegative(),
    recordsPerMonth: z.number().int().positive().nullable(),
  }),
  features: z.array(z.enum(FEATURE_FLAG_KEYS)),
  validUntil: isoDate,
  graceUntil: isoDate,
  issuedAt: isoDate,
  serverTime: isoDate,
  version: z.literal(1),
});
export type Entitlement = z.infer<typeof EntitlementSchema>;

export type EntitlementState = 'active' | 'grace' | 'lapsed';

const DAY_MS = 86_400_000;
/** Offline tolerance before the phone stops trusting a stale entitlement. */
export const OFFLINE_STALENESS_MS = 30 * DAY_MS;
/** Extra window after staleness in which the app warns instead of falling back. */
export const OFFLINE_GRACE_MS = 7 * DAY_MS;

export interface EntitlementClock {
  /** `max(deviceNow, lastServerTimeSeen)` — never the raw device clock. */
  readonly nowAnchored: string;
  /** When the last successful pull happened; `null` = never. */
  readonly lastPullAt: string | null;
}

function stalenessState(clock: EntitlementClock, now: number): EntitlementState {
  if (clock.lastPullAt === null) return 'active';
  const staleness = now - Date.parse(clock.lastPullAt);
  if (staleness < OFFLINE_STALENESS_MS) return 'active';
  if (staleness < OFFLINE_STALENESS_MS + OFFLINE_GRACE_MS) return 'grace';
  return 'lapsed';
}

function worst(a: EntitlementState, b: EntitlementState): EntitlementState {
  const rank: Record<EntitlementState, number> = { active: 0, grace: 1, lapsed: 2 };
  return rank[a] >= rank[b] ? a : b;
}

/** Two clocks (payment window, offline staleness); the worse one wins. Malformed input → lapsed. */
export function entitlementState(ent: Entitlement, clock: EntitlementClock): EntitlementState {
  const now = Date.parse(clock.nowAnchored);
  const validUntil = Date.parse(ent.validUntil);
  const graceUntil = Date.parse(ent.graceUntil);
  if (![now, validUntil, graceUntil].every(Number.isFinite)) return 'lapsed';
  const payment: EntitlementState =
    now < validUntil ? 'active' : now < graceUntil ? 'grace' : 'lapsed';
  return worst(payment, stalenessState(clock, now));
}
