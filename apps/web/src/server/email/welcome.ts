import 'server-only';

import type { EmailSender, EmailSendResult } from '@xangarro/application/email';
import { renderWelcomeEmail } from '@xangarro/email';

import { portalEmailSender, portalUrl, sendReported } from './sender';

/**
 * The welcome email (B-14), sent by the signup action once the account and
 * its session exist. Keyed by business, so a double-submitted form or a
 * retried action sends one. A failure is reported, never surfaced: the
 * account is already created and the owner is already inside the portal.
 */
export interface WelcomeArgs {
  readonly to: string;
  readonly name: string | null;
  readonly nombreNegocio: string;
  readonly businessId: string;
  /** The request's origin; `PORTAL_URL` wins when set. */
  readonly origin: string;
  readonly sender?: EmailSender;
}

export async function sendWelcome(args: WelcomeArgs): Promise<EmailSendResult> {
  const content = await renderWelcomeEmail({
    name: args.name,
    nombreNegocio: args.nombreNegocio,
    comoEmpiezoUrl: `${portalUrl(args.origin)}/como-empiezo`,
  });
  return sendReported(
    args.sender ?? portalEmailSender(),
    {
      ...content,
      to: args.to,
      tags: [{ name: 'kind', value: 'welcome' }],
      idempotencyKey: `welcome:${args.businessId}`,
    },
    { endpoint: 'signup', businessId: args.businessId },
  );
}
