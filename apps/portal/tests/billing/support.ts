/**
 * Billing test support: Stripe-shaped fixtures (API `2026-08-26.dahlia`,
 * trimmed to the fields read), in-memory ports, and a Stripe client used only
 * for its offline webhook helpers — no key, no network.
 */
import { readFileSync } from 'node:fs';

import {
  ApplyStripeEventUseCase,
  noopEntitlementListener,
  type BillingRepository,
  type PaidInvoice,
  type StripeEventLedger,
  type SubscriptionRecord,
} from '@xangarro/application/billing';
import Stripe from 'stripe';

import { stripeGateway } from '../../src/server/billing/gateway';

export const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
/** A made-up signing secret for Stripe's documented test helper — not a credential. */
export const TEST_WEBHOOK_SECRET = 'whsec_unit_test_only';
export const offlineStripe = new Stripe('sk_test_offline_unit_tests');

export function fixture<T = Record<string, unknown>>(name: string): T {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')) as T;
}

export function signed(payload: string): string {
  return offlineStripe.webhooks.generateTestHeaderString({ payload, secret: TEST_WEBHOOK_SECRET });
}

export class MemoryBilling implements BillingRepository, StripeEventLedger {
  readonly customers = new Map<string, string>();
  readonly rows = new Map<string, SubscriptionRecord>();
  readonly events = new Map<string, { done: boolean; note: string | null }>();
  customerOf = (b: string) => Promise.resolve(this.customers.get(b) ?? null);
  saveCustomer = (b: string, c: string) => Promise.resolve(void this.customers.set(b, c));
  businessOfCustomer = (c: string) =>
    Promise.resolve([...this.customers].find(([, v]) => v === c)?.[0] ?? null);
  subscriptionsOf = (b: string) =>
    Promise.resolve([...this.rows.values()].filter((r) => r.businessId === b));
  saveSubscription = (r: SubscriptionRecord) =>
    Promise.resolve(void this.rows.set(r.stripeSubscriptionId, r));
  begin = (id: string) => {
    const e = this.events.get(id);
    if (!e) this.events.set(id, { done: false, note: null });
    return Promise.resolve(!e ? ('new' as const) : e.done ? ('done' as const) : ('retry' as const));
  };
  finish = (id: string, note: string | null) =>
    Promise.resolve(void this.events.set(id, { done: true, note }));
  fail = (id: string, note: string) =>
    Promise.resolve(void this.events.set(id, { done: false, note }));
}

/** A Stripe client whose `subscriptions.retrieve` answers from fixtures. */
export function stripeWithSubscriptions(subs: Record<string, unknown>): Stripe {
  return {
    subscriptions: {
      retrieve: (id: string) =>
        subs[id]
          ? Promise.resolve(subs[id])
          : Promise.reject(new Error(`No such subscription: ${id}`)),
    },
  } as unknown as Stripe;
}

/** The real use case over memory and a fixture-backed gateway. */
export function chain(subs: Record<string, unknown>) {
  const memory = new MemoryBilling();
  const paid: PaidInvoice[] = [];
  const useCase = new ApplyStripeEventUseCase({
    repo: memory,
    ledger: memory,
    gateway: stripeGateway(stripeWithSubscriptions(subs)),
    invoices: { onInvoicePaid: (i) => Promise.resolve(void paid.push(i)) },
    entitlements: noopEntitlementListener,
    now: () => new Date('2026-09-18T12:00:00.000Z'),
  });
  return { memory, paid, apply: useCase.execute.bind(useCase) };
}
