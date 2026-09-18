import 'server-only';

import {
  NotifyUsageThresholdUseCase,
  type EmailSender,
  type OwnerRecipients,
  type UsageNotifyOutcome,
  type UsageThresholdNotice,
} from '@xangarro/application/email';
import { billingCustomerOf } from '@xangarro/data-pg';
import { renderUsageThresholdEmail } from '@xangarro/email';

import { billingDb, stripeClient } from '../billing/config';
import { reportError } from '../observability/report';
import { ownersViaBilling, stripeRecipients } from './recipients';
import { portalEmailSender, portalUrl } from './sender';

/**
 * The owner's 80 % / 100 % usage email (N-03).
 *
 * **Call site (for the N-02 wiring branch):** after the usage use case
 * computes a snapshot, call this once per `crossedThresholds(prev, next,
 * limits)` crossing whose `recipients` include `'owner'`, with the counts:
 *
 *     await notifyUsageThreshold({ ...crossing, used: next[crossing.metric],
 *       limit: limitFor(limits, crossing.metric) });
 *
 * Once per threshold per month is the crossing's job; the idempotency key
 * (`usage-threshold:` + the crossing's key) makes a retried call send once.
 * Never throws for a send failure — it is reported and returned.
 */
export interface NotifyUsageDeps {
  readonly owners?: OwnerRecipients;
  readonly sender?: EmailSender;
  /** Portal origin when `PORTAL_URL` is unset. */
  readonly origin?: string;
}

function liveOwners(): OwnerRecipients {
  const db = billingDb();
  return ownersViaBilling(
    (businessId) => billingCustomerOf(db, businessId),
    stripeRecipients(stripeClient()),
  );
}

export async function notifyUsageThreshold(
  notice: UsageThresholdNotice,
  deps: NotifyUsageDeps = {},
): Promise<UsageNotifyOutcome> {
  const plansUrl = `${portalUrl(deps.origin ?? 'https://portal.xangarro.mx')}/suscripcion`;
  const useCase = new NotifyUsageThresholdUseCase({
    owners: deps.owners ?? liveOwners(),
    sender: deps.sender ?? portalEmailSender(),
    compose: (n, to) =>
      renderUsageThresholdEmail({
        threshold: n.threshold === 100 ? 100 : 80,
        metric: n.metric,
        used: n.used,
        limit: n.limit,
        plansUrl,
        name: to.name,
      }),
  });
  const outcome = await useCase.execute(notice);
  if (outcome.status === 'failed') {
    reportError(outcome.error, {
      endpoint: 'email/usage-threshold',
      businessId: notice.businessId,
    });
  }
  return outcome;
}
