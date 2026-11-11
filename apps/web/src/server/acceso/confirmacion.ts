import { throttleKey } from '@xangarro/auth-core';

import { enmascararCorreo, pareceCorreo } from '@/lib/correo';

import { enviarConfirmacion, type Destinatario } from './correo-de-confirmacion';
import { trasCredencial, type Entrada } from './entrar';
import { CORRECTIONS_PER_ACCOUNT, MAIL_WINDOW_SECONDS } from './plazos';
import type { AccessDeps } from './ports';

export { enviarConfirmacion };

/**
 * Confirming a new account's address (N-83, ADR-142; boards SgRevisaCorreo and
 * SgConfirmar). The emailed link confirms; the pass the signup browser holds
 * is what lets it ask for another email or correct a mistyped address.
 */
export type EnlaceDeConfirmacion =
  | { readonly estado: 'listo'; readonly email: string; readonly negocio: string }
  /** Expired, or retired by a newer email. The address is masked: the link may be anyone's. */
  | { readonly estado: 'vencido'; readonly correo: string }
  | { readonly estado: 'usado' }
  | { readonly estado: 'desconocido' };

/** What the page the link opens should show. Reads only: opening the link confirms nothing. */
export async function enlaceDeConfirmacion(
  deps: AccessDeps,
  token: string,
): Promise<EnlaceDeConfirmacion> {
  const view = await deps.links.peek(token, 'confirm');
  if (view === null) return { estado: 'desconocido' };
  if (view.confirmed) return { estado: 'usado' };
  if (view.state !== 'fresh') return { estado: 'vencido', correo: enmascararCorreo(view.email) };
  const negocio = (await deps.accounts.negocio(view.userId))?.nombre ?? 'tu negocio';
  return { estado: 'listo', email: view.email, negocio };
}

export type Confirmado =
  | Entrada
  | { readonly kind: 'enlace'; readonly estado: 'vencido' | 'usado' | 'desconocido' };

/** The button on that page: spend the link, send the welcome, open what opens. */
export async function confirmar(deps: AccessDeps, token: string): Promise<Confirmado> {
  const userId = await deps.links.confirm(token);
  if (userId === null) {
    const { estado } = await enlaceDeConfirmacion(deps, token);
    return { kind: 'enlace', estado: estado === 'listo' ? 'vencido' : estado };
  }
  const view = await deps.links.peek(token, 'confirm');
  if (view === null) return { kind: 'sin-negocio' };
  const negocio = await deps.accounts.negocio(userId);
  if (negocio !== null) {
    await deps.mail.bienvenida({
      to: view.email,
      nombre: view.nombre,
      negocio: negocio.nombre,
      businessId: negocio.id,
    });
  }
  return trasCredencial(deps, { id: userId, email: view.email }, 'enlace');
}

/** The unconfirmed account a pass belongs to; null once confirmed, expired or made up. */
export async function pasePendiente(
  deps: AccessDeps,
  pase: string | undefined,
): Promise<Destinatario | null> {
  if (pase === undefined) return null;
  const view = await deps.links.peek(pase, 'pending');
  if (view === null || view.state !== 'fresh' || view.confirmed) return null;
  return { id: view.userId, email: view.email, nombre: view.nombre };
}

/** «Mandar otro enlace», for whoever holds the pass. */
export async function reenviar(
  deps: AccessDeps,
  pase: string | undefined,
): Promise<'enviado' | 'limite' | 'sin-pase'> {
  const c = await pasePendiente(deps, pase);
  return c === null ? 'sin-pase' : enviarConfirmacion(deps, c);
}

/** «Mandar otro enlace» on an expired link's page: to that link's own account, never elsewhere. */
export async function reenviarVencido(
  deps: AccessDeps,
  token: string,
): Promise<'enviado' | 'limite' | 'no'> {
  const view = await deps.links.peek(token, 'confirm');
  if (view === null || view.confirmed || view.state === 'fresh') return 'no';
  return enviarConfirmacion(deps, { id: view.userId, email: view.email, nombre: view.nombre });
}

export type Corregido =
  | { readonly kind: 'ok'; readonly email: string; readonly enviado: boolean }
  | { readonly kind: 'sin-pase' | 'correo' | 'ocupado' | 'limite' };

/**
 * «Corregir mi correo»: only while unconfirmed, only for the pass holder, and
 * never to an address another account has. `ocupado` says no more than that.
 */
export async function corregir(
  deps: AccessDeps,
  pase: string | undefined,
  nuevo: string,
): Promise<Corregido> {
  const c = await pasePendiente(deps, pase);
  if (c === null) return { kind: 'sin-pase' };
  const email = nuevo.trim().toLowerCase();
  if (!pareceCorreo(email)) return { kind: 'correo' };
  if (email !== c.email) {
    const key = throttleKey('confirm', 'change', c.id);
    if ((await deps.take(key, CORRECTIONS_PER_ACCOUNT, MAIL_WINDOW_SECONDS)) > 0) {
      return { kind: 'limite' };
    }
    if (!(await deps.accounts.changeEmail(c.id, email))) return { kind: 'ocupado' };
  }
  const sent = await enviarConfirmacion(deps, { ...c, email });
  return { kind: 'ok', email, enviado: sent === 'enviado' };
}
