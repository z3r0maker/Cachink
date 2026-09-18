import { liveWebhookDeps } from '@/server/billing/live';
import { handleStripeWebhook } from '@/server/billing/webhook';
import { reportError } from '@/server/observability/report';

/**
 * `POST /api/stripe/webhook` — Stripe's only way in (B-10).
 *
 * Not a device route and not a session route: Stripe authenticates with the
 * `Stripe-Signature` header, verified over the raw body in
 * `handleStripeWebhook`. Node runtime (the Stripe SDK); a POST handler is
 * never cached.
 */
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let deps;
  try {
    deps = liveWebhookDeps();
  } catch (error) {
    // Misconfiguration (a missing secret): Stripe retries, the error is seen.
    reportError(error, { endpoint: 'stripe/webhook' });
    return Response.json({ error: 'billing is not configured' }, { status: 500 });
  }
  return handleStripeWebhook(request, deps);
}
