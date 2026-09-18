import 'server-only';

import { createHash } from 'node:crypto';

import type { EmailSendResult, EmailSender } from '@xangarro/application/email';
import { renderMagicLinkEmail, renderPasswordResetEmail } from '@xangarro/email';

import { portalEmailSender, sendReported } from './sender';

/**
 * Sign-in link and password-reset emails (ADR-080, B-14).
 *
 * **Call site (for the portal/auth owner):** the reset and magic-link flows do
 * not exist on main yet. When they do, the action that mints the single-use
 * token builds the absolute URL (e.g. `${portalUrl(origin)}/restablecer?t=…`)
 * and calls `sendPasswordReset(email, url)` / `sendMagicLink(email, url)`.
 * These functions never see the token logic; they only carry the URL.
 * Answer the user the same way whether or not the address has an account —
 * the result here is for logging, not for the response.
 *
 * The idempotency key is a hash of the URL, so the token never reaches the
 * provider's logs as a key, and a double-submitted form sends one email.
 */
export interface AuthLinkOptions {
  /** Minutes the link works; shown in the email. Reset 30, magic link 15 by default. */
  readonly expiresInMinutes?: number;
  readonly sender?: EmailSender;
}

const keyOf = (kind: string, url: string) =>
  `${kind}:${createHash('sha256').update(url).digest('hex').slice(0, 32)}`;

export async function sendPasswordReset(
  to: string,
  url: string,
  options: AuthLinkOptions = {},
): Promise<EmailSendResult> {
  const content = await renderPasswordResetEmail({
    url,
    expiresInMinutes: options.expiresInMinutes ?? 30,
  });
  return sendReported(
    options.sender ?? portalEmailSender(),
    {
      ...content,
      to,
      tags: [{ name: 'kind', value: 'password-reset' }],
      idempotencyKey: keyOf('password-reset', url),
    },
    { endpoint: 'email/password-reset' },
  );
}

export async function sendMagicLink(
  to: string,
  url: string,
  options: AuthLinkOptions = {},
): Promise<EmailSendResult> {
  const content = await renderMagicLinkEmail({
    url,
    expiresInMinutes: options.expiresInMinutes ?? 15,
  });
  return sendReported(
    options.sender ?? portalEmailSender(),
    {
      ...content,
      to,
      tags: [{ name: 'kind', value: 'magic-link' }],
      idempotencyKey: keyOf('magic-link', url),
    },
    { endpoint: 'email/magic-link' },
  );
}
