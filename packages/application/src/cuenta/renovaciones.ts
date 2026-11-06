/**
 * What deleting an account does to its subscriptions (ADR-136): on request
 * nothing renews any more (cancel at period end, exactly as «Cancelar
 * suscripción»); an undo resumes exactly those; the erase ends what is still
 * live outright. Each change rewrites the row from Stripe's answer.
 */
import type { BillingGateway, BillingRepository } from '../billing/ports.js';
import { recordFrom } from '../billing/record.js';
import { currentSubscription, isLive } from '../billing/status.js';

export interface Billing {
  readonly repo: BillingRepository;
  /** Only what deletion calls, so a caller can build Stripe lazily. */
  readonly gateway: Pick<
    BillingGateway,
    'setCancelAtPeriodEnd' | 'cancelSubscription' | 'retrieveSubscription'
  >;
}

/** Stop renewing every live subscription of these businesses; returns their ids. */
export async function detenerRenovaciones(
  b: Billing,
  businessIds: readonly string[],
): Promise<string[]> {
  const stopped: string[] = [];
  for (const businessId of businessIds) {
    const current = currentSubscription(await b.repo.subscriptionsOf(businessId));
    if (current === null || !isLive(current) || current.cancelAt !== null) continue;
    const facts = await b.gateway.setCancelAtPeriodEnd(current.stripeSubscriptionId, true);
    const record = recordFrom(facts, businessId, 'sync');
    if (record !== null) await b.repo.saveSubscription(record);
    stopped.push(current.stripeSubscriptionId);
  }
  return stopped;
}

/** Resume what a deletion stopped. A row whose business Stripe does not name waits for the webhook. */
export async function reanudarRenovaciones(
  b: Billing,
  subscriptionIds: readonly string[],
): Promise<void> {
  for (const id of subscriptionIds) {
    const facts = await b.gateway.setCancelAtPeriodEnd(id, false);
    const record = facts.businessId === null ? null : recordFrom(facts, facts.businessId, 'sync');
    if (record !== null) await b.repo.saveSubscription(record);
  }
}

/** End outright every subscription of these businesses that is still live. */
export async function terminarSuscripciones(
  b: Billing,
  businessIds: readonly string[],
): Promise<void> {
  for (const businessId of businessIds) {
    for (const row of await b.repo.subscriptionsOf(businessId)) {
      if (!isLive(row)) continue;
      await b.gateway.cancelSubscription(row.stripeSubscriptionId);
      const record = recordFrom(
        await b.gateway.retrieveSubscription(row.stripeSubscriptionId),
        businessId,
        'deleted',
      );
      if (record !== null) await b.repo.saveSubscription(record);
    }
  }
}
