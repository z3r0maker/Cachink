import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  EmailSendError,
  InMemoryEmailSender,
  NotifyUsageThresholdUseCase,
  type EmailRecipient,
  type UsageThresholdNotice,
} from '../../src/email/index.js';

const notice = (over: Partial<UsageThresholdNotice> = {}): UsageThresholdNotice => ({
  businessId: 'b1',
  period: '2026-09',
  metric: 'transactions',
  threshold: 80,
  used: 400,
  limit: 500,
  idempotencyKey: 'b1:2026-09:transactions:80',
  ...over,
});

function setup(owner: EmailRecipient | null = { email: 'duena@example.mx', name: null }) {
  const sender = new InMemoryEmailSender();
  const useCase = new NotifyUsageThresholdUseCase({
    owners: { of: async () => owner },
    compose: (n) => ({ subject: `Uso ${n.threshold}`, html: '<p>x</p>', text: 'x' }),
    sender,
  });
  return { sender, useCase };
}

describe('NotifyUsageThresholdUseCase', () => {
  it('emails the owner at 80 % with a key derived from the crossing', async () => {
    const { sender, useCase } = setup();
    const r = await useCase.execute(notice());
    assert.deepEqual(r, { status: 'sent', id: 'mem_1' });
    assert.equal(sender.sent[0]?.idempotencyKey, 'usage-threshold:b1:2026-09:transactions:80');
    assert.deepEqual(sender.sent[0]?.tags, [
      { name: 'kind', value: 'usage-threshold' },
      { name: 'threshold', value: '80' },
    ]);
  });

  it('sends once per crossing even when called twice', async () => {
    const { sender, useCase } = setup();
    await useCase.execute(
      notice({ threshold: 100, idempotencyKey: 'b1:2026-09:transactions:100' }),
    );
    await useCase.execute(
      notice({ threshold: 100, idempotencyKey: 'b1:2026-09:transactions:100' }),
    );
    assert.equal(sender.sent.length, 1);
  });

  it('does not email the owner at 150 % (provider-only threshold)', async () => {
    const { sender, useCase } = setup();
    const r = await useCase.execute(notice({ threshold: 150 }));
    assert.deepEqual(r, { status: 'skipped', reason: 'not_for_owner' });
    assert.equal(sender.sent.length, 0);
  });

  it('skips when the owner has no known address', async () => {
    const { useCase } = setup(null);
    assert.deepEqual(await useCase.execute(notice()), {
      status: 'skipped',
      reason: 'no_recipient',
    });
  });

  it('returns the typed send error', async () => {
    const { sender, useCase } = setup();
    sender.failNext(EmailSendError.fromStatus(429, 'slow down'));
    const r = await useCase.execute(notice());
    assert.equal(r.status, 'failed');
    assert.equal(r.status === 'failed' ? r.error.code : null, 'EMAIL_RATE_LIMITED');
  });
});
