import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { EmailSendError, type UsageThresholdNotice } from '@xangarro/application/email';
import type { SubscriptionRow } from '@xangarro/data-pg';

import { handleCron } from '../../src/server/cron';
import { limitsFromSubscriptions } from '../../src/server/usage/adapters';
import { emailUsageNotifier } from '../../src/server/usage/owner-notifier';

const NOW = new Date('2026-09-18T09:00:00Z');
const cdmx = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));

describe('portal crons', () => {
  const crons = (
    JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
      crons: { path: string; schedule: string }[];
    }
  ).crons;

  it('recomputes usage nightly at 03:00 in Mexico City', () => {
    assert.equal(crons.find((c) => c.path === '/api/cron/usage')?.schedule, '0 9 * * *');
    assert.equal(cdmx('2026-09-18T09:00:00Z'), '18, 03');
  });

  it('closes the CFDI month at 01:00 on the 1st in Mexico City, after the month ended', () => {
    assert.equal(crons.find((c) => c.path === '/api/cron/cfdi-close')?.schedule, '0 7 1 * *');
    assert.equal(cdmx('2026-10-01T07:00:00Z'), '01, 01');
  });

  const req = (auth?: string) =>
    new Request('https://portal.test/api/cron/usage', {
      headers: auth ? { authorization: auth } : {},
    });
  const deps = (run: () => Promise<object>, reported: unknown[] = []) => ({
    secret: 's3cret',
    now: () => NOW,
    run,
    report: (e: unknown) => void reported.push(e),
    failure: 'usage_failed',
  });

  it('runs with the right bearer and answers its result', async () => {
    const res = await handleCron(
      req('Bearer s3cret'),
      deps(async () => ({ notices: 2 })),
    );
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, notices: 2 });
  });

  it('refuses a wrong or missing bearer, and closes when the secret is unset', async () => {
    const never = async () => assert.fail('must not run');
    assert.equal((await handleCron(req('Bearer nope'), deps(never))).status, 401);
    assert.equal((await handleCron(req(), deps(never))).status, 401);
    const closed = { ...deps(never), secret: undefined };
    assert.equal((await handleCron(req('Bearer s3cret'), closed)).status, 503);
  });

  it('reports a failed run and answers 500', async () => {
    const reported: unknown[] = [];
    const boom = async () => Promise.reject(new Error('db down'));
    const res = await handleCron(req('Bearer s3cret'), deps(boom, reported));
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: 'usage_failed' });
    assert.equal(reported.length, 1);
  });
});

describe('usage adapters', () => {
  const sub = (over: Partial<SubscriptionRow>): SubscriptionRow => ({
    stripeSubscriptionId: 'sub_1',
    businessId: 'b-paid',
    stripeCustomerId: 'cus_1',
    planId: 'xangarro',
    interval: 'month',
    status: 'active',
    stripeStatus: 'active',
    trialEnd: null,
    currentPeriodStart: '2026-09-01T00:00:00.000Z',
    currentPeriodEnd: '2026-10-01T00:00:00.000Z',
    cancelAt: null,
    collectionMethod: 'charge_automatically',
    ...over,
  });

  it('meters a business with no subscription as the free plan, a paid one by its plan', () => {
    const limits = limitsFromSubscriptions(['b-free', 'b-paid'], [sub({})], NOW);
    assert.deepEqual(limits.get('b-free'), { transactionsPerMonth: 50, activeProducts: null });
    assert.deepEqual(limits.get('b-paid'), { transactionsPerMonth: null, activeProducts: null });
  });

  it('meters a long-lapsed subscription as the free plan', () => {
    const lapsed = sub({ status: 'lapsed', currentPeriodEnd: '2026-01-01T00:00:00.000Z' });
    const limits = limitsFromSubscriptions(['b-paid'], [lapsed], NOW);
    assert.equal(limits.get('b-paid')?.transactionsPerMonth, 50);
  });

  const notice: UsageThresholdNotice = {
    businessId: 'b',
    period: '2026-09',
    metric: 'transactions',
    threshold: 80,
    used: 40,
    limit: 50,
    idempotencyKey: 'b:2026-09:transactions:80',
  };
  const owners = { of: async () => ({ email: 'd@x.mx', name: null }) };

  it('throws when the owner email was not sent, so the ledger retries it', async () => {
    const error = new EmailSendError('EMAIL_PROVIDER_UNAVAILABLE', 'down', 503);
    const failing = emailUsageNotifier(async () => ({ status: 'failed', error }), owners);
    await assert.rejects(failing.notifyUsageThreshold(notice), EmailSendError);
  });

  it('treats sent and skipped (no recipient) as done', async () => {
    const seen: unknown[] = [];
    const sent = emailUsageNotifier(async (n, d) => {
      seen.push([n, d.owners]);
      return { status: 'sent', id: 'e1' };
    }, owners);
    await sent.notifyUsageThreshold(notice);
    assert.deepEqual(seen, [[notice, owners]]);
    const skipped = emailUsageNotifier(
      async () => ({ status: 'skipped', reason: 'no_recipient' }),
      owners,
    );
    await skipped.notifyUsageThreshold(notice);
  });
});
