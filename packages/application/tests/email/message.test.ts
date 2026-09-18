import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  EmailSendError,
  InMemoryEmailSender,
  validateEmailMessage,
  type EmailMessage,
} from '../../src/email/index.js';

const msg = (over: Partial<EmailMessage> = {}): EmailMessage => ({
  to: 'duena@example.mx',
  subject: 'Hola',
  html: '<p>Hola</p>',
  text: 'Hola',
  tags: [{ name: 'kind', value: 'generic-notice' }],
  idempotencyKey: 'generic-notice:b1:2026-09-18',
  ...over,
});

describe('validateEmailMessage', () => {
  it('accepts a complete message', () => {
    assert.equal(validateEmailMessage(msg()), null);
  });

  it('refuses a malformed recipient', () => {
    const e = validateEmailMessage(msg({ to: 'no-es-correo' }));
    assert.equal(e?.code, 'EMAIL_INVALID_MESSAGE');
    assert.equal(e?.retryable, false);
  });

  it('refuses an empty subject, html or text part', () => {
    assert.equal(validateEmailMessage(msg({ subject: ' ' }))?.code, 'EMAIL_INVALID_MESSAGE');
    assert.equal(validateEmailMessage(msg({ html: '' }))?.code, 'EMAIL_INVALID_MESSAGE');
    assert.equal(validateEmailMessage(msg({ text: '' }))?.code, 'EMAIL_INVALID_MESSAGE');
  });

  it('refuses tags the provider would reject and an over-long idempotency key', () => {
    const badTag = msg({ tags: [{ name: 'kind', value: 'con espacio' }] });
    assert.equal(validateEmailMessage(badTag)?.code, 'EMAIL_INVALID_MESSAGE');
    const longKey = msg({ idempotencyKey: 'k'.repeat(257) });
    assert.equal(validateEmailMessage(longKey)?.code, 'EMAIL_INVALID_MESSAGE');
    assert.equal(validateEmailMessage(msg({ idempotencyKey: '' }))?.code, 'EMAIL_INVALID_MESSAGE');
  });
});

describe('EmailSendError', () => {
  it('marks 429 and 5xx as retryable, 4xx as final', () => {
    assert.equal(EmailSendError.fromStatus(429, 'x').code, 'EMAIL_RATE_LIMITED');
    assert.equal(EmailSendError.fromStatus(429, 'x').retryable, true);
    assert.equal(EmailSendError.fromStatus(503, 'x').code, 'EMAIL_PROVIDER_UNAVAILABLE');
    assert.equal(EmailSendError.fromStatus(503, 'x').retryable, true);
    assert.equal(EmailSendError.fromStatus(422, 'x').code, 'EMAIL_REJECTED');
    assert.equal(EmailSendError.fromStatus(422, 'x').retryable, false);
    assert.equal(EmailSendError.fromStatus(null, 'x').code, 'EMAIL_PROVIDER_UNAVAILABLE');
  });
});

describe('InMemoryEmailSender', () => {
  it('records each message and returns an id', async () => {
    const sender = new InMemoryEmailSender();
    const r = await sender.send(msg());
    assert.equal(r.ok, true);
    assert.equal(sender.sent.length, 1);
  });

  it('delivers one message per idempotency key, like the provider', async () => {
    const sender = new InMemoryEmailSender();
    const a = await sender.send(msg());
    const b = await sender.send(msg());
    assert.deepEqual(a, b);
    assert.equal(sender.sent.length, 1);
  });

  it('refuses an invalid message without recording it', async () => {
    const sender = new InMemoryEmailSender();
    const r = await sender.send(msg({ to: '' }));
    assert.equal(r.ok, false);
    assert.equal(sender.sent.length, 0);
  });

  it('can be told to fail, to exercise callers', async () => {
    const sender = new InMemoryEmailSender();
    sender.failNext(EmailSendError.fromStatus(500, 'boom'));
    const r = await sender.send(msg());
    assert.equal(r.ok, false);
    assert.equal(r.ok ? null : r.error.code, 'EMAIL_PROVIDER_UNAVAILABLE');
    assert.equal((await sender.send(msg())).ok, true);
  });
});
