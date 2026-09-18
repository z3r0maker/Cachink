/**
 * Subscription plans and what each one entitles (ADR-053 §5, docs/plan Q14).
 *
 * "Usuario" on the pricing card means Operator; device slots equal the
 * operator count; portal members are unlimited on every plan. Prices are
 * NOT modelled here — they live in Stripe and `billing.plans`.
 */

import { z } from 'zod';
import type { FeatureFlagKey } from './feature-flags.js';

export const PLAN_IDS = ['xangarrito', 'xangarro', 'xangarrote'] as const;
export const PlanIdSchema = z.enum(PLAN_IDS);
export type PlanId = z.infer<typeof PlanIdSchema>;

/**
 * Plan-level capabilities that a tenant cannot toggle (ADR-059).
 *
 * Distinct from `FeatureFlagKey`, which is the set of business capabilities a
 * Director opts into from Negocio → Funciones. Nobody switches off their own
 * financial statements, and the Asesor is tiered by cadence rather than on or
 * off — six booleans that must move together would admit sixty-one invalid
 * plans where one enum admits none.
 */
export interface PlanCapabilities {
  /** NIF statements. Xangarrito does not include them. */
  readonly estadosFinancieros: boolean;
  /** The formatted monthly PDF for the contador. */
  readonly informeMensual: boolean;
  /** Per-operator permissions, e.g. who may cancel a sale. */
  readonly permisosPorUsuario: boolean;
  /** How much of the Asesor this plan receives. */
  readonly asesor: 'semanal' | 'diario' | 'completo';
}

export interface PlanLimits {
  /** Max active Operators (PIN users). */
  readonly operators: number;
  /** Max active devices — equals `operators` by decision. */
  readonly devices: number;
  /** Records (ventas + gastos + movimientos) per server-anchored month; `null` = unlimited. */
  readonly recordsPerMonth: number | null;
  /** Feature keys the plan includes. Platform availability still gates them. */
  readonly features: readonly FeatureFlagKey[];
  /** Plan-level gates with no tenant switch. */
  readonly capabilities: PlanCapabilities;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  xangarrito: {
    operators: 1,
    devices: 1,
    recordsPerMonth: 50,
    features: [],
    capabilities: {
      estadosFinancieros: false,
      informeMensual: false,
      permisosPorUsuario: false,
      asesor: 'semanal',
    },
  },
  xangarro: {
    operators: 2,
    devices: 2,
    recordsPerMonth: null,
    features: ['stock', 'barcode', 'ventasCredito'],
    capabilities: {
      estadosFinancieros: true,
      informeMensual: false,
      permisosPorUsuario: false,
      asesor: 'diario',
    },
  },
  xangarrote: {
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
    capabilities: {
      estadosFinancieros: true,
      informeMensual: true,
      permisosPorUsuario: true,
      asesor: 'completo',
    },
  },
} as const;

/** The plan a lapsed or unknown entitlement falls back to — never "locked". */
export const FALLBACK_PLAN: PlanId = 'xangarrito';
