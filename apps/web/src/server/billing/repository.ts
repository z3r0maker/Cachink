import type { BillingRepository, StripeEventLedger } from '@xangarro/application/billing';
import {
  beginStripeEvent,
  billingCustomerOf,
  businessOfBillingCustomer,
  failStripeEvent,
  finishStripeEvent,
  saveBillingCustomer,
  saveSubscriptionRow,
  subscriptionsOfBusiness,
  type Db,
} from '@xangarro/data-pg';

/**
 * The billing ports over Postgres. Built on the `xangarro_billing` connection
 * (`billingDb()`): the webhook carries no tenant claim, and only that role may
 * write these tables (0007_billing_grants.sql).
 */
export function pgBillingRepository(db: Db): BillingRepository {
  return {
    customerOf: (businessId) => billingCustomerOf(db, businessId),
    saveCustomer: (businessId, customerId) => saveBillingCustomer(db, businessId, customerId),
    businessOfCustomer: (customerId) => businessOfBillingCustomer(db, customerId),
    subscriptionsOf: (businessId) => subscriptionsOfBusiness(db, businessId),
    saveSubscription: (record) => saveSubscriptionRow(db, record),
  };
}

export function pgStripeEventLedger(db: Db): StripeEventLedger {
  return {
    begin: (id, type) => beginStripeEvent(db, id, type),
    finish: (id, note) => finishStripeEvent(db, id, note),
    fail: (id, error) => failStripeEvent(db, id, error),
  };
}
