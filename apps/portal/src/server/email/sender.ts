import 'server-only';

import type { EmailSendResult, EmailSender } from '@xangarro/application/email';
import { emailSenderFromEnv } from '@xangarro/email';

import { reportError } from '../observability/report';

/**
 * The portal's one `EmailSender` (B-14), from the environment:
 * `RESEND_API_KEY` → Resend with retries; unset locally → the dev outbox
 * (`apps/portal/.email-outbox/`); unset on Vercel → every send is refused and
 * reported. `EMAIL_FROM` / `EMAIL_REPLY_TO` are optional (`docs/ops/email.md`).
 */
let cached: EmailSender | undefined;

export function portalEmailSender(): EmailSender {
  cached ??= emailSenderFromEnv(process.env);
  return cached;
}

/** The public origin for links in emails: `PORTAL_URL`, else the caller's. */
export function portalUrl(fallbackOrigin: string): string {
  return (process.env.PORTAL_URL || fallbackOrigin).replace(/\/$/, '');
}

/** Sends and reports a failure (B-18: ids and codes only — never the address). */
export async function sendReported(
  sender: EmailSender,
  message: Parameters<EmailSender['send']>[0],
  scope: { readonly endpoint: string; readonly businessId?: string },
): Promise<EmailSendResult> {
  const result = await sender.send(message);
  if (!result.ok) reportError(result.error, scope);
  return result;
}
