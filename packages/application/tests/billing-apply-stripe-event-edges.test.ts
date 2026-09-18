import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  entitlementFromBilling,
  noopEntitlementListener,
  noopInvoicePaid,
} from '../src/billing/index.js';
import { BIZ, NOW, facts } from './support/billing-fakes.js';
import { checkout, harness, invoiceEvent } from './support/billing-harness.js';

let h: ReturnType<typeof harness>;
beforeEach(() => {
  h = harness();
});

describe('ApplyStripeEventUseCase — edges', () => {
  it('a paid invoice with no subscription still reaches the CFDI port', async () => {
    h.repo.customers.set(BIZ, 'cus_1');
    const r = await h.useCase.execute({ ...invoiceEvent('invoice.paid'), subscriptionId: null });
    assert.equal(r.outcome === 'applied' && r.status, null);
    assert.equal(h.invoices.paid.length, 1);
  });

  it('a paid invoice from a stranger is ignored', async () => {
    const r = await h.useCase.execute({ ...invoiceEvent('invoice.paid'), subscriptionId: null });
    assert.deepEqual(r, { outcome: 'ignored', reason: 'UNKNOWN_BUSINESS' });
  });

  it('checkout without a subscription is ignored; the customer is still remembered', async () => {
    const r = await h.useCase.execute({ ...checkout, subscriptionId: null });
    assert.deepEqual(r, { outcome: 'ignored', reason: 'NO_SUBSCRIPTION' });
    assert.equal(h.repo.customers.get(BIZ), 'cus_1');
  });

  it('keeps the customer already on file', async () => {
    h.repo.customers.set(BIZ, 'cus_1');
    h.gateway.subscriptions.set('sub_1', facts());
    await h.useCase.execute({ ...checkout, customerId: 'cus_other' });
    assert.equal(h.repo.customers.get(BIZ), 'cus_1');
  });

  it('the default ports are no-ops', async () => {
    const paid = await noopInvoicePaid.onInvoicePaid({
      ...invoiceEvent('invoice.paid').invoice,
      businessId: BIZ,
    });
    assert.equal(paid, undefined);
    const heard = await noopEntitlementListener.onEntitlementChanged(
      BIZ,
      entitlementFromBilling(BIZ, [], NOW),
    );
    assert.equal(heard, undefined);
  });
});
