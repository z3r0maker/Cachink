import 'server-only';

import { createHash } from 'node:crypto';

import type { EmailSendResult, EmailSender } from '@xangarro/application/email';
import { renderActivationCodeEmail } from '@xangarro/email';

import { portalEmailSender, sendReported } from './sender';

/**
 * The pairing code by email (P-06). The idempotency key hashes the code, so a
 * double-clicked send is one email and the code never sits in a provider log.
 */
export async function sendActivationCode(
  to: string,
  input: { readonly code: string; readonly negocio: string; readonly expiresAt: string },
  sender: EmailSender = portalEmailSender(),
): Promise<EmailSendResult> {
  const hours = Math.max(1, Math.floor((Date.parse(input.expiresAt) - Date.now()) / 3_600_000));
  const content = await renderActivationCodeEmail({
    code: input.code,
    negocio: input.negocio,
    expiresInHours: hours,
  });
  const key = createHash('sha256').update(input.code).digest('hex').slice(0, 32);
  return sendReported(
    sender,
    {
      ...content,
      to,
      tags: [{ name: 'kind', value: 'activation-code' }],
      idempotencyKey: `activation-code:${key}`,
    },
    { endpoint: 'email/activation-code' },
  );
}
