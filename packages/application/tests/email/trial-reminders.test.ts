import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { SubscriptionRecord } from '../../src/billing/index.js';
import {
  EmailSendError,
  InMemoryEmailSender,
  SendTrialRemindersUseCase,
  selectTrialReminders,
  trialReminderWindow,
  type EmailRecipient,
  type TrialReminder,
} from '../../src/email/index.js';

const NOW = new Date('2026-09-18T15:00:00.000Z'); // 09:00 in Mexico City
const H = 3_600_000;
const at = (hoursFromNow: number) => new Date(NOW.getTime() + hoursFromNow * H).toISOString();

function sub(over: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
  return {
    stripeSubscriptionId: 'sub_1',
    businessId: 'b1',
    stripeCustomerId: 'cus_1',
    planId: 'xangarro',
    interval: 'month',
    status: 'trialing',
    stripeStatus: 'trialing',
    trialEnd: at(60),
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAt: null,
    collectionMethod: 'charge_automatically',
    ...over,
  };
}

describe('selectTrialReminders', () => {
  it('picks a trial ending in 48–72 h as trial-ending, keyed by its Mexico City end date', () => {
    const [r] = selectTrialReminders([sub({ trialEnd: at(60) })], NOW);
    assert.equal(r?.kind, 'trial-ending');
    assert.equal(r?.idempotencyKey, 'trial-ending:b1:2026-09-20');
  });

  it('picks a trial that ended in the last 24 h and was not paid as trial-ended', () => {
    const rows = [sub({ trialEnd: at(-5), status: 'lapsed', stripeStatus: 'canceled' })];
    assert.deepEqual(
      selectTrialReminders(rows, NOW).map((r) => r.kind),
      ['trial-ended'],
    );
  });

  it('skips trials outside both windows and trials that converted', () => {
    const rows = [
      sub({ stripeSubscriptionId: 'a', trialEnd: at(48) }), // window is (48, 72]
      sub({ stripeSubscriptionId: 'b', trialEnd: at(73) }),
      sub({ stripeSubscriptionId: 'c', trialEnd: at(-24) }),
      sub({ stripeSubscriptionId: 'd', trialEnd: at(-2), status: 'active' }),
      sub({ stripeSubscriptionId: 'e', trialEnd: null }),
    ];
    assert.deepEqual(selectTrialReminders(rows, NOW), []);
  });

  it('does not tell a business its trial ended when another subscription is paying', () => {
    const rows = [
      sub({ trialEnd: at(-3), status: 'lapsed' }),
      sub({ stripeSubscriptionId: 'sub_spei', status: 'active', trialEnd: null }),
    ];
    assert.deepEqual(selectTrialReminders(rows, NOW), []);
  });

  it('opens the query window one day back and three days ahead', () => {
    assert.deepEqual(trialReminderWindow(NOW), { from: at(-24), to: at(72) });
  });
});

function setup(recipient: EmailRecipient | null = { email: 'duena@example.mx', name: 'Tacos' }) {
  const sender = new InMemoryEmailSender();
  const reported: unknown[] = [];
  const rows = [sub()];
  const useCase = new SendTrialRemindersUseCase({
    trials: { between: async () => rows, ofBusinesses: async () => rows },
    recipients: { of: async () => recipient },
    compose: (r: TrialReminder, to: EmailRecipient) => ({
      subject: `${r.kind} ${to.name ?? ''}`,
      html: '<p>x</p>',
      text: 'x',
    }),
    sender,
    report: (e) => reported.push(e),
  });
  return { sender, reported, useCase, rows };
}

describe('SendTrialRemindersUseCase', () => {
  it('sends one email per reminder with its idempotency key and tags', async () => {
    const { sender, useCase } = setup();
    const out = await useCase.execute(NOW);
    assert.deepEqual(out, { sent: 1, skipped: 0, failed: 0 });
    assert.equal(sender.sent[0]?.to, 'duena@example.mx');
    assert.equal(sender.sent[0]?.idempotencyKey, 'trial-ending:b1:2026-09-20');
    assert.deepEqual(sender.sent[0]?.tags, [
      { name: 'kind', value: 'trial-ending' },
      { name: 'business', value: 'b1' },
    ]);
  });

  it('a second run the same day sends nothing new', async () => {
    const { sender, useCase } = setup();
    await useCase.execute(NOW);
    await useCase.execute(NOW);
    assert.equal(sender.sent.length, 1);
  });

  it('skips a business with no known recipient', async () => {
    const { sender, useCase } = setup(null);
    assert.deepEqual(await useCase.execute(NOW), { sent: 0, skipped: 1, failed: 0 });
    assert.equal(sender.sent.length, 0);
  });

  it('reports a failed send and carries on', async () => {
    const { sender, reported, useCase } = setup();
    sender.failNext(EmailSendError.fromStatus(422, 'domain not verified'));
    assert.deepEqual(await useCase.execute(NOW), { sent: 0, skipped: 0, failed: 1 });
    assert.equal((reported[0] as EmailSendError).code, 'EMAIL_REJECTED');
  });

  it('reports a recipient lookup that throws and carries on', async () => {
    const { reported, useCase } = setup();
    const broken = new SendTrialRemindersUseCase({
      ...useCase.deps,
      recipients: {
        of: async () => {
          throw new Error('stripe down');
        },
      },
    });
    assert.deepEqual(await broken.execute(NOW), { sent: 0, skipped: 0, failed: 1 });
    assert.equal(reported.length, 1);
  });
});
