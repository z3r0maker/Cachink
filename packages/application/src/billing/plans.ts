/**
 * What Xangarro sells, in Stripe's vocabulary (B-10, N-01, ADR-059, ADR-067).
 *
 * The seed script creates Stripe prices from this table and the webhook reads
 * plans back through `parseLookupKey`, so there is one list, here.
 *
 * Amounts are **subtotals in integer centavos**; IVA is added by Stripe as an
 * exclusive 16 % tax (ADR-067 "prices are plus IVA"). `totalCentavos` is what
 * the customer pays and what every price display must show beside "+ IVA".
 */

export const PAID_PLAN_IDS = ['xangarro', 'xangarrote'] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export const BILLING_INTERVALS = ['month', 'year'] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

/** Subtotals, in centavos. Annual is 10× monthly: two months free. */
export const PRICE_SUBTOTAL_CENTAVOS = {
  xangarro: { month: 19_900, year: 199_000 },
  xangarrote: { month: 39_900, year: 399_000 },
} as const satisfies Record<PaidPlanId, Record<BillingInterval, number>>;

/** IVA, in basis points (16 %). */
export const IVA_BASIS_POINTS = 1_600;

/** Both paid tiers start with a 14-day trial and no card (N-01). */
export const TRIAL_DAYS = 14;

/**
 * Days a SPEI invoice stays payable. This *is* the payment grace for SPEI
 * (ADR-053 §5): a send_invoice subscription is active until its invoice is
 * past due, and a transfer confirms in hours or days.
 */
export const SPEI_DAYS_UNTIL_DUE = 7;

/** IVA on a subtotal, in centavos. Every list price is a whole peso, so this is exact. */
export function ivaCentavos(subtotalCentavos: number): number {
  return Math.round((subtotalCentavos * IVA_BASIS_POINTS) / 10_000);
}

export function totalCentavos(plan: PaidPlanId, interval: BillingInterval): number {
  const subtotal = PRICE_SUBTOTAL_CENTAVOS[plan][interval];
  return subtotal + ivaCentavos(subtotal);
}

const WORD: Record<BillingInterval, string> = { month: 'monthly', year: 'annual' };

/** `plan_xangarro_monthly` … — the `plan_` prefix keeps the plan distinct from the product (ADR-059). */
export function lookupKey(plan: PaidPlanId, interval: BillingInterval): string {
  return `plan_${plan}_${WORD[interval]}`;
}

export const LOOKUP_KEYS = PAID_PLAN_IDS.flatMap((p) =>
  BILLING_INTERVALS.map((i) => lookupKey(p, i)),
);

export function isPaidPlan(value: string): value is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(value);
}

export function isInterval(value: string): value is BillingInterval {
  return (BILLING_INTERVALS as readonly string[]).includes(value);
}

/** The plan and interval a price stands for, or `null` for a price we did not seed. */
export function parseLookupKey(
  key: string | null,
): { readonly planId: PaidPlanId; readonly interval: BillingInterval } | null {
  for (const planId of PAID_PLAN_IDS) {
    for (const interval of BILLING_INTERVALS) {
      if (lookupKey(planId, interval) === key) return { planId, interval };
    }
  }
  return null;
}
