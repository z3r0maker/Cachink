import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { InMemoryEmailSender, SendTrialRemindersUseCase } from '@xangarro/application/email';
import type { SubscriptionRecord } from '@xangarro/application/billing';

import { handleTrialEmailsCron } from '../../src/server/email/cron';
import { stripeRecipients, type StripeCustomers } from '../../src/server/email/recipients';
import { composeTrialEmail } from '../../src/server/email/trial-emails';
import { toRecord } from '../../src/server/email/trial-source';

const SECRET = 'cron-secret-0123456789abcdef';
const NOW = new Date('2026-09-18T15:00:00.000Z');
const req = (auth: string | null = `Bearer ${SECRET}`) =>
  new Request('https://portal.xangarro.mx/api/cron/trial-emails', {
    headers: auth === null ? {} : { authorization: auth },
  });

const trial: SubscriptionRecord = {
  stripeSubscriptionId: 'sub_1',
  businessId: 'b1',
  stripeCustomerId: 'cus_1',
  planId: 'xangarrote',
  interval: 'month',
  status: 'trialing',
  stripeStatus: 'trialing',
  trialEnd: '2026-09-21T03:00:00.000Z', // 60 h after NOW
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAt: null,
  collectionMethod: 'charge_automatically',
};

const stripe: StripeCustomers = {
  customers: {
    retrieve: async (id) =>
      id === 'cus_1' ? { email: 'duena@example.mx', name: 'Tacos Don Pepe' } : { deleted: true },
  },
};

function live(sender: InMemoryEmailSender) {
  const useCase = new SendTrialRemindersUseCase({
    trials: { between: async () => [trial], ofBusinesses: async () => [trial] },
    recipients: stripeRecipients(stripe),
    compose: composeTrialEmail('https://portal.xangarro.mx'),
    sender,
    report: () => undefined,
  });
  return (now: Date) => useCase.execute(now);
}

describe('GET /api/cron/trial-emails', () => {
  it('sends the day-11 email in Spanish with the Suscripción link, once per day', async () => {
    const sender = new InMemoryEmailSender();
    const deps = { secret: SECRET, now: () => NOW, run: live(sender), report: () => undefined };
    const res = await handleTrialEmailsCron(req(), deps);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, sent: 1, skipped: 0, failed: 0 });
    await handleTrialEmailsCron(req(), deps);
    assert.equal(sender.sent.length, 1);
    assert.equal(sender.sent[0]?.subject, 'Tu prueba termina en 3 días');
    assert.match(sender.sent[0]?.html ?? '', /portal\.xangarro\.mx\/suscripcion/);
    assert.match(sender.sent[0]?.text ?? '', /Xangarrote/);
  });

  it('refuses without the bearer secret, and is closed when the secret is unset', async () => {
    const deps = { now: () => NOW, run: live(new InMemoryEmailSender()), report: () => undefined };
    assert.equal(
      (await handleTrialEmailsCron(req('Bearer nope'), { ...deps, secret: SECRET })).status,
      401,
    );
    assert.equal((await handleTrialEmailsCron(req(null), { ...deps, secret: SECRET })).status, 401);
    assert.equal((await handleTrialEmailsCron(req(), { ...deps, secret: undefined })).status, 503);
  });

  it('reports a failed run and answers 500', async () => {
    const reported: unknown[] = [];
    const res = await handleTrialEmailsCron(req(), {
      secret: SECRET,
      now: () => NOW,
      run: async () => {
        throw new Error('BILLING_DATABASE_URL is not set.');
      },
      report: (e) => reported.push(e),
    });
    assert.equal(res.status, 500);
    assert.equal(reported.length, 1);
  });

  it('is scheduled daily at 15:00 UTC, which is 09:00 in Mexico City', () => {
    const config = JSON.parse(
      readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
    ) as { crons?: { path: string; schedule: string }[] };
    assert.deepEqual(
      config.crons?.find((c) => c.path === '/api/cron/trial-emails'),
      { path: '/api/cron/trial-emails', schedule: '0 15 * * *' },
    );
  });
});

describe('recipients and rows', () => {
  it('a deleted or email-less Stripe customer has no recipient', async () => {
    assert.equal(await stripeRecipients(stripe).of('cus_gone'), null);
    const noEmail: StripeCustomers = { customers: { retrieve: async () => ({ email: null }) } };
    assert.equal(await stripeRecipients(noEmail).of('cus_1'), null);
  });

  it('normalises Postgres timestamps to ISO-8601', () => {
    const r = toRecord({ ...trial, trialEnd: '2026-09-21 03:00:00+00', cancelAt: null });
    assert.equal(r.trialEnd, '2026-09-21T03:00:00.000Z');
  });
});
