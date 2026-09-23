/**
 * `@xangarro/application/billing` — Stripe subscriptions (B-10, N-01).
 *
 * A subpath of its own, not the root barrel: the portal's server code is its
 * only consumer, and the phone bundle never needs it.
 */
export * from './plans.js';
export * from './errors.js';
export * from './ports.js';
export * from './events.js';
export * from './status.js';
export * from './entitlement.js';
export * from './record.js';
export * from './customer.js';
export * from './start-trial-checkout.js';
export * from './start-spei-annual.js';
export * from './open-customer-portal.js';
export * from './apply-stripe-event.js';
export * from './cfdi-listener.js';
