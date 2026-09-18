/** A fresh `ApplyStripeEventUseCase` over the fakes, plus the events the tests send. */

import {
  ApplyStripeEventUseCase,
  type BillingEvent,
  type InvoiceEvent,
} from '../../src/billing/index.js';
import {
  BIZ,
  FakeGateway,
  FakeLedger,
  FakeRepo,
  NOW,
  RecordingInvoices,
  at,
} from './billing-fakes.js';

export function harness() {
  const repo = new FakeRepo();
  const gateway = new FakeGateway();
  const ledger = new FakeLedger();
  const invoices = new RecordingInvoices();
  const heard: { businessId: string; plan: string }[] = [];
  const entitlements = {
    onEntitlementChanged: (businessId: string, e: { plan: string }) => {
      heard.push({ businessId, plan: e.plan });
      return Promise.resolve();
    },
  };
  const useCase = new ApplyStripeEventUseCase({
    repo,
    gateway,
    ledger,
    invoices,
    entitlements,
    now: () => NOW,
  });
  return { repo, gateway, ledger, invoices, heard, useCase };
}

export const checkout: BillingEvent = {
  id: 'evt_checkout',
  type: 'checkout.session.completed',
  businessId: BIZ,
  customerId: 'cus_1',
  subscriptionId: 'sub_1',
};

export function invoiceEvent(type: InvoiceEvent['type'], id = 'evt_inv'): InvoiceEvent {
  return {
    id,
    type,
    customerId: 'cus_1',
    subscriptionId: 'sub_1',
    invoice: {
      stripeInvoiceId: 'in_1',
      stripeSubscriptionId: 'sub_1',
      subtotalCentavos: 19_900,
      taxCentavos: 3_184,
      totalCentavos: 23_084,
      currency: 'mxn',
      paidAt: at(0),
      collectionMethod: 'charge_automatically',
    },
  };
}
