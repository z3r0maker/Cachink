import {
  BILLING_INTERVALS,
  PAID_PLAN_IDS,
  PRICE_SUBTOTAL_CENTAVOS,
  lookupKey,
  type BillingInterval,
  type PaidPlanId,
} from '@xangarro/application/billing';
import type Stripe from 'stripe';

/**
 * What Xangarro sells, as Stripe objects (B-10, N-01) — found by stable keys,
 * created when missing. The seed script creates; the gateway only finds.
 *
 * **IVA is a Stripe Tax Rate, not Stripe Tax** (ADR-067's "+16 % IVA as an
 * exclusive tax"): one flat, exclusive 16 % rate attached to every line. It
 * yields exactly the ADR's totals (23 084 / 46 284 / 230 840 / 462 840
 * centavos), applies identically on Checkout and on API-created SPEI invoices,
 * needs no customer address at checkout (Stripe Tax would, to locate the
 * buyer — one more field against CLAUDE.md §2.1), and has no per-transaction
 * fee. Revisit if Xangarro sells outside Mexico.
 */

export const IVA_KEY = 'iva_16';
const PRODUCT_ID: Record<PaidPlanId, string> = {
  xangarro: 'xg_plan_xangarro',
  xangarrote: 'xg_plan_xangarrote',
};
const PRODUCT_NAME: Record<PaidPlanId, string> = { xangarro: 'Xangarro', xangarrote: 'Xangarrote' };

export class CatalogMissingError extends Error {
  readonly code = 'STRIPE_CATALOG_MISSING';
  constructor(what: string) {
    super(`${what} is missing in Stripe. Run \`pnpm --filter @xangarro/web stripe:seed\`.`);
    this.name = 'CatalogMissingError';
  }
}

export async function findIvaRate(stripe: Stripe): Promise<Stripe.TaxRate | null> {
  const rates = await stripe.taxRates.list({ active: true, inclusive: false, limit: 100 });
  return (
    rates.data.find((r) => r.metadata?.xangarro_key === IVA_KEY && r.percentage === 16) ?? null
  );
}

export async function findPrice(stripe: Stripe, key: string): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  return prices.data[0] ?? null;
}

export async function ensureIvaRate(stripe: Stripe): Promise<Stripe.TaxRate> {
  return (
    (await findIvaRate(stripe)) ??
    stripe.taxRates.create({
      display_name: 'IVA',
      description: 'IVA 16 % (México)',
      percentage: 16,
      inclusive: false,
      country: 'MX',
      tax_type: 'vat',
      metadata: { xangarro_key: IVA_KEY },
    })
  );
}

async function ensureProduct(stripe: Stripe, plan: PaidPlanId): Promise<string> {
  const id = PRODUCT_ID[plan];
  try {
    const found = await stripe.products.retrieve(id);
    if (found.active) return id;
    await stripe.products.update(id, { active: true });
    return id;
  } catch (error) {
    if ((error as { code?: string }).code !== 'resource_missing') throw error;
    await stripe.products.create({ id, name: PRODUCT_NAME[plan], metadata: { plan_id: plan } });
    return id;
  }
}

function matches(price: Stripe.Price, product: string, amount: number, interval: BillingInterval) {
  const productId = typeof price.product === 'string' ? price.product : price.product.id;
  return (
    productId === product &&
    price.unit_amount === amount &&
    price.currency === 'mxn' &&
    price.recurring?.interval === interval &&
    price.tax_behavior === 'exclusive'
  );
}

/** The price for one lookup key; a wrong one is replaced and the key moved to the new one. */
async function ensurePrice(
  stripe: Stripe,
  plan: PaidPlanId,
  interval: BillingInterval,
): Promise<{ key: string; created: boolean }> {
  const key = lookupKey(plan, interval);
  const product = await ensureProduct(stripe, plan);
  const amount = PRICE_SUBTOTAL_CENTAVOS[plan][interval];
  const existing = await findPrice(stripe, key);
  if (existing !== null && matches(existing, product, amount, interval))
    return { key, created: false };
  await stripe.prices.create({
    product,
    currency: 'mxn',
    unit_amount: amount,
    recurring: { interval },
    tax_behavior: 'exclusive',
    lookup_key: key,
    transfer_lookup_key: true,
    nickname: `${PRODUCT_NAME[plan]} ${interval === 'month' ? 'mensual' : 'anual'} (+ IVA)`,
    metadata: { plan_id: plan, interval },
  });
  return { key, created: true };
}

export async function seedCatalog(stripe: Stripe): Promise<{ key: string; created: boolean }[]> {
  await ensureIvaRate(stripe);
  const out: { key: string; created: boolean }[] = [];
  for (const plan of PAID_PLAN_IDS) {
    for (const interval of BILLING_INTERVALS) out.push(await ensurePrice(stripe, plan, interval));
  }
  return out;
}
