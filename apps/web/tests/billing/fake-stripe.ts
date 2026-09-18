/**
 * A tiny in-memory Stripe for the gateway and catalog tests: the handful of
 * endpoints billing calls, recording every create so the tests can assert the
 * exact parameters sent.
 */
import type Stripe from 'stripe';

type Obj = Record<string, unknown>;

export class FakeStripe {
  readonly calls: { method: string; params: Obj }[] = [];
  readonly taxRates: Obj[] = [];
  readonly products = new Map<string, Obj>();
  readonly prices: Obj[] = [];
  invoiceStatus = 'draft';

  #record(method: string, params: Obj) {
    this.calls.push({ method, params });
  }

  readonly client = {
    taxRates: {
      list: () => Promise.resolve({ data: this.taxRates }),
      create: (p: Obj) => {
        this.#record('taxRates.create', p);
        const rate = { id: `txr_${this.taxRates.length + 1}`, active: true, ...p };
        this.taxRates.push(rate);
        return Promise.resolve(rate);
      },
    },
    products: {
      retrieve: (id: string) =>
        this.products.has(id)
          ? Promise.resolve(this.products.get(id))
          : Promise.reject(
              Object.assign(new Error('No such product'), { code: 'resource_missing' }),
            ),
      create: (p: Obj) => {
        this.#record('products.create', p);
        this.products.set(p.id as string, { active: true, ...p });
        return Promise.resolve(p);
      },
      update: (id: string, p: Obj) => {
        this.#record('products.update', { id, ...p });
        return Promise.resolve({ id, ...p });
      },
    },
    prices: {
      list: (p: { lookup_keys: string[] }) =>
        Promise.resolve({
          data: this.prices.filter((x) => p.lookup_keys.includes(x.lookup_key as string)),
        }),
      create: (p: Obj) => {
        this.#record('prices.create', p);
        for (const old of this.prices) if (old.lookup_key === p.lookup_key) old.lookup_key = null;
        const price = { id: `price_${this.prices.length + 1}`, ...p };
        this.prices.push(price);
        return Promise.resolve(price);
      },
    },
    customers: {
      create: (p: Obj) => (this.#record('customers.create', p), Promise.resolve({ id: 'cus_new' })),
    },
    checkout: {
      sessions: {
        create: (p: Obj) => (
          this.#record('checkout.sessions.create', p),
          Promise.resolve({ url: 'https://checkout.stripe.com/c/pay/cs_test_x' })
        ),
      },
    },
    subscriptions: {
      create: (p: Obj) => {
        this.#record('subscriptions.create', p);
        return Promise.resolve(this.#subscription(p));
      },
      cancel: (id: string) => (this.#record('subscriptions.cancel', { id }), Promise.resolve({})),
    },
    invoices: {
      finalizeInvoice: (id: string) => {
        this.#record('invoices.finalizeInvoice', { id });
        return Promise.resolve({
          id,
          status: 'open',
          hosted_invoice_url: 'https://invoice.stripe.com/i/x',
        });
      },
      retrieve: (id: string) => Promise.resolve({ id, status: this.invoiceStatus }),
    },
    billingPortal: {
      sessions: {
        create: (p: Obj) => (
          this.#record('billingPortal.sessions.create', p),
          Promise.resolve({ url: 'https://billing.stripe.com/p/session/x' })
        ),
      },
    },
  };

  #subscription(p: Obj) {
    const price = this.prices.find((x) => x.id === (p.items as Obj[])[0]?.price);
    return {
      id: 'sub_spei',
      customer: p.customer,
      metadata: p.metadata,
      status: 'active',
      collection_method: p.collection_method,
      trial_end: null,
      cancel_at: null,
      items: {
        data: [
          {
            price: { lookup_key: price?.lookup_key },
            current_period_start: 1,
            current_period_end: 2,
          },
        ],
      },
      latest_invoice: { id: 'in_spei', status: this.invoiceStatus, hosted_invoice_url: null },
    };
  }

  get stripe(): Stripe {
    return this.client as unknown as Stripe;
  }

  created(method: string): Obj[] {
    return this.calls.filter((c) => c.method === method).map((c) => c.params);
  }
}
