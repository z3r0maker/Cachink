import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';

import type { SubscriptionRecord } from '../../src/billing/index.js';
import {
  EmailSendError,
  InMemoryEmailSender,
  SendRenewalRemindersUseCase,
  renewalReminderWindow,
  selectRenewalReminders,
  type EmailRecipient,
} from '../../src/email/index.js';
import { FakeNotices } from '../support/cancel-fakes.js';

const NOW = new Date('2026-09-17T15:00:00.000Z'); // Thursday, 09:00 in Mexico City
const FRI_25 = '2026-09-25T18:00:00.000Z'; // 6 días hábiles away (16 Sep is a rest day)
const MON_28 = '2026-09-28T18:00:00.000Z'; // 7 días hábiles away

function sub(over: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
  return {
    stripeSubscriptionId: 'sub_1',
    businessId: 'b1',
    stripeCustomerId: 'cus_1',
    planId: 'xangarro',
    interval: 'month',
    status: 'active',
    stripeStatus: 'active',
    trialEnd: null,
    currentPeriodStart: '2026-08-25T18:00:00.000Z',
    currentPeriodEnd: FRI_25,
    cancelAt: null,
    collectionMethod: 'charge_automatically',
    ...over,
  };
}

describe('selectRenewalReminders (LFPC 76 Bis)', () => {
  it('announces a monthly card renewal from the sixth día hábil before it, with the total with IVA', () => {
    assert.deepEqual(selectRenewalReminders([sub()], NOW), [
      {
        kind: 'card',
        businessId: 'b1',
        stripeSubscriptionId: 'sub_1',
        stripeCustomerId: 'cus_1',
        planId: 'xangarro',
        interval: 'month',
        chargeAt: FRI_25,
        totalCentavos: 23_084,
      },
    ]);
  });

  it('an annual SPEI year gets the SPEI reminder', () => {
    const rows = [sub({ interval: 'year', collectionMethod: 'send_invoice' })];
    const [r] = selectRenewalReminders(rows, NOW);
    assert.equal(r?.kind, 'spei');
    assert.equal(r?.totalCentavos, 230_840);
  });

  it('waits for a renewal still more than six días hábiles away', () => {
    assert.deepEqual(selectRenewalReminders([sub({ currentPeriodEnd: MON_28 })], NOW), []);
  });

  it('skips what will not renew: cancelled, past due, lapsed, already charged, no period', () => {
    const rows = [
      sub({ stripeSubscriptionId: 'a', cancelAt: FRI_25 }),
      sub({ stripeSubscriptionId: 'b', status: 'past_due' }),
      sub({ stripeSubscriptionId: 'c', status: 'lapsed' }),
      sub({ stripeSubscriptionId: 'd', currentPeriodEnd: '2026-09-17T14:00:00.000Z' }),
      sub({ stripeSubscriptionId: 'e', currentPeriodEnd: null }),
    ];
    assert.deepEqual(selectRenewalReminders(rows, NOW), []);
  });

  it('a renewal first seen late is still announced, late rather than never', () => {
    const rows = [sub({ currentPeriodEnd: '2026-09-18T18:00:00.000Z' })];
    assert.equal(selectRenewalReminders(rows, NOW).length, 1);
  });

  it('the query window starts now and covers three weeks', () => {
    assert.deepEqual(renewalReminderWindow(NOW), {
      from: NOW.toISOString(),
      to: '2026-10-08T15:00:00.000Z',
    });
  });
});

describe('SendRenewalRemindersUseCase', () => {
  let notices: FakeNotices;
  let sender: InMemoryEmailSender;
  let reported: unknown[];
  let recipient: EmailRecipient | null;
  let rows: SubscriptionRecord[];

  const run = () =>
    new SendRenewalRemindersUseCase({
      source: { renewingBetween: () => Promise.resolve(rows) },
      notices,
      recipients: { of: () => Promise.resolve(recipient) },
      compose: (r, to, token) => ({
        subject: `Se renueva ${r.planId}`,
        html: `<a href="/cancelar?t=${token}">${to.email}</a>`,
        text: token,
      }),
      sender,
      report: (e) => reported.push(e),
    }).execute(NOW);

  beforeEach(() => {
    notices = new FakeNotices();
    sender = new InMemoryEmailSender();
    reported = [];
    recipient = { email: 'pedro@example.mx', name: 'Taquería Don Pedro' };
    rows = [sub()];
  });

  it('sends one reminder carrying its cancel link, and marks the renewal sent', async () => {
    assert.deepEqual(await run(), { sent: 1, skipped: 0, failed: 0 });
    const [m] = sender.sent;
    assert.equal(m?.to, 'pedro@example.mx');
    assert.match(m?.text ?? '', /^tok1/);
    assert.match(m?.idempotencyKey ?? '', /^renewal:sub_1:2026-09-25:tok1/);
    assert.equal([...notices.rows.values()][0]?.sent, true);
  });

  it('a second run the same day sends nothing', async () => {
    await run();
    assert.deepEqual(await run(), { sent: 0, skipped: 1, failed: 0 });
    assert.equal(sender.sent.length, 1);
  });

  it('a customer with no address is skipped without spending a link', async () => {
    recipient = null;
    assert.deepEqual(await run(), { sent: 0, skipped: 1, failed: 0 });
    assert.equal(notices.rows.size, 0);
  });

  it('a refused send is reported, not marked, and retried next run with a new link', async () => {
    sender.failNext(new EmailSendError('EMAIL_REJECTED', 'nope'));
    assert.deepEqual(await run(), { sent: 0, skipped: 0, failed: 1 });
    assert.equal(reported.length, 1);
    assert.deepEqual(await run(), { sent: 1, skipped: 0, failed: 0 });
    assert.match(sender.sent.at(-1)?.text ?? '', /^tok2/);
  });

  it('one business failing never stops the next', async () => {
    rows = [sub(), sub({ stripeSubscriptionId: 'sub_2', businessId: 'b2' })];
    let calls = 0;
    const flaky = new SendRenewalRemindersUseCase({
      source: { renewingBetween: () => Promise.resolve(rows) },
      notices,
      recipients: {
        of: () =>
          ++calls === 1 ? Promise.reject(new Error('stripe down')) : Promise.resolve(recipient),
      },
      compose: () => ({ subject: 's', html: 'h', text: 't' }),
      sender,
      report: (e) => reported.push(e),
    });
    assert.deepEqual(await flaky.execute(NOW), { sent: 1, skipped: 0, failed: 1 });
  });
});
