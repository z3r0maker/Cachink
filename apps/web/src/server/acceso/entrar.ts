import { enviarConfirmacion } from './correo-de-confirmacion';
import { CHALLENGE_TTL_SECONDS, PENDING_TTL_SECONDS, RESET_TTL_SECONDS } from './plazos';
import type { AccessDeps, Cuenta } from './ports';

/**
 * What opens once a credential has been proven (N-83, ADR-142). Every way in
 * ends here, so none can skip a step: the password, a sign-in link, a reset.
 *
 * - `confirmar`: the address is unconfirmed and a password proves nothing
 *   about the inbox. No session; the browser gets a pass and a fresh email.
 * - `nueva-contrasena`: a sign-in link reached an unconfirmed account. The
 *   link proves the inbox, the registrant's password is gone, a new one is due.
 * - `segundo-paso`: the second factor is on. No session, only a challenge.
 */
export type Entrada =
  | { readonly kind: 'sesion' }
  | { readonly kind: 'sin-negocio' }
  | { readonly kind: 'confirmar'; readonly pase: string }
  | { readonly kind: 'nueva-contrasena'; readonly reset: string }
  | { readonly kind: 'segundo-paso'; readonly reto: string };

export type Via = 'password' | 'enlace' | 'reset';

const SIN_NEGOCIO: Entrada = { kind: 'sin-negocio' };

async function abrir(deps: AccessDeps, c: Cuenta): Promise<Entrada> {
  const factor = await deps.factor.status(c.id);
  if (factor?.enrolledAt) {
    const reto = await deps.links.issue(c.email, 'challenge', CHALLENGE_TTL_SECONDS);
    return reto === null ? SIN_NEGOCIO : { kind: 'segundo-paso', reto };
  }
  return (await deps.sessions.open(c.id)) ? { kind: 'sesion' } : SIN_NEGOCIO;
}

async function pedirConfirmacion(deps: AccessDeps, c: Cuenta): Promise<Entrada> {
  const pase = await deps.links.issue(c.email, 'pending', PENDING_TTL_SECONDS);
  if (pase === null) return SIN_NEGOCIO;
  const nombre = (await deps.links.peek(pase, 'pending'))?.nombre ?? null;
  await enviarConfirmacion(deps, { ...c, nombre });
  return { kind: 'confirmar', pase };
}

async function reclamar(deps: AccessDeps, c: Cuenta, via: 'enlace' | 'reset'): Promise<Entrada> {
  const claimed = await deps.accounts.claim(c.id, via === 'reset');
  // Not claimed: someone confirmed it a moment ago, so it is an ordinary account now.
  if (!claimed || via === 'reset') return abrir(deps, c);
  const reset = await deps.links.issue(c.email, 'reset', RESET_TTL_SECONDS);
  return reset === null ? SIN_NEGOCIO : { kind: 'nueva-contrasena', reset };
}

export async function trasCredencial(deps: AccessDeps, c: Cuenta, via: Via): Promise<Entrada> {
  const confirmed = await deps.accounts.confirmed(c.id);
  if (confirmed === null) return SIN_NEGOCIO;
  if (confirmed) return abrir(deps, c);
  return via === 'password' ? pedirConfirmacion(deps, c) : reclamar(deps, c, via);
}
