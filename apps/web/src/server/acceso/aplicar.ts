import 'server-only';

import { NO_BUSINESS } from '../sign-in';
import { borrarPaseYReto, guardarPase, guardarReto } from './cookies';
import type { Entrada } from './entrar';

/**
 * What a sign-in action answers its screen (N-83). `next` is where the screen
 * goes; the cookie each step needs is already set.
 *
 * - `portal`: there is a session.
 * - `segundo-paso`: `/login/verificar`.
 * - `confirmar`: «Revisa tu correo» (`/signup/revisa`).
 * - `nueva-contrasena`: `/login/restablecer` with the reset link minted here.
 */
export type Destino =
  | { readonly ok: true; readonly next: 'portal' | 'segundo-paso' | 'confirmar' }
  | { readonly ok: true; readonly next: 'nueva-contrasena'; readonly reset: string }
  | { readonly ok: false; readonly message: string };

export async function aplicarEntrada(entrada: Entrada): Promise<Destino> {
  switch (entrada.kind) {
    case 'sesion':
      await borrarPaseYReto();
      return { ok: true, next: 'portal' };
    case 'segundo-paso':
      await guardarReto(entrada.reto);
      return { ok: true, next: 'segundo-paso' };
    case 'confirmar':
      await guardarPase(entrada.pase);
      return { ok: true, next: 'confirmar' };
    case 'nueva-contrasena':
      return { ok: true, next: 'nueva-contrasena', reset: entrada.reset };
    case 'sin-negocio':
      return { ok: false, message: NO_BUSINESS };
  }
}
