/**
 * Subscription plans and what each one entitles (ADR-053 §5, docs/plan Q14).
 *
 * "Usuario" on the pricing card means Operator; device slots equal the
 * operator count; portal members are unlimited on every plan. Prices are
 * NOT modelled here — they live in Stripe and `billing.plans`.
 */

import { z } from 'zod';
import type { FeatureFlagKey } from './feature-flags.js';

export const PLAN_IDS = ['freelancer', 'emprendedor', 'mipyme_pro'] as const;
export const PlanIdSchema = z.enum(PLAN_IDS);
export type PlanId = z.infer<typeof PlanIdSchema>;

export interface PlanLimits {
  /** Max active Operators (PIN users). */
  readonly operators: number;
  /** Max active devices — equals `operators` by decision. */
  readonly devices: number;
  /** Records (ventas + gastos + movimientos) per server-anchored month; `null` = unlimited. */
  readonly recordsPerMonth: number | null;
  /** Feature keys the plan includes. Platform availability still gates them. */
  readonly features: readonly FeatureFlagKey[];
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  freelancer: { operators: 1, devices: 1, recordsPerMonth: 50, features: [] },
  emprendedor: {
    operators: 2,
    devices: 2,
    recordsPerMonth: null,
    features: ['stock', 'barcode', 'ventasCredito'],
  },
  mipyme_pro: {
    operators: 5,
    devices: 5,
    recordsPerMonth: null,
    features: [
      'stock',
      'barcode',
      'ventasCredito',
      'merma',
      'conversionMateriaPrima',
      'conversionAutomatica',
      'auditoriaInventario',
    ],
  },
} as const;

/** The plan a lapsed or unknown entitlement falls back to — never "locked". */
export const FALLBACK_PLAN: PlanId = 'freelancer';
