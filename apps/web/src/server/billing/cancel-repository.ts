import type {
  CancellationLedger,
  ConsentLedger,
  RenewalNoticeStore,
} from '@xangarro/application/billing';
import type { RenewingSubscriptionSource } from '@xangarro/application/email';
import { hashToken, isPlausibleToken, mintToken } from '@xangarro/auth-core';
import {
  claimRenewalNotice,
  markRenewalNoticeSent,
  markRenewalNoticeUsed,
  recordCancellation,
  recordTermsConsent,
  renewalNoticeByHash,
  subscriptionsRenewingBetween,
  type Db,
} from '@xangarro/data-pg';

import { TERMINOS_VERSION } from '@/legal/terminos';

/**
 * The LFPC 76 Bis ports over Postgres (ADR-132), on the `xangarro_billing`
 * connection: the acuse ledger, the reminder links, the Checkout consent and
 * the renewals to announce. A link is 256 random bits; only its SHA-256 is
 * stored (`@xangarro/auth-core`'s session tokens, reused).
 */
export function pgCancellationLedger(db: Db): CancellationLedger {
  return { record: (act) => recordCancellation(db, act) };
}

export function pgRenewalNoticeStore(db: Db): RenewalNoticeStore {
  return {
    async claim(key) {
      const token = mintToken();
      return (await claimRenewalNotice(db, key, hashToken(token))) ? token : null;
    },
    markSent: (key) => markRenewalNoticeSent(db, key),
    find: (token) =>
      isPlausibleToken(token) ? renewalNoticeByHash(db, hashToken(token)) : Promise.resolve(null),
    async markUsed(token) {
      if (isPlausibleToken(token)) await markRenewalNoticeUsed(db, hashToken(token));
    },
  };
}

export function pgConsentLedger(db: Db): ConsentLedger {
  return {
    recordTerms: (a) => recordTermsConsent(db, { ...a, termsVersion: TERMINOS_VERSION }),
  };
}

export function pgRenewingSource(db: Db): RenewingSubscriptionSource {
  return { renewingBetween: (from, to) => subscriptionsRenewingBetween(db, from, to) };
}
