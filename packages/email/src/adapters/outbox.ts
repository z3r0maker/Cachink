/**
 * The dev outbox (B-14): with no `RESEND_API_KEY`, every email is written to
 * `<app>/.email-outbox/` (gitignored) as an `.eml` you can open in any mail
 * client and an `.html` you can open in a browser. Same idempotency rule as
 * Resend: a key already written is not written again.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  EmailSendError,
  validateEmailMessage,
  type EmailMessage,
  type EmailSender,
} from '@xangarro/application/email';

export interface OutboxOptions {
  readonly dir: string;
  readonly from: string;
  readonly now?: () => Date;
}

function keyId(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}

/** RFC 2047 so accents in the subject survive every client. */
const header = (s: string) => `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;

const part = (type: string, body: string) => [
  `Content-Type: ${type}; charset=utf-8`,
  'Content-Transfer-Encoding: base64',
  '',
  b64(body),
];

function b64(body: string): string {
  return (
    Buffer.from(body, 'utf8')
      .toString('base64')
      .match(/.{1,76}/g) ?? []
  ).join('\r\n');
}

export function toEml(message: EmailMessage, from: string, date: Date): string {
  const boundary = `xangarro-${keyId(message.idempotencyKey)}`;
  return [
    `From: ${from}`,
    `To: ${message.to}`,
    ...(message.replyTo ? [`Reply-To: ${message.replyTo}`] : []),
    `Subject: ${header(message.subject)}`,
    `Date: ${date.toUTCString()}`,
    `X-Idempotency-Key: ${message.idempotencyKey}`,
    ...message.tags.map((t) => `X-Tag: ${t.name}=${t.value}`),
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    ...part('text/plain', message.text),
    `--${boundary}`,
    ...part('text/html', message.html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

export function outboxSender(options: OutboxOptions): EmailSender {
  const now = options.now ?? (() => new Date());
  return {
    async send(message) {
      const invalid = validateEmailMessage(message);
      if (invalid !== null) return { ok: false, error: invalid };
      const id = `outbox_${keyId(message.idempotencyKey)}`;
      try {
        await mkdir(options.dir, { recursive: true });
        const existing = await readdir(options.dir);
        if (existing.some((f) => f.includes(id))) return { ok: true, id };
        const date = now();
        const base = join(options.dir, `${date.toISOString().replaceAll(':', '-')}-${id}`);
        await writeFile(`${base}.eml`, toEml(message, options.from, date), 'utf8');
        await writeFile(`${base}.html`, message.html, 'utf8');
        return { ok: true, id };
      } catch (error) {
        const why = error instanceof Error ? error.message : String(error);
        return { ok: false, error: new EmailSendError('EMAIL_REJECTED', `outbox: ${why}`) };
      }
    },
  };
}
