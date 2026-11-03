import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import type { RenewalNoticeStore, SubscriptionRecord } from '@xangarro/application/billing';
import { InMemoryEmailSender, SendRenewalRemindersUseCase } from '@xangarro/application/email';

import { handleCron } from '../../src/server/cron';
import { cancellationEmailListener } from '../../src/server/email/cancellation';
import { stripeRecipients, type StripeCustomers } from '../../src/server/email/recipients';
import { composeRenewalEmail } from '../../src/server/email/renewal-emails';

/** The renewal reminders and the cancellation acuse as the portal sends them (LFPC 76 Bis). */
const SECRET = 'ci-only-not-a-real-secret';
const NOW = new Date('2026-09-17T16:00:00.000Z');
const req = (auth = `Bearer ${SECRET}`) =>
  new Request('https://app.xangarro.mx/api/cron/renewal-emails', {
    headers: { authorization: auth },
  });

const renewing: SubscriptionRecord = {
  stripeSubscriptionId: 'sub_1',
  businessId: 'b1',
  stripeCustomerId: 'cus_1',
  planId: 'xangarro',
  interval: 'month',
  status: 'active',
  stripeStatus: 'active',
  trialEnd: null,
  currentPeriodStart: '2026-08-25T18:00:00.000Z',
  currentPeriodEnd: '2026-09-25T18:00:00.000Z',
  cancelAt: null,
  collectionMethod: 'charge_automatically',
};

const stripe: StripeCustomers = {
  customers: {
    retrieve: async (id) =>
      id === 'cus_1' ? { email: 'duena@example.mx', name: 'Tacos Don Pepe' } : { deleted: true },
  },
};

function store(): RenewalNoticeStore & { sent: number } {
  let claimed = false;
  return {
    sent: 0,
    async claim() {
      if (this.sent > 0) return null;
      claimed = true;
      return 'T'.repeat(43);
    },
    async markSent() {
      if (claimed) this.sent += 1;
    },
    find: async () => null,
    markUsed: async () => undefined,
  };
}

function run(sender: InMemoryEmailSender, notices = store()) {
  const useCase = new SendRenewalRemindersUseCase({
    source: { renewingBetween: async () => [renewing] },
    notices,
    recipients: stripeRecipients(stripe),
    compose: composeRenewalEmail('https://app.xangarro.mx'),
    sender,
    report: () => undefined,
  });
  return (now: Date) => useCase.execute(now);
}

const deps = (sender: InMemoryEmailSender) => ({
  secret: SECRET,
  now: () => NOW,
  run: run(sender),
  report: () => undefined,
  failure: 'renewal_emails_failed',
});

describe('GET /api/cron/renewal-emails', () => {
  it('announces the renewal with the total and a cancel link to /cancelar, once', async () => {
    const sender = new InMemoryEmailSender();
    const d = deps(sender);
    const res = await handleCron(req(), d);
    assert.deepEqual(await res.json(), { ok: true, sent: 1, skipped: 0, failed: 0 });
    await handleCron(req(), d);
    assert.equal(sender.sent.length, 1);
    const [m] = sender.sent;
    assert.equal(m?.subject, 'Tu plan Xangarro se renueva el 25 de septiembre');
    assert.match(m?.html ?? '', /href="https:\/\/app\.xangarro\.mx\/cancelar\?t=T{43}"/);
    assert.match(m?.text ?? '', /\$230\.84 MXN, IVA incluido/);
    assert.match(m?.text ?? '', /el plan de Tacos Don Pepe/);
  });

  it('refuses a wrong secret and closes without one', async () => {
    const sender = new InMemoryEmailSender();
    assert.equal((await handleCron(req('Bearer nope'), deps(sender))).status, 401);
    assert.equal((await handleCron(req(), { ...deps(sender), secret: undefined })).status, 503);
    assert.equal(sender.sent.length, 0);
  });

  it('a failed run is reported and answers 500', async () => {
    const reported: unknown[] = [];
    const res = await handleCron(req(), {
      ...deps(new InMemoryEmailSender()),
      run: async () => {
        throw new Error('down');
      },
      report: (e) => reported.push(e),
    });
    assert.equal(res.status, 500);
    assert.equal(reported.length, 1);
  });

  it('is scheduled daily at 16:00 UTC, 10:00 in Mexico City', () => {
    const config = JSON.parse(
      readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
    ) as { crons?: { path: string; schedule: string }[] };
    assert.deepEqual(
      config.crons?.find((c) => c.path === '/api/cron/renewal-emails'),
      { path: '/api/cron/renewal-emails', schedule: '0 16 * * *' },
    );
  });
});

describe('the cancellation acuse email', () => {
  const notice = {
    businessId: 'b1',
    stripeSubscriptionId: 'sub_1',
    channel: 'portal' as const,
    endsAt: '2026-09-25T18:00:00.000Z',
    requestedBy: null,
    requestedAt: '2026-09-17T16:00:00.000Z',
    folio: 'CX-7F3A21',
    planId: 'xangarro' as const,
    interval: 'month' as const,
  };

  it('goes to the customer with the folio, keyed by it', async () => {
    const sender = new InMemoryEmailSender();
    const listener = cancellationEmailListener({
      customerOf: async () => 'cus_1',
      customers: stripeRecipients(stripe),
      sender,
      origin: 'https://app.xangarro.mx',
    });
    await listener.onCancelled(notice);
    await listener.onCancelled(notice);
    assert.equal(sender.sent.length, 1, 'the folio is the idempotency key');
    assert.equal(sender.sent[0]?.idempotencyKey, 'cancellation:CX-7F3A21');
    assert.match(sender.sent[0]?.text ?? '', /CX-7F3A21/);
  });

  it('a business with no Stripe customer, or one without an address, gets nothing', async () => {
    const sender = new InMemoryEmailSender();
    await cancellationEmailListener({
      customerOf: async () => null,
      customers: stripeRecipients(stripe),
      sender,
    }).onCancelled(notice);
    await cancellationEmailListener({
      customerOf: async () => 'cus_gone',
      customers: stripeRecipients(stripe),
      sender,
    }).onCancelled(notice);
    assert.equal(sender.sent.length, 0);
  });
});
