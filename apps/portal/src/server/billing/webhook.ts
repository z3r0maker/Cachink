import type { ApplyStripeEventResult, BillingEvent } from '@xangarro/application/billing';
import type Stripe from 'stripe';

import { reportError } from '../observability/report';
import { toBillingEvent } from './stripe-mapping';

/**
 * `POST /api/stripe/webhook` (B-10 step 3), minus the wiring.
 *
 * 1. The **raw** body is verified against `Stripe-Signature` before anything
 *    is parsed or trusted; a bad or missing signature is a 400.
 * 2. Types billing does not handle are acknowledged at once (200) and never
 *    touch the database.
 * 3. Handled events run inline — a Stripe read and a few writes, well inside
 *    Stripe's timeout — and answer 2xx when done. A failure is recorded in
 *    `stripe_events`, reported, and answered 500 so **Stripe retries it**;
 *    acknowledging first and processing later would lose the event on a crash
 *    with nothing to retry it.
 */
export interface WebhookDeps {
  /** Only `webhooks` is used; no API call is made here. */
  readonly stripe: Pick<Stripe, 'webhooks'>;
  readonly secret: string;
  readonly apply: (event: BillingEvent) => Promise<ApplyStripeEventResult>;
}

const json = (status: number, body: Record<string, unknown>): Response =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

async function verified(request: Request, deps: WebhookDeps): Promise<Stripe.Event | null> {
  const signature = request.headers.get('stripe-signature');
  if (signature === null) return null;
  const payload = await request.text();
  try {
    return await deps.stripe.webhooks.constructEventAsync(payload, signature, deps.secret);
  } catch {
    return null;
  }
}

export async function handleStripeWebhook(request: Request, deps: WebhookDeps): Promise<Response> {
  const event = await verified(request, deps);
  if (event === null) return json(400, { error: 'invalid signature' });

  const billingEvent = toBillingEvent(event);
  if (billingEvent === null) return json(200, { received: true, handled: false });

  try {
    const result = await deps.apply(billingEvent);
    return json(200, { received: true, outcome: result.outcome });
  } catch (error) {
    reportError(error, { endpoint: `stripe/webhook:${event.type}` });
    return json(500, { error: 'processing failed' });
  }
}
