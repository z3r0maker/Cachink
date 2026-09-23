/**
 * A staff override of what a tenant's plan entitles (N-06, ADR-063) — a
 * **portal-only** entity under ADR-060: Postgres only, absent from `scope.ts`,
 * never synced. Stripe stays the billing source of truth; an override is a
 * staff-made, audited, expiring exception layered on top of it.
 *
 * - `extend_trial` — `days` more of trial. Expires.
 * - `comp_plan` — a paid plan for free (beta testers, N-30), with a reason. Expires.
 * - `reissue_entitlement` — a flag: the next pull must carry a freshly signed
 *   token. Changes nothing about the plan; may expire, need not.
 *
 * Overrides are append-only: they end by expiring, never by being edited or
 * deleted, so the history of every exception survives.
 *
 * `effectivePlan` is the one rule for combining them. It is pure so that the
 * console and B-06's `computeEntitlement` apply exactly the same thing.
 *
 * The branded id is declared here rather than in `ids/index.ts` because
 * nothing outside the admin console and the entitlement builder reads it.
 */

import { z } from 'zod';

import type { BusinessId, Ulid } from '../ids/index.js';
import { PLAN_IDS, PlanIdSchema, type PlanId } from './plan.js';
import type { StaffMemberId } from './staff.js';
import { ulidField } from './_ulid-field.js';

export type PlanOverrideId = Ulid & { readonly __entity: 'PlanOverride' };
export const PlanOverrideIdSchema = ulidField<PlanOverrideId>();

export const PLAN_OVERRIDE_KINDS = ['extend_trial', 'comp_plan', 'reissue_entitlement'] as const;
export type PlanOverrideKind = (typeof PLAN_OVERRIDE_KINDS)[number];

/** Longest single trial extension staff may grant. */
export const MAX_TRIAL_EXTENSION_DAYS = 90;

const isoInstant = z.iso.datetime({ offset: true });

const common = {
  id: PlanOverrideIdSchema,
  businessId: ulidField<BusinessId>(),
  createdBy: ulidField<StaffMemberId>(),
  createdAt: isoInstant,
};

const ExtendTrialSchema = z.object({
  ...common,
  kind: z.literal('extend_trial'),
  days: z.number().int().min(1).max(MAX_TRIAL_EXTENSION_DAYS),
  expiresAt: isoInstant,
});

/** Comping the free plan would be a no-op, so it is refused rather than stored. */
const CompPlanSchema = z.object({
  ...common,
  kind: z.literal('comp_plan'),
  planId: PlanIdSchema.exclude(['xangarrito']),
  reason: z.string().trim().min(3).max(500),
  expiresAt: isoInstant,
});

const ReissueSchema = z.object({
  ...common,
  kind: z.literal('reissue_entitlement'),
  expiresAt: isoInstant.nullable(),
});

export const PlanOverrideSchema = z
  .discriminatedUnion('kind', [ExtendTrialSchema, CompPlanSchema, ReissueSchema])
  .refine((o) => o.expiresAt === null || Date.parse(o.expiresAt) > Date.parse(o.createdAt), {
    path: ['expiresAt'],
    message: 'El vencimiento debe ser posterior a la creación.',
  });
export type PlanOverride = z.infer<typeof PlanOverrideSchema>;

/**
 * An override as the entitlement builder sees it: everything the rule reads,
 * nothing staff wrote for staff (no author, no reason, no business id — the
 * portal reads its own tenant's rows only, through `tenant_plan_overrides`).
 * Every `PlanOverride` is one, so the console passes its rows unchanged.
 */
export type PlanOverrideFacts = PlanOverride extends infer O
  ? O extends PlanOverride
    ? Omit<O, 'createdBy' | 'reason' | 'businessId'>
    : never
  : never;

export interface EffectivePlan {
  /** The base plan, lifted by the highest active comp — never lowered. */
  readonly plan: PlanId;
  /** The comp that set `plan`, or null when the base plan stands. */
  readonly compedBy: PlanOverrideId | null;
  /** When that comp ends; the entitlement must not outlive it. */
  readonly compedUntil: string | null;
  /** Sum of every active `extend_trial`; applies only while trialing. */
  readonly trialExtensionDays: number;
  /** Latest active reissue request; a token issued before it is stale. */
  readonly reissueRequestedAt: string | null;
}

/** Active on `[createdAt, expiresAt)`; a null expiry never ends. */
export function isOverrideActive(o: PlanOverrideFacts, now: Date): boolean {
  const t = now.getTime();
  if (Date.parse(o.createdAt) > t) return false;
  return o.expiresAt === null || t < Date.parse(o.expiresAt);
}

const rank = (plan: PlanId): number => PLAN_IDS.indexOf(plan);
/** Instants compared as numbers: two ISO strings with different offsets do not sort as text. */
const ms = (iso: string): number => Date.parse(iso);

type Comp = Extract<PlanOverrideFacts, { kind: 'comp_plan' }>;

function bestComp(comps: readonly Comp[]): Comp | null {
  let best: Comp | null = null;
  for (const c of comps) {
    const higher = best === null || rank(c.planId) > rank(best.planId);
    const sameButLonger =
      best !== null && c.planId === best.planId && ms(c.expiresAt) > ms(best.expiresAt);
    if (higher || sameButLonger) best = c;
  }
  return best;
}

export function effectivePlan(
  basePlan: PlanId,
  overrides: readonly PlanOverrideFacts[],
  now: Date,
): EffectivePlan {
  const active = overrides.filter((o) => isOverrideActive(o, now));
  const comp = bestComp(active.filter((o): o is Comp => o.kind === 'comp_plan'));
  const lifts = comp !== null && rank(comp.planId) > rank(basePlan);
  let trialExtensionDays = 0;
  let reissueRequestedAt: string | null = null;
  for (const o of active) {
    if (o.kind === 'extend_trial') trialExtensionDays += o.days;
    if (
      o.kind === 'reissue_entitlement' &&
      (reissueRequestedAt === null || ms(reissueRequestedAt) < ms(o.createdAt))
    ) {
      reissueRequestedAt = o.createdAt;
    }
  }
  return {
    plan: lifts ? comp.planId : basePlan,
    compedBy: lifts ? comp.id : null,
    compedUntil: lifts ? comp.expiresAt : null,
    trialExtensionDays,
    reissueRequestedAt,
  };
}
