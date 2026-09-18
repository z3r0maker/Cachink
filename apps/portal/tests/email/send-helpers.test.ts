import assert from 'node:assert/strict';
import { describe, it, vi } from 'vitest';

import { EmailSendError, InMemoryEmailSender } from '@xangarro/application/email';

vi.mock('../../src/server/observability/report', () => ({ reportError: vi.fn() }));

const { reportError } = await import('../../src/server/observability/report');
const { sendMagicLink, sendPasswordReset } = await import('../../src/server/email/auth-links');
const { notifyUsageThreshold } = await import('../../src/server/email/usage');
const { ownersViaBilling } = await import('../../src/server/email/recipients');

const RESET_URL = 'https://portal.xangarro.mx/restablecer?t=secret-token';

describe('sendPasswordReset / sendMagicLink (ADR-080)', () => {
  it('sends the reset template with a key that hides the token', async () => {
    const sender = new InMemoryEmailSender();
    const r = await sendPasswordReset('duena@example.mx', RESET_URL, { sender });
    assert.equal(r.ok, true);
    const sent = sender.sent[0];
    assert.equal(sent?.subject, 'Restablece tu contraseña de Xangarro');
    assert.match(sent?.text ?? '', /30 minutos/);
    assert.match(sent?.idempotencyKey ?? '', /^password-reset:[0-9a-f]{32}$/);
    assert.ok(!(sent?.idempotencyKey ?? '').includes('secret-token'));
  });

  it('sends the magic link once for a double submit', async () => {
    const sender = new InMemoryEmailSender();
    const url = 'https://portal.xangarro.mx/entrar?t=abc';
    await sendMagicLink('duena@example.mx', url, { sender, expiresInMinutes: 10 });
    await sendMagicLink('duena@example.mx', url, { sender, expiresInMinutes: 10 });
    assert.equal(sender.sent.length, 1);
    assert.match(sender.sent[0]?.text ?? '', /10 minutos/);
  });

  it('reports and returns a provider refusal', async () => {
    const sender = new InMemoryEmailSender();
    sender.failNext(EmailSendError.fromStatus(403, 'domain not verified'));
    const r = await sendPasswordReset('duena@example.mx', RESET_URL, { sender });
    assert.equal(r.ok, false);
    assert.equal(vi.mocked(reportError).mock.calls.at(-1)?.[1]?.endpoint, 'email/password-reset');
  });

  it('refuses a malformed address without sending', async () => {
    const sender = new InMemoryEmailSender();
    const r = await sendMagicLink('no-es-correo', 'https://x.mx/e', { sender });
    assert.equal(r.ok ? null : r.error.code, 'EMAIL_INVALID_MESSAGE');
  });
});

describe('notifyUsageThreshold (N-03 seam for N-02)', () => {
  const notice = {
    businessId: 'b1',
    period: '2026-09',
    metric: 'transactions' as const,
    threshold: 100 as const,
    used: 1_500,
    limit: 1_500,
    idempotencyKey: 'b1:2026-09:transactions:100',
  };
  const owners = ownersViaBilling(async (id) => (id === 'b1' ? 'cus_1' : null), {
    of: async () => ({ email: 'duena@example.mx', name: null }),
  });

  it('emails the owner the 100 % template with the plans link', async () => {
    const sender = new InMemoryEmailSender();
    const r = await notifyUsageThreshold(notice, { owners, sender, origin: 'https://p.test' });
    assert.equal(r.status, 'sent');
    assert.match(sender.sent[0]?.subject ?? '', /Llegaste al límite/);
    assert.match(sender.sent[0]?.html ?? '', /\/suscripcion/);
  });

  it('skips a business with no billing customer', async () => {
    const r = await notifyUsageThreshold(
      { ...notice, businessId: 'b2' },
      {
        owners,
        sender: new InMemoryEmailSender(),
      },
    );
    assert.deepEqual(r, { status: 'skipped', reason: 'no_recipient' });
  });

  it('reports a failed send', async () => {
    const sender = new InMemoryEmailSender();
    sender.failNext(EmailSendError.fromStatus(500, 'down'));
    const r = await notifyUsageThreshold(notice, { owners, sender });
    assert.equal(r.status, 'failed');
    assert.equal(vi.mocked(reportError).mock.calls.at(-1)?.[1]?.businessId, 'b1');
  });
});
