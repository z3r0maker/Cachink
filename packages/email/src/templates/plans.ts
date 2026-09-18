/**
 * Plan names and prices as the emails show them (ADR-069: plan and price copy
 * belongs in the portal and in email, never in the app). Amounts come from
 * billing's single price table; every price says «+ IVA» (N-01).
 */
import {
  PAID_PLAN_IDS,
  PRICE_SUBTOTAL_CENTAVOS,
  type PaidPlanId,
} from '@xangarro/application/billing';

import { pesos } from '../render.js';

/** `xangarrote` → «Xangarrote». */
export function planName(plan: PaidPlanId): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

/** «Xangarro: $199 + IVA al mes, o $1,990 + IVA al año (2 meses gratis)». */
export function priceLine(plan: PaidPlanId): string {
  const p = PRICE_SUBTOTAL_CENTAVOS[plan];
  return `${planName(plan)}: ${pesos(p.month)} + IVA al mes, o ${pesos(p.year)} + IVA al año (2 meses gratis)`;
}

export const ALL_PRICE_LINES: readonly string[] = PAID_PLAN_IDS.map(priceLine);
