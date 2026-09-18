import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  EmailSendError,
  retryingSender,
  type EmailMessage,
  type EmailSendResult,
  type EmailSender,
} from '../../src/email/index.js';

const msg: EmailMessage = {
  to: 'duena@example.mx',
  subject: 'Hola',
  html: '<p>Hola</p>',
  text: 'Hola',
  tags: [],
  idempotencyKey: 'k1',
};

function scripted(results: EmailSendResult[]): EmailSender & { calls: number } {
  const s = {
    calls: 0,
    async send() {
      const r = results[s.calls] ?? results.at(-1);
      s.calls += 1;
      if (r === undefined) throw new Error('no script');
      return r;
    },
  };
  return s;
}

const fail = (status: number): EmailSendResult => ({
  ok: false,
  error: EmailSendError.fromStatus(status, 'x'),
});

describe('retryingSender', () => {
  it('returns the first success without waiting', async () => {
    const waits: number[] = [];
    const inner = scripted([{ ok: true, id: 'e1' }]);
    const r = await retryingSender(inner, { sleep: async (ms) => void waits.push(ms) }).send(msg);
    assert.deepEqual(r, { ok: true, id: 'e1' });
    assert.deepEqual(waits, []);
  });

  it('retries 429 and 5xx with growing backoff, then succeeds', async () => {
    const waits: number[] = [];
    const inner = scripted([fail(429), fail(502), { ok: true, id: 'e2' }]);
    const sender = retryingSender(inner, {
      attempts: 3,
      baseDelayMs: 100,
      sleep: async (ms) => void waits.push(ms),
    });
    assert.deepEqual(await sender.send(msg), { ok: true, id: 'e2' });
    assert.equal(inner.calls, 3);
    assert.deepEqual(waits, [100, 300]);
  });

  it('does not retry a rejection', async () => {
    const inner = scripted([fail(422), { ok: true, id: 'never' }]);
    const r = await retryingSender(inner, { sleep: async () => {} }).send(msg);
    assert.equal(r.ok, false);
    assert.equal(inner.calls, 1);
  });

  it('gives up after the last attempt with the last error', async () => {
    const inner = scripted([fail(500)]);
    const r = await retryingSender(inner, { attempts: 2, sleep: async () => {} }).send(msg);
    assert.equal(r.ok ? null : r.error.code, 'EMAIL_PROVIDER_UNAVAILABLE');
    assert.equal(inner.calls, 2);
  });

  it('turns a thrown adapter error into a retryable typed failure', async () => {
    const inner: EmailSender = {
      send: async () => {
        throw new Error('socket hang up');
      },
    };
    const r = await retryingSender(inner, { attempts: 2, sleep: async () => {} }).send(msg);
    assert.equal(r.ok ? null : r.error.code, 'EMAIL_PROVIDER_UNAVAILABLE');
  });

  it('waits on a real timer when no sleep is injected', async () => {
    const inner = scripted([fail(503), { ok: true, id: 'e3' }]);
    const r = await retryingSender(inner, { baseDelayMs: 1 }).send(msg);
    assert.deepEqual(r, { ok: true, id: 'e3' });
  });
});
