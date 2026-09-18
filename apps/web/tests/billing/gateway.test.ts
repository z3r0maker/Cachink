import assert from 'node:assert/strict';

import { beforeEach, describe, it } from 'vitest';

import { CatalogMissingError, seedCatalog } from '../../src/server/billing/catalog';
import { stripeGateway } from '../../src/server/billing/gateway';
import { FakeStripe } from './fake-stripe';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
let fake: FakeStripe;

beforeEach(async () => {
  fake = new FakeStripe();
  await seedCatalog(fake.stripe);
  fake.calls.length = 0;
});

describe('stripe:seed — the catalog (N-01)', () => {
  it('creates the IVA rate, two products and four tax-exclusive MXN prices by lookup key', async () => {
    const fresh = new FakeStripe();
    await seedCatalog(fresh.stripe);
    const [rate] = fresh.created('taxRates.create');
    assert.equal(rate?.percentage, 16);
    assert.equal(rate?.inclusive, false);
    assert.equal(rate?.country, 'MX');
    const prices = fresh.created('prices.create');
    assert.deepEqual(
      prices.map((p) => [
        p.lookup_key,
        p.unit_amount,
        (p.recurring as { interval: string }).interval,
      ]),
      [
        ['plan_xangarro_monthly', 19_900, 'month'],
        ['plan_xangarro_annual', 199_000, 'year'],
        ['plan_xangarrote_monthly', 39_900, 'month'],
        ['plan_xangarrote_annual', 399_000, 'year'],
      ],
    );
    assert.ok(prices.every((p) => p.tax_behavior === 'exclusive' && p.currency === 'mxn'));
    assert.equal(fresh.created('products.create').length, 2);
  });

  it('is idempotent: a second run creates nothing', async () => {
    const results = await seedCatalog(fake.stripe);
    assert.ok(results.every((r) => !r.created));
    assert.equal(fake.calls.length, 0);
  });

  it('replaces a price whose amount drifted and moves its lookup key', async () => {
    const monthly = fake.prices.find((p) => p.lookup_key === 'plan_xangarro_monthly');
    if (monthly) monthly.unit_amount = 9_900;
    await seedCatalog(fake.stripe);
    const [replaced] = fake.created('prices.create');
    assert.equal(replaced?.lookup_key, 'plan_xangarro_monthly');
    assert.equal(replaced?.transfer_lookup_key, true);
    assert.equal(replaced?.unit_amount, 19_900);
  });
});

describe('stripeGateway', () => {
  const gateway = () => stripeGateway(fake.stripe);

  it('Checkout: card only, trial without a card, IVA on the line, business in metadata', async () => {
    await gateway().createCheckoutSession({
      customerId: 'cus_1',
      businessId: BIZ,
      lookupKey: 'plan_xangarrote_annual',
      trialDays: 14,
      successUrl: 'https://x/ok',
      cancelUrl: 'https://x/no',
    });
    const [p] = fake.created('checkout.sessions.create');
    assert.equal(p?.mode, 'subscription');
    assert.deepEqual(p?.payment_method_types, ['card']);
    assert.equal(p?.payment_method_collection, 'if_required');
    assert.equal(p?.client_reference_id, BIZ);
    const sub = p?.subscription_data as Record<string, unknown>;
    assert.equal(sub.trial_period_days, 14);
    assert.deepEqual(sub.trial_settings, { end_behavior: { missing_payment_method: 'cancel' } });
    assert.deepEqual(sub.metadata, { business_id: BIZ });
    const [line] = p?.line_items as { tax_rates: string[] }[];
    assert.deepEqual(line?.tax_rates, ['txr_1']);
  });

  it('Checkout without a trial sends no trial', async () => {
    await gateway().createCheckoutSession({
      customerId: 'cus_1',
      businessId: BIZ,
      lookupKey: 'plan_xangarro_monthly',
      trialDays: null,
      successUrl: 'https://x/ok',
      cancelUrl: 'https://x/no',
    });
    const sub = fake.created('checkout.sessions.create')[0]?.subscription_data as object;
    assert.equal('trial_period_days' in sub, false);
  });

  it('SPEI: send_invoice, customer balance by MX bank transfer, first invoice finalized', async () => {
    const r = await gateway().createSpeiSubscription({
      customerId: 'cus_1',
      businessId: BIZ,
      lookupKey: 'plan_xangarro_annual',
      daysUntilDue: 7,
    });
    const [p] = fake.created('subscriptions.create');
    assert.equal(p?.collection_method, 'send_invoice');
    assert.equal(p?.days_until_due, 7);
    assert.deepEqual(p?.payment_settings, {
      payment_method_types: ['customer_balance'],
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: { type: 'mx_bank_transfer' },
        },
      },
    });
    assert.equal(JSON.stringify(p).includes('oxxo'), false);
    assert.deepEqual(fake.created('invoices.finalizeInvoice'), [{ id: 'in_spei' }]);
    assert.equal(r.hostedInvoiceUrl, 'https://invoice.stripe.com/i/x');
    assert.equal(r.subscription.lookupKey, 'plan_xangarro_annual');
    assert.equal(r.subscription.collectionMethod, 'send_invoice');
  });

  it('refuses to sell a price that was never seeded', async () => {
    await assert.rejects(
      stripeGateway(new FakeStripe().stripe).createCheckoutSession({
        customerId: 'cus_1',
        businessId: BIZ,
        lookupKey: 'plan_xangarro_monthly',
        trialDays: 14,
        successUrl: 'https://x/ok',
        cancelUrl: 'https://x/no',
      }),
      CatalogMissingError,
    );
  });

  it('customer and portal sessions carry the business and the return URL', async () => {
    assert.equal(
      await gateway().createCustomer({ businessId: BIZ, email: 'a@b.mx', name: 'N' }),
      'cus_new',
    );
    assert.deepEqual(fake.created('customers.create')[0]?.metadata, { business_id: BIZ });
    await gateway().createPortalSession('cus_1', 'https://x/suscripcion');
    assert.deepEqual(fake.created('billingPortal.sessions.create')[0], {
      customer: 'cus_1',
      return_url: 'https://x/suscripcion',
    });
  });
});
