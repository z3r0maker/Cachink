import type { OwnerRecipients } from '@xangarro/application/email';
import type { UsageThresholdNotifier } from '@xangarro/application/usage';
import { ownerEmailOf, type Db } from '@xangarro/data-pg';

import type { notifyUsageThreshold } from '../email/usage';

/**
 * The owner's usage email for the recompute (N-03 on B-14).
 *
 * The recipient is the business owner's own address, read through
 * `xangarro.owner_email()` (data-pg 0011) on the metering connection — so a
 * free business that never started a trial (no Stripe customer) is reached
 * too. A send that fails throws, so the notice ledger retries it tomorrow;
 * `no_recipient` and `not_for_owner` are final.
 */
export function ownerEmailRecipients(metering: Db): OwnerRecipients {
  return {
    async of(businessId) {
      const email = await ownerEmailOf(metering, businessId);
      return email === null ? null : { email, name: null };
    },
  };
}

export function emailUsageNotifier(
  send: typeof notifyUsageThreshold,
  owners: OwnerRecipients,
): UsageThresholdNotifier {
  return {
    async notifyUsageThreshold(notice) {
      const outcome = await send(notice, { owners });
      if (outcome.status === 'failed') throw outcome.error;
    },
  };
}
