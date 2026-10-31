/** In-memory cancellation ports: the acuse ledger, the confirmations, the reminder links. */

import type {
  CancellationAct,
  CancellationLedger,
  CancellationListener,
  CancellationNotice,
  RenewalNotice,
  RenewalNoticeKey,
  RenewalNoticeStore,
} from '../../src/billing/index.js';

export class FakeCancellations implements CancellationLedger {
  readonly acts: CancellationAct[] = [];
  record(act: CancellationAct) {
    this.acts.push(act);
    return Promise.resolve(`CX-${String(this.acts.length).padStart(6, '0')}`);
  }
}

export class FakeConfirmations implements CancellationListener {
  readonly sent: CancellationNotice[] = [];
  fail = false;
  onCancelled(notice: CancellationNotice) {
    if (this.fail) return Promise.reject(new Error('provider down'));
    this.sent.push(notice);
    return Promise.resolve();
  }
}

const keyOf = (k: RenewalNoticeKey) => `${k.stripeSubscriptionId}|${k.periodEnd}`;

export class FakeNotices implements RenewalNoticeStore {
  readonly rows = new Map<string, RenewalNotice & { token: string; sent: boolean }>();
  #n = 0;
  claim(key: RenewalNoticeKey) {
    const seen = this.rows.get(keyOf(key));
    if (seen?.sent) return Promise.resolve(null);
    this.#n += 1;
    const token = `tok${this.#n}`.padEnd(43, 'x');
    this.rows.set(keyOf(key), { ...key, usedAt: null, token, sent: false });
    return Promise.resolve(token);
  }
  markSent(key: RenewalNoticeKey) {
    const row = this.rows.get(keyOf(key));
    if (row) row.sent = true;
    return Promise.resolve();
  }
  find(token: string) {
    const row = [...this.rows.values()].find((r) => r.token === token);
    return Promise.resolve(
      row
        ? {
            businessId: row.businessId,
            stripeSubscriptionId: row.stripeSubscriptionId,
            periodEnd: row.periodEnd,
            usedAt: row.usedAt,
          }
        : null,
    );
  }
  markUsed(token: string) {
    const row = [...this.rows.values()].find((r) => r.token === token);
    if (row) row.usedAt = '2026-09-17T12:00:00.000Z';
    return Promise.resolve();
  }
}
