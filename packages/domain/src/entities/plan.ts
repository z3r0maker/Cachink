/**
 * Subscription plans and what each one entitles (ADR-053 §5; the informe cell
 * per ADR-090; limits and cobros per C-12 / ADR-065).
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

/** How a plan is named to people — the header tag, receipts, upsells. */
export const PLAN_NOMBRE: Readonly<Record<PlanId, string>> = {
  xangarrito: 'Xangarrito',
  xangarro: 'Xangarro',
  xangarrote: 'Xangarrote',
};

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
  /** Integrated collections (C-12): QR/CoDi cobros on the paid tiers. */
  readonly cobrosIntegrados: boolean;
}

export interface PlanLimits {
  /**
   * Max active Operators (PIN users): the plan's employees plus one NIP for
   * the owner, so an owner who cobra never takes an employee's seat (ADR-104).
   */
  readonly operators: number;
  /** Max linked devices — one per employee, i.e. `operators - 1` (ADR-104). */
  readonly devices: number;
  /** Transactions (tickets + gastos + manual/portal movements) per month (C-12, ADR-065). */
  readonly transactionsPerMonth: number;
  /** Active products the catalog may hold; enforced client-side on xangarrito only. */
  readonly activeProducts: number;
  /** Feature keys the plan includes. Platform availability still gates them. */
  readonly features: readonly FeatureFlagKey[];
  /** Plan-level gates with no tenant switch. */
  readonly capabilities: PlanCapabilities;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  xangarrito: {
    operators: 2,
    devices: 1,
    transactionsPerMonth: 300,
    activeProducts: 50,
    features: [],
    capabilities: {
      estadosFinancieros: false,
      informeMensual: false,
      permisosPorUsuario: false,
      asesor: 'semanal',
      cobrosIntegrados: false,
    },
  },
  xangarro: {
    operators: 3,
    devices: 2,
    transactionsPerMonth: 10_000,
    activeProducts: 1_000,
    features: ['stock', 'barcode', 'ventasCredito'],
    capabilities: {
      estadosFinancieros: true,
      informeMensual: true,
      permisosPorUsuario: false,
      asesor: 'diario',
      cobrosIntegrados: true,
    },
  },
  xangarrote: {
    operators: 6,
    devices: 5,
    transactionsPerMonth: 30_000,
    activeProducts: 5_000,
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
      cobrosIntegrados: true,
      permisosPorUsuario: true,
      asesor: 'completo',
    },
  },
} as const;

/** The plan a lapsed or unknown entitlement falls back to — never "locked". */
export const FALLBACK_PLAN: PlanId = 'xangarrito';
