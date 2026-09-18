/**
 * N-03 for one business after a recompute: threshold notices for the open
 * month, and the "sugerir upgrade" item when the last two closed months were
 * both over. Every notice goes through the ledger, so each fires once.
 */

import {
  consecutiveMonthsOver,
  crossedThresholds,
  limitFor,
  type ThresholdCrossing,
  type UsageLimits,
  type UsagePeriod,
  type UsageSnapshot,
} from '@xangarro/domain/usage';

import type { SupportInbox } from '../support-inbox/index.js';
import type { NoticeRecipient, UsageNoticeLedger, UsageThresholdNotifier } from './ports.js';
import { limitItem, upgradeItem, upgradeKey } from './usage-items.js';

export interface NotifyDeps {
  readonly ledger: UsageNoticeLedger;
  readonly owner: UsageThresholdNotifier;
  readonly inbox: SupportInbox;
}

/** Send once: skip what was delivered, retry what was claimed and never finished. */
async function deliver(
  ledger: UsageNoticeLedger,
  key: string,
  recipient: NoticeRecipient,
  businessId: string,
  send: () => Promise<void>,
): Promise<number> {
  if ((await ledger.begin(key, recipient, businessId)) === 'done') return 0;
  await send();
  await ledger.finish(key, recipient);
  return 1;
}

async function crossingNotices(
  deps: NotifyDeps,
  crossing: ThresholdCrossing,
  current: UsageSnapshot,
  limits: UsageLimits,
): Promise<number> {
  const value = current[crossing.metric];
  const limit = limitFor(limits, crossing.metric) ?? 0;
  let sent = 0;
  for (const recipient of crossing.recipients) {
    const send =
      recipient === 'owner'
        ? () => deps.owner.notifyUsageThreshold({ crossing, value, limit })
        : () => deps.inbox.file(limitItem(crossing, value, limit));
    sent += await deliver(
      deps.ledger,
      crossing.idempotencyKey,
      recipient,
      crossing.businessId,
      send,
    );
  }
  return sent;
}

/** `history` holds the business's rows for the open month and the two before it. */
export async function notifyBusiness(
  deps: NotifyDeps,
  businessId: string,
  current: UsagePeriod,
  history: readonly UsageSnapshot[],
  limits: UsageLimits,
): Promise<number> {
  const open = history.find((h) => h.period === current) ?? {
    businessId,
    period: current,
    transactions: 0,
    activeProducts: 0,
  };
  let sent = 0;
  for (const crossing of crossedThresholds(null, open, limits)) {
    sent += await crossingNotices(deps, crossing, open, limits);
  }
  if (consecutiveMonthsOver(history, limits, { currentPeriod: current })) {
    const key = upgradeKey(businessId, current);
    sent += await deliver(deps.ledger, key, 'provider', businessId, () =>
      deps.inbox.file(upgradeItem(businessId, current)),
    );
  }
  return sent;
}
