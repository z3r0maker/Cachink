import { throttleKey } from '@xangarro/auth-core';

import { CONFIRM_TTL_HOURS, MAIL_PER_EMAIL, MAIL_WINDOW_SECONDS } from './plazos';
import type { AccessDeps, Cuenta } from './ports';

/** Who the confirmation email greets. */
export type Destinatario = Cuenta & { readonly nombre: string | null };

/**
 * Mint a `confirm` link and mail it (N-83). A new link retires the earlier
 * ones, so only the newest email works. `limite`: this address already got
 * its emails for the window, and nothing is minted or sent.
 */
export async function enviarConfirmacion(
  deps: AccessDeps,
  c: Destinatario,
): Promise<'enviado' | 'limite'> {
  const key = throttleKey('confirm', 'email', c.email);
  if ((await deps.take(key, MAIL_PER_EMAIL, MAIL_WINDOW_SECONDS)) > 0) return 'limite';
  const token = await deps.links.issue(c.email, 'confirm', CONFIRM_TTL_HOURS * 60 * 60);
  // No account behind the address any more: answer as if it had been sent.
  if (token === null) return 'enviado';
  const negocio = (await deps.accounts.negocio(c.id))?.nombre ?? 'tu negocio';
  await deps.mail.confirmacion({ to: c.email, token, nombre: c.nombre, negocio });
  return 'enviado';
}
