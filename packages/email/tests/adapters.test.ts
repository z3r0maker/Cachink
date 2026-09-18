import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'vitest';

import type { EmailMessage } from '@xangarro/application/email';

import {
  DEFAULT_EMAIL_FROM,
  emailSenderFromEnv,
  emailTransport,
  outboxSender,
  resendSender,
  type ResendClient,
} from '../src/index.js';

const msg: EmailMessage = {
  to: 'duena@example.mx',
  subject: 'Tu prueba termina en 3 días',
  html: '<p>Hola</p>',
  text: 'Hola',
  tags: [{ name: 'kind', value: 'trial-ending' }],
  idempotencyKey: 'trial-ending:b1:2026-09-20',
};

type Answer = Awaited<ReturnType<ResendClient['emails']['send']>>;

function fakeClient(answers: Answer[]) {
  const calls: { payload: unknown; options: unknown }[] = [];
  const client: ResendClient = {
    emails: {
      async send(payload, options) {
        calls.push({ payload, options });
        return answers[Math.min(calls.length - 1, answers.length - 1)] as Answer;
      },
    },
  };
  return { client, calls };
}

const ok = (id: string): Answer => ({ data: { id }, error: null });
const err = (statusCode: number | null, name = 'application_error'): Answer => ({
  data: null,
  error: { statusCode, name, message: 'x' },
});

describe('resendSender', () => {
  it('sends from/to/subject/html/text/tags and the idempotency key header option', async () => {
    const { client, calls } = fakeClient([ok('re_1')]);
    const sender = resendSender({
      apiKey: 'k',
      from: DEFAULT_EMAIL_FROM,
      replyTo: 'soporte@xangarro.mx',
      client,
    });
    assert.deepEqual(await sender.send(msg), { ok: true, id: 're_1' });
    assert.deepEqual(calls[0], {
      payload: {
        from: DEFAULT_EMAIL_FROM,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        tags: msg.tags,
        replyTo: 'soporte@xangarro.mx',
      },
      options: { idempotencyKey: msg.idempotencyKey },
    });
  });

  it('maps 429 and 5xx to retryable errors and 4xx to a rejection', async () => {
    const send = async (a: Answer) =>
      resendSender({ apiKey: 'k', from: 'a@b.mx', client: fakeClient([a]).client }).send(msg);
    const r429 = await send(err(429, 'rate_limit_exceeded'));
    const r500 = await send(err(500));
    const r403 = await send(err(403, 'invalid_from_address'));
    const r409 = await send(err(409, 'concurrent_idempotent_requests'));
    assert.equal(r429.ok ? null : r429.error.code, 'EMAIL_RATE_LIMITED');
    assert.equal(r500.ok ? null : r500.error.retryable, true);
    assert.equal(r403.ok ? null : r403.error.code, 'EMAIL_REJECTED');
    assert.equal(r409.ok ? null : r409.error.code, 'EMAIL_RATE_LIMITED');
  });

  it('refuses an invalid message without calling Resend', async () => {
    const { client, calls } = fakeClient([ok('never')]);
    const r = await resendSender({ apiKey: 'k', from: 'a@b.mx', client }).send({ ...msg, to: 'x' });
    assert.equal(r.ok ? null : r.error.code, 'EMAIL_INVALID_MESSAGE');
    assert.equal(calls.length, 0);
  });

  it('treats an answer with neither data nor error as unavailable', async () => {
    const { client } = fakeClient([{ data: null, error: null } as unknown as Answer]);
    const r = await resendSender({ apiKey: 'k', from: 'a@b.mx', client }).send(msg);
    assert.equal(r.ok ? null : r.error.code, 'EMAIL_PROVIDER_UNAVAILABLE');
  });
});

describe('outboxSender', () => {
  it('writes an .eml and an .html once per idempotency key', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'outbox-'));
    const sender = outboxSender({
      dir,
      from: DEFAULT_EMAIL_FROM,
      now: () => new Date('2026-09-18T15:00:00Z'),
    });
    const a = await sender.send(msg);
    const b = await sender.send(msg);
    assert.deepEqual(a, b);
    const files = (await readdir(dir)).sort();
    assert.equal(files.length, 2);
    const eml = await readFile(join(dir, files.find((f) => f.endsWith('.eml')) ?? ''), 'utf8');
    assert.match(eml, /^From: Xangarro <hola@xangarro\.mx>\r\n/);
    assert.match(eml, /Subject: =\?UTF-8\?B\?/);
    assert.match(eml, /X-Idempotency-Key: trial-ending:b1:2026-09-20/);
    assert.match(eml, /multipart\/alternative/);
  });

  it('reports a directory it cannot write as a typed error', async () => {
    const sender = outboxSender({ dir: '/dev/null/nope', from: DEFAULT_EMAIL_FROM });
    const r = await sender.send(msg);
    assert.equal(r.ok ? null : r.error.code, 'EMAIL_REJECTED');
  });

  it('refuses an invalid message', async () => {
    const r = await outboxSender({ dir: tmpdir(), from: 'a@b.mx' }).send({ ...msg, subject: '' });
    assert.equal(r.ok, false);
  });
});

describe('emailSenderFromEnv', () => {
  it('uses Resend with retries when RESEND_API_KEY is set', async () => {
    const { client, calls } = fakeClient([err(503), ok('re_2')]);
    const sender = emailSenderFromEnv(
      {
        RESEND_API_KEY: 're_test',
        EMAIL_FROM: 'Pruebas <p@xangarro.mx>',
        EMAIL_REPLY_TO: 'soporte@xangarro.mx',
      },
      { client, retry: { sleep: async () => {} } },
    );
    assert.deepEqual(await sender.send(msg), { ok: true, id: 're_2' });
    assert.equal(calls.length, 2);
    assert.equal((calls[0]?.payload as { from: string }).from, 'Pruebas <p@xangarro.mx>');
  });

  it('writes to the outbox locally when the key is absent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'outbox-'));
    assert.equal(emailTransport({}), 'outbox');
    const r = await emailSenderFromEnv({ RESEND_API_KEY: ' ' }, { outboxDir: dir }).send(msg);
    assert.equal(r.ok, true);
    assert.equal((await readdir(dir)).length, 2);
  });

  it('refuses to send (and says why) on Vercel without a key', async () => {
    assert.equal(emailTransport({ VERCEL_ENV: 'production' }), 'unconfigured');
    const r = await emailSenderFromEnv({ VERCEL_ENV: 'preview' }).send(msg);
    assert.equal(r.ok ? null : r.error.code, 'EMAIL_REJECTED');
  });
});
