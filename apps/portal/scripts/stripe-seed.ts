/**
 * `pnpm --filter @xangarro/portal stripe:seed` — creates, or confirms, what
 * Xangarro sells in Stripe **test mode** (B-10, N-01): two products, four
 * prices by lookup key (`plan_xangarro_monthly|annual`,
 * `plan_xangarrote_monthly|annual`, tax-exclusive MXN) and the 16 % IVA tax
 * rate. Idempotent: run it as often as you like; a price whose amount drifted
 * is replaced and its lookup key moved over.
 *
 * Reads `STRIPE_SECRET_KEY` from the environment and prints only ids.
 */
import Stripe from 'stripe';

import { totalCentavos, parseLookupKey } from '@xangarro/application/billing';

import { seedCatalog } from '../src/server/billing/catalog';

async function main(): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.');
  if (!/^(sk|rk)_test_/.test(key))
    throw new Error('Refusing a live key: B-10 seeds test mode only.');

  const results = await seedCatalog(new Stripe(key));
  for (const { key: lookup, created } of results) {
    const price = parseLookupKey(lookup);
    const total = price ? totalCentavos(price.planId, price.interval) : 0;
    console.log(
      `${created ? 'created ' : 'ok      '} ${lookup}  (total con IVA ${total} centavos)`,
    );
  }
  console.log('ok       IVA 16 % tax rate');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
