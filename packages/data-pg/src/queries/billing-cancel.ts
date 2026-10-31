/**
 * Cancelling and renewing (LFPC art. 76 Bis, ADR-132): the reminder links,
 * the acuse ledger, the Checkout consent and the renewals the reminder cron
 * reads. Every write runs on the `xangarro_billing` connection
 * (`0049_billing_cancel_76bis.sql`); nothing here deletes.
 *
 * Tokens never arrive here, only their SHA-256: the caller hashes.
 */

import { randomBytes } from 'node:crypto';

import { and, eq, gt, isNull, lte, sql } from 'drizzle-orm';

import type { Db } from '../client.js';
import {
  billingCancellations,
  billingConsents,
  billingRenewalNotices,
} from '../schema/billing-76bis.js';
import { subscriptions } from '../schema/billing.js';
import { toSubscriptionRow, type SubscriptionRow } from './billing.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

const iso = (v: string | null): string | null => (v === null ? null : new Date(v).toISOString());

export interface RenewalNoticeKeyRow {
  readonly businessId: string;
  readonly stripeSubscriptionId: string;
  readonly periodEnd: string;
}

const keyIs = (k: RenewalNoticeKeyRow) =>
  and(
    eq(billingRenewalNotices.stripeSubscriptionId, k.stripeSubscriptionId),
    eq(billingRenewalNotices.periodEnd, k.periodEnd),
  );

/**
 * Store this link for the renewal, replacing one whose email never went out.
 * `false` when the renewal's reminder was already sent: the link is not stored.
 */
export async function claimRenewalNotice(
  db: Conn,
  key: RenewalNoticeKeyRow,
  tokenHash: string,
): Promise<boolean> {
  const rows = await db
    .insert(billingRenewalNotices)
    .values({ ...key, tokenHash })
    .onConflictDoUpdate({
      target: [billingRenewalNotices.stripeSubscriptionId, billingRenewalNotices.periodEnd],
      set: { tokenHash, createdAt: sql`now()` },
      setWhere: isNull(billingRenewalNotices.sentAt),
    })
    .returning({ hash: billingRenewalNotices.tokenHash });
  return rows.length > 0;
}

export async function markRenewalNoticeSent(db: Conn, key: RenewalNoticeKeyRow): Promise<void> {
  await db
    .update(billingRenewalNotices)
    .set({ sentAt: sql`now()` })
    .where(and(keyIs(key), isNull(billingRenewalNotices.sentAt)));
}

export interface RenewalNoticeRow extends RenewalNoticeKeyRow {
  readonly usedAt: string | null;
}

export async function renewalNoticeByHash(
  db: Conn,
  tokenHash: string,
): Promise<RenewalNoticeRow | null> {
  const [row] = await db
    .select()
    .from(billingRenewalNotices)
    .where(eq(billingRenewalNotices.tokenHash, tokenHash));
  if (row === undefined) return null;
  return {
    businessId: row.businessId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    periodEnd: iso(row.periodEnd) ?? '',
    usedAt: iso(row.usedAt),
  };
}

/** Spend the link; a link already spent keeps its first time. */
export async function markRenewalNoticeUsed(db: Conn, tokenHash: string): Promise<void> {
  await db
    .update(billingRenewalNotices)
    .set({ usedAt: sql`now()` })
    .where(
      and(eq(billingRenewalNotices.tokenHash, tokenHash), isNull(billingRenewalNotices.usedAt)),
    );
}

export interface CancellationRow {
  readonly businessId: string;
  readonly stripeSubscriptionId: string;
  readonly channel: 'portal' | 'correo';
  readonly endsAt: string;
  readonly requestedBy: string | null;
  readonly requestedAt: string;
}

const folio = () => `CX-${randomBytes(3).toString('hex').toUpperCase()}`;

/** Append the acuse and return its folio; a folio already taken is drawn again. */
export async function recordCancellation(db: Conn, act: CancellationRow): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = folio();
    const rows = await db
      .insert(billingCancellations)
      .values({ ...act, folio: candidate })
      .onConflictDoNothing({ target: billingCancellations.folio })
      .returning({ folio: billingCancellations.folio });
    if (rows[0] !== undefined) return rows[0].folio;
  }
  throw new Error('No free cancellation folio after 5 draws.');
}

export interface ConsentRow {
  readonly checkoutSessionId: string;
  readonly businessId: string;
  readonly stripeSubscriptionId: string | null;
  readonly termsVersion: string;
  readonly acceptedAt: string;
}

/** Once per Checkout Session: a redelivered webhook keeps the first row. */
export async function recordTermsConsent(db: Conn, row: ConsentRow): Promise<void> {
  await db.insert(billingConsents).values(row).onConflictDoNothing();
}

/** Every subscription whose paid period ends in `(from, to]`: the renewals to announce. */
export async function subscriptionsRenewingBetween(
  db: Conn,
  from: string,
  to: string,
): Promise<SubscriptionRow[]> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(and(gt(subscriptions.currentPeriodEnd, from), lte(subscriptions.currentPeriodEnd, to)));
  return rows.map(toSubscriptionRow);
}
