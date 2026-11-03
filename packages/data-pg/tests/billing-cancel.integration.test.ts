import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import postgres from 'postgres';

import { createDb } from '../src/client';
import { saveSubscriptionRow, type SubscriptionRow } from '../src/queries/billing';
import {
  claimRenewalNotice,
  markRenewalNoticeSent,
  markRenewalNoticeUsed,
  recordCancellation,
  recordTermsConsent,
  renewalNoticeByHash,
  subscriptionsRenewingBetween,
} from '../src/queries/billing-cancel';
import { integrationSuite } from './support/db';
import { BIZ_A } from './support/tenants';

/**
 * `0049_billing_cancel_76bis.sql` (ADR-132): the reminder links, the acuse and
 * the Checkout consent. Only `xangarro_billing` writes them, nobody deletes
 * them, no tenant reads them. Real Postgres, as the real roles. The tables are
 * new, so there is no old data to carry: the old → new case is that every
 * existing subscription is readable by the renewal query unchanged.
 */
const { url, describe } = integrationSuite();

function billingUrl(appUrl: string): string {
  if (process.env.BILLING_DATABASE_URL) return process.env.BILLING_DATABASE_URL;
  const u = new URL(appUrl);
  u.username = 'xangarro_billing';
  u.password = 'xangarro_billing';
  return u.toString();
}

const suffix = Date.now().toString(36);
/** Per run: the hash column is unique across the table. */
const hash = (t: string) => createHash('sha256').update(`${t}-${suffix}`).digest('hex');
const SUB = `sub_76_${suffix}`;
const END = '2026-11-30T18:00:00.000Z';
const key = { businessId: BIZ_A, stripeSubscriptionId: SUB, periodEnd: END };

const row = (over: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  stripeSubscriptionId: SUB,
  businessId: BIZ_A,
  stripeCustomerId: `cus_${suffix}`,
  planId: 'xangarro',
  interval: 'month',
  status: 'active',
  stripeStatus: 'active',
  trialEnd: null,
  currentPeriodStart: '2026-10-30T18:00:00.000Z',
  currentPeriodEnd: END,
  cancelAt: null,
  collectionMethod: 'charge_automatically',
  ...over,
});

describe('billing 76 Bis tables', () => {
  let app: postgres.Sql;
  let billing: postgres.Sql;
  let db: ReturnType<typeof createDb>;

  beforeAll(async () => {
    app = postgres(url as string, { max: 1, onnotice: () => undefined });
    billing = postgres(billingUrl(url as string), { max: 1, onnotice: () => undefined });
    db = createDb(billingUrl(url as string));
    await saveSubscriptionRow(db, row());
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
    await billing?.end({ timeout: 5 });
    await db?.$client.end({ timeout: 5 });
  });

  it('the renewal query finds an existing subscription by the end of its period', async () => {
    const found = await subscriptionsRenewingBetween(db, '2026-11-29T00:00:00.000Z', END);
    assert.ok(found.some((r) => r.stripeSubscriptionId === SUB && r.currentPeriodEnd === END));
    const none = await subscriptionsRenewingBetween(db, END, '2026-12-31T00:00:00.000Z');
    assert.ok(!none.some((r) => r.stripeSubscriptionId === SUB), 'the range is (from, to]');
  });

  it('a renewal is claimed, re-claimed with a new link until sent, then never again', async () => {
    assert.equal(await claimRenewalNotice(db, key, hash('first')), true);
    assert.equal(await claimRenewalNotice(db, key, hash('second')), true, 'unsent: a new link');
    assert.equal(await renewalNoticeByHash(db, hash('first')), null, 'the old link is gone');
    await markRenewalNoticeSent(db, key);
    assert.equal(await claimRenewalNotice(db, key, hash('third')), false);
    assert.deepEqual(await renewalNoticeByHash(db, hash('second')), { ...key, usedAt: null });
  });

  it('a link is spent once and keeps its first time', async () => {
    await markRenewalNoticeUsed(db, hash('second'));
    const first = (await renewalNoticeByHash(db, hash('second')))?.usedAt;
    assert.ok(first);
    await markRenewalNoticeUsed(db, hash('second'));
    assert.equal((await renewalNoticeByHash(db, hash('second')))?.usedAt, first);
  });

  it('an acuse gets a CX folio and is never rewritten or deleted', async () => {
    const folio = await recordCancellation(db, {
      businessId: BIZ_A,
      stripeSubscriptionId: SUB,
      channel: 'portal',
      endsAt: END,
      requestedBy: null,
      requestedAt: '2026-11-20T18:00:00.000Z',
    });
    assert.match(folio, /^CX-[0-9A-F]{6}$/);
    await assert.rejects(
      billing`UPDATE billing_cancellations SET channel = 'correo' WHERE folio = ${folio}`,
      /permission denied/,
    );
    await assert.rejects(
      billing`DELETE FROM billing_cancellations WHERE folio = ${folio}`,
      /permission denied/,
    );
  });

  it('a consent is kept once per Checkout Session', async () => {
    const consent = {
      checkoutSessionId: `cs_${suffix}`,
      businessId: BIZ_A,
      stripeSubscriptionId: SUB,
      termsVersion: '0.1-borrador',
      acceptedAt: '2026-10-30T18:00:00.000Z',
    };
    await recordTermsConsent(db, consent);
    await recordTermsConsent(db, { ...consent, termsVersion: 'otra' });
    const rows = await billing<{ terms_version: string }[]>`
      SELECT terms_version FROM billing_consents WHERE checkout_session_id = ${`cs_${suffix}`}`;
    assert.deepEqual(
      rows.map((r) => r.terms_version),
      ['0.1-borrador'],
    );
  });

  it('a tenant can read none of it, and the billing role deletes none of it', async () => {
    await app`SELECT set_config('xangarro.business_id', ${BIZ_A}, false)`;
    for (const table of ['billing_renewal_notices', 'billing_cancellations', 'billing_consents']) {
      await assert.rejects(app.unsafe(`SELECT 1 FROM ${table}`), /permission denied/, table);
    }
    await assert.rejects(
      billing`DELETE FROM billing_renewal_notices WHERE stripe_subscription_id = ${SUB}`,
      /permission denied/,
    );
  });
});
