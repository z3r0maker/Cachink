import type { PlanId } from '@xangarro/domain';

import type { z } from 'zod';

import type { Seed } from '../schemas/common';

/**
 * What each seed a scenario names puts on a run's freshly minted tenant
 * (S-04). They are plans, not SQL: `seed.ts` executes them through
 * `@xangarro/testing/tenant`, the same factory the portal's e2e mints with.
 * Prices are centavos; NIPs are four digits (ADR-072) and test values only.
 */
export interface FixtureProduct {
  readonly nombre: string;
  readonly sku: string;
  /** Centavos. */
  readonly precio: number;
  /** Centavos. */
  readonly costo: number;
}

export interface FixtureOperator {
  readonly nombre: string;
  readonly nip: string;
  readonly canCancelSales: boolean;
}

export interface FixturePlan {
  readonly plan: PlanId;
  readonly products: readonly FixtureProduct[];
  readonly operators: readonly FixtureOperator[];
  /** Sales on the `days` before today, `perDay` each, across the products. */
  readonly history: { readonly days: number; readonly perDay: number };
}

const CATALOGO: readonly FixtureProduct[] = [
  { nombre: 'Refresco de cola 600 ml', sku: 'REF-600', precio: 2_500, costo: 1_400 },
  { nombre: 'Galletas de animalitos', sku: 'GAL-ANI', precio: 1_800, costo: 1_000 },
  { nombre: 'Agua natural 1 L', sku: 'AGU-1L', precio: 1_500, costo: 700 },
];

const ANA: FixtureOperator = { nombre: 'Ana', nip: '2580', canCancelSales: true };
const LUIS: FixtureOperator = { nombre: 'Luis', nip: '1357', canCancelSales: false };

export const FIXTURES: Readonly<Record<z.infer<typeof Seed>, FixturePlan>> = {
  vacio: { plan: 'xangarro', products: [], operators: [], history: { days: 0, perDay: 0 } },
  'negocio-con-catalogo-minimo': {
    plan: 'xangarro',
    products: CATALOGO,
    operators: [ANA],
    history: { days: 0, perDay: 0 },
  },
  'negocio-con-historial-30-dias': {
    plan: 'xangarro',
    products: CATALOGO,
    operators: [ANA],
    history: { days: 30, perDay: 3 },
  },
  // Xangarrito allows 2 operators and 1 device: both are taken.
  'plan-al-limite': {
    plan: 'xangarrito',
    products: CATALOGO,
    operators: [ANA, LUIS],
    history: { days: 0, perDay: 0 },
  },
};

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `date` moved by `days` on the calendar (UTC arithmetic, so no timezone shifts it). */
export function shiftDate(date: string, days: number): string {
  const m = ISO_DAY.exec(date);
  const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : undefined;
  if (d === undefined || d.toISOString().slice(0, 10) !== date) {
    throw new Error(`«${date}» is not a calendar date (YYYY-MM-DD)`);
  }
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The `days` dates before `today`, oldest first. */
export function historyDates(today: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => shiftDate(today, i - days));
}
