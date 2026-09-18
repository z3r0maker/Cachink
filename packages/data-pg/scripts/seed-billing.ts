/**
 * Seed — the demo businesses' subscriptions (B-10).
 *
 * Taquería Don Pedro is on Xangarro in every design file, and the portal's E2E
 * and the contract's conformance suite rely on Xangarro's allowances (two
 * devices, two operators). Without a `subscriptions` row a business is on the
 * free plan, so the seed gives both demo tenants one.
 *
 * Runs as `xangarro_billing` — the only role that may write billing rows — so
 * the grants are exercised here too. The ids are local placeholders: no Stripe
 * object exists behind them, and a webhook never names them.
 *
 *   pnpm --filter @xangarro/data-pg db:seed   (runs this after seed.ts)
 */
import { createDb } from '../src/client';
import { saveSubscriptionRow } from '../src/queries/billing';

import { BIZ, CONFORMANCE } from './seed-data';

const URL = process.env.BILLING_DATABASE_URL;
if (URL === undefined || URL === '') {
  console.error('BILLING_DATABASE_URL is required. Try: ./scripts/db-local.sh billing-url');
  process.exit(1);
}

function demo(businessId: string, tag: string) {
  return {
    stripeSubscriptionId: `sub_seed_${tag}`,
    businessId,
    stripeCustomerId: `cus_seed_${tag}`,
    planId: 'xangarro' as const,
    interval: 'month' as const,
    status: 'active' as const,
    stripeStatus: 'active',
    trialEnd: null,
    currentPeriodStart: '2026-01-01T00:00:00.000Z',
    // Far enough that the demo never lapses under a test.
    currentPeriodEnd: '2099-01-01T00:00:00.000Z',
    cancelAt: null,
    collectionMethod: 'charge_automatically' as const,
  };
}

async function main(): Promise<void> {
  const db = createDb(URL as string);
  try {
    await saveSubscriptionRow(db, demo(BIZ, 'taqueria'));
    await saveSubscriptionRow(db, demo(CONFORMANCE.businessId, 'conformance'));
    console.log('seeded billing — Xangarro for Taquería Don Pedro and the conformance tenant');
  } finally {
    await db.$client.end({ timeout: 5 });
  }
}

void main();
