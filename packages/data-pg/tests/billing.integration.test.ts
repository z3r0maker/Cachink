import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';
import postgres from 'postgres';

import { createDb } from '../src/client';
import {
  beginStripeEvent,
  businessOfBillingCustomer,
  finishStripeEvent,
  saveBillingCustomer,
  saveSubscriptionRow,
  subscriptionsOfBusiness,
  type SubscriptionRow,
} from '../src/queries/billing';
import { integrationSuite } from './support/db';
import { BIZ_A, BIZ_B } from './support/tenants';

/**
 * Who may touch the billing tables (B-10, `0007_billing_grants.sql`).
 *
 * The tenant reads its own subscription and writes none; `xangarro_billing`
 * writes every tenant's and deletes nobody's; `stripe_events` is invisible to
 * tenants. Run against real Postgres, as the two real roles.
 */
const { url, describe } = integrationSuite();

function billingUrl(appUrl: string): string {
  if (process.env.BILLING_DATABASE_URL) return process.env.BILLING_DATABASE_URL;
  const u = new URL(appUrl);
  u.username = 'xangarro_billing';
  u.password = 'xangarro_billing';
  return u.toString();
}

const row = (businessId: string, id: string): SubscriptionRow => ({
  stripeSubscriptionId: id,
  businessId,
  stripeCustomerId: `cus_${id}`,
  planId: 'xangarro',
  interval: 'month',
  status: 'trialing',
  stripeStatus: 'trialing',
  trialEnd: '2026-10-01T12:00:00.000Z',
  currentPeriodStart: '2026-09-17T12:00:00.000Z',
  currentPeriodEnd: '2026-10-01T12:00:00.000Z',
  cancelAt: null,
  collectionMethod: 'charge_automatically',
});

describe('billing tables: tenant reads, billing role writes, nobody deletes', () => {
  let app: postgres.Sql;
  let billing: postgres.Sql;
  let db: ReturnType<typeof createDb>;
  const suffix = Date.now().toString(36);

  beforeAll(async () => {
    app = postgres(url as string, { max: 1, onnotice: () => undefined });
    billing = postgres(billingUrl(url as string), { max: 1, onnotice: () => undefined });
    db = createDb(billingUrl(url as string));
    await saveSubscriptionRow(db, row(BIZ_A, `a_${suffix}`));
    await saveSubscriptionRow(db, row(BIZ_B, `b_${suffix}`));
    await saveBillingCustomer(db, `biz_${suffix}`, `cus_a_${suffix}`);
    // First writer wins: a second customer for the same business is dropped.
    await saveBillingCustomer(db, `biz_${suffix}`, `cus_z_${suffix}`);
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
    await billing?.end({ timeout: 5 });
    await db?.$client.end({ timeout: 5 });
  });

  it('the billing role upserts the whole row and reads it back as ISO', async () => {
    await saveSubscriptionRow(db, { ...row(BIZ_A, `a_${suffix}`), status: 'active' });
    const mine = (await subscriptionsOfBusiness(db, BIZ_A)).find(
      (r) => r.stripeSubscriptionId === `a_${suffix}`,
    );
    assert.equal(mine?.status, 'active');
    assert.equal(mine?.trialEnd, '2026-10-01T12:00:00.000Z');
    assert.equal(await businessOfBillingCustomer(db, `cus_a_${suffix}`), `biz_${suffix}`);
    assert.equal(await businessOfBillingCustomer(db, `cus_z_${suffix}`), null);
  });

  it('a tenant sees its own subscriptions and not another tenant’s', async () => {
    await app`SELECT set_config('xangarro.business_id', ${BIZ_A}, false)`;
    const rows = await app<{ business_id: string }[]>`SELECT business_id FROM subscriptions`;
    assert.ok(rows.length > 0);
    assert.ok(rows.every((r) => r.business_id === BIZ_A));
  });

  it('a tenant cannot write its subscription', async () => {
    await app`SELECT set_config('xangarro.business_id', ${BIZ_A}, false)`;
    await assert.rejects(
      app`UPDATE subscriptions SET status = 'active' WHERE business_id = ${BIZ_A}`,
      /permission denied/,
    );
    await assert.rejects(
      app`INSERT INTO billing_customers (business_id, stripe_customer_id) VALUES (${BIZ_A}, 'cus_forged')`,
      /permission denied/,
    );
  });

  it('a tenant cannot see the event ledger at all', async () => {
    await assert.rejects(app`SELECT id FROM stripe_events`, /permission denied/);
  });

  it('the billing role cannot delete', async () => {
    await assert.rejects(
      billing`DELETE FROM subscriptions WHERE stripe_subscription_id = ${`b_${suffix}`}`,
      /permission denied/,
    );
  });

  it('an event is new once, retried until finished, then done', async () => {
    const id = `evt_${suffix}`;
    assert.equal(await beginStripeEvent(db, id, 'invoice.paid'), 'new');
    assert.equal(await beginStripeEvent(db, id, 'invoice.paid'), 'retry');
    await finishStripeEvent(db, id, null);
    assert.equal(await beginStripeEvent(db, id, 'invoice.paid'), 'done');
  });
});
