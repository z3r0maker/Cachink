import 'server-only';

import { createDb, type Db } from '@xangarro/data-pg';
import Stripe from 'stripe';

/**
 * Billing's environment (B-10). Everything is read lazily and nothing is
 * logged, so the portal builds and its tests run without any of it.
 *
 * - `STRIPE_SECRET_KEY` — test mode only (`sk_test_…` / `rk_test_…`). A live
 *   key is refused: going live is its own task, with its own review.
 * - `STRIPE_WEBHOOK_SECRET` — `whsec_…`, from `stripe listen` or the Dashboard.
 * - `STRIPE_PUBLISHABLE_KEY` — handed to the Suscripción screen (P-10) only.
 * - `BILLING_DATABASE_URL` — the `xangarro_billing` role (ADR-063), never the
 *   service role and never `DATABASE_URL`'s tenant role.
 */
function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`${name} is not set.`);
  return value;
}

let client: Stripe | undefined;

export function stripeClient(): Stripe {
  const key = required('STRIPE_SECRET_KEY');
  if (!/^(sk|rk)_test_/.test(key)) {
    throw new Error('STRIPE_SECRET_KEY must be a test-mode key: billing is test mode only (B-10).');
  }
  client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 8_000 });
  return client;
}

export function webhookSecret(): string {
  return required('STRIPE_WEBHOOK_SECRET');
}

export function publishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY || null;
}

let billing: Db | undefined;

/** The connection that may write the billing tables. */
export function billingDb(): Db {
  billing ??= createDb(required('BILLING_DATABASE_URL'));
  return billing;
}
