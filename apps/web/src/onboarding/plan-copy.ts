/**
 * "Tu plan ideal" copy (N-13): plan names, reason codes as Spanish, and the
 * prices — **plus IVA** on every one of them (ADR-067).
 *
 * Reason codes are stable machine values from the domain; this is the only
 * place they become words. Prices are integer centavos (`bigint`), formatted
 * only here. Annual is 10× monthly.
 */

import {
  FEATURE_FLAG_KEYS,
  PLAN_IDS,
  PLAN_LIMITS,
  PLATFORM_AVAILABLE,
  type FeatureFlagKey,
  type PlanId,
  type ReasonCode,
} from '@xangarro/domain';

import { PLAN_CARDS } from '../data/planes';

export type Interval = 'mensual' | 'anual';

export const REASON_COPY: Readonly<Record<ReasonCode, string>> = {
  INVENTARIO: 'manejas inventario',
  VENTAS_A_CREDITO: 'vendes a crédito',
  MAS_PERSONAS: 'cobran varias personas',
};

/** Which wizard answer each pending item came from, as the owner said it. */
export const PENDING_ANSWER_COPY: Readonly<Record<string, string>> = {
  manejaInventario: 'Inventario',
  vendeACredito: 'Ventas a crédito',
  personasQueCobran: 'Más personas cobrando',
};

/** Subtotals before IVA, in centavos. */
export const PRICE_CENTAVOS: Readonly<Record<Interval, Readonly<Record<PlanId, bigint>>>> = {
  mensual: { xangarrito: 0n, xangarro: 19_900n, xangarrote: 39_900n },
  anual: { xangarrito: 0n, xangarro: 199_000n, xangarrote: 399_000n },
};

const WHOLE_PESOS = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export function planName(plan: PlanId): string {
  return PLAN_CARDS.find((c) => c.id === plan)?.name ?? plan;
}

export function planPitch(plan: PlanId): string {
  return PLAN_CARDS.find((c) => c.id === plan)?.pitch ?? '';
}

/** "manejas inventario", "… y vendes a crédito", "a, b y c". */
export function joinReasons(reasons: readonly ReasonCode[]): string {
  const words = reasons.map((r) => REASON_COPY[r]);
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} y ${words[words.length - 1]}`;
}

/** "Tu plan ideal: Xangarro — porque manejas inventario y vendes a crédito". */
export function headline(plan: PlanId, reasons: readonly ReasonCode[]): string {
  const base = `Tu plan ideal: ${planName(plan)}`;
  return reasons.length === 0 ? base : `${base} — porque ${joinReasons(reasons)}`;
}

/** "$199 al mes + IVA" / "$1,990 al año + IVA" / "Gratis". */
export function priceLabel(plan: PlanId, interval: Interval): string {
  const centavos = PRICE_CENTAVOS[interval][plan];
  if (centavos === 0n) return 'Gratis';
  const pesos = WHOLE_PESOS.format(Number(centavos / 100n));
  return `${pesos} ${interval === 'mensual' ? 'al mes' : 'al año'} + IVA`;
}

/**
 * The plan "Tu plan ideal" shows: the suggestion, unless the landing page's
 * `?plan=` preselected a bigger one — a preselection, never a downgrade of
 * what the answers need (ADR-067). An unknown slug is ignored.
 */
export function displayedPlan(suggested: PlanId, preselected: string | undefined): PlanId {
  const rank = (p: string) => PLAN_IDS.indexOf(p as PlanId);
  const chosen = PLAN_IDS.find((p) => p === preselected);
  return chosen !== undefined && rank(chosen) > rank(suggested) ? chosen : suggested;
}

/** Keys a switch may turn on: released on the platform and in the plan (as P-15). */
export function allowedFor(plan: PlanId): ReadonlySet<FeatureFlagKey> {
  const inPlan = PLAN_LIMITS[plan].features;
  return new Set(FEATURE_FLAG_KEYS.filter((k) => PLATFORM_AVAILABLE[k] && inPlan.includes(k)));
}
