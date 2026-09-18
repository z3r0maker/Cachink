/**
 * Picks the sender from the environment (B-14). One rule for both apps:
 *
 * - `RESEND_API_KEY` set → Resend, with retries and backoff on 429/5xx.
 * - unset on a Vercel deployment → a sender that refuses every message with
 *   `EMAIL_REJECTED`, so the misconfiguration is reported rather than silent
 *   (Vercel's filesystem is read-only; an outbox there would lose mail).
 * - unset anywhere else → the dev outbox under `<cwd>/.email-outbox/`.
 *
 * `EMAIL_FROM` defaults to `Xangarro <hola@xangarro.mx>`; `EMAIL_REPLY_TO` is
 * optional. Nothing here logs a key.
 */
import { join } from 'node:path';

import {
  EmailSendError,
  retryingSender,
  type EmailSender,
  type RetryOptions,
} from '@xangarro/application/email';

import { outboxSender } from './outbox.js';
import { resendSender, type ResendClient } from './resend.js';

export const DEFAULT_EMAIL_FROM = 'Xangarro <hola@xangarro.mx>';

export interface EmailEnv {
  readonly RESEND_API_KEY?: string;
  readonly EMAIL_FROM?: string;
  readonly EMAIL_REPLY_TO?: string;
  readonly VERCEL_ENV?: string;
}

export interface FromEnvOptions {
  readonly outboxDir?: string;
  readonly retry?: RetryOptions;
  readonly client?: ResendClient;
}

export type EmailTransport = 'resend' | 'outbox' | 'unconfigured';

const set = (v: string | undefined): v is string => v !== undefined && v.trim() !== '';

export function emailTransport(env: EmailEnv): EmailTransport {
  if (set(env.RESEND_API_KEY)) return 'resend';
  return set(env.VERCEL_ENV) ? 'unconfigured' : 'outbox';
}

const unconfigured: EmailSender = {
  async send() {
    return {
      ok: false,
      error: new EmailSendError('EMAIL_REJECTED', 'RESEND_API_KEY no está configurada'),
    };
  },
};

export function emailSenderFromEnv(env: EmailEnv, options: FromEnvOptions = {}): EmailSender {
  const from = set(env.EMAIL_FROM) ? env.EMAIL_FROM : DEFAULT_EMAIL_FROM;
  const replyTo = set(env.EMAIL_REPLY_TO) ? env.EMAIL_REPLY_TO : undefined;
  switch (emailTransport(env)) {
    case 'resend':
      return retryingSender(
        resendSender({
          apiKey: env.RESEND_API_KEY ?? '',
          from,
          ...(replyTo === undefined ? {} : { replyTo }),
          ...(options.client === undefined ? {} : { client: options.client }),
        }),
        options.retry,
      );
    case 'unconfigured':
      return unconfigured;
    case 'outbox':
      return outboxSender({ dir: options.outboxDir ?? join(process.cwd(), '.email-outbox'), from });
  }
}
