import { minutes } from '@xangarro/auth-core';

import type { SignInResult } from './sign-in';

/** What the diagnostics flag allows the banner to say beyond the generic refusal. */
export interface Diagnostics {
  readonly on: boolean;
  readonly db: string;
}

export type RefusedSignIn = Extract<SignInResult, { kind: 'invalid' | 'failed' | 'locked' }>;

/**
 * The banner for a refused sign-in, built here because a 'use server' file's
 * exports are all endpoints — no helper may leave it.
 *
 * Off (production): one generic sentence for every credential failure, the
 * console's account list is not public knowledge (SEC-AUTH-02). On
 * (`ADMIN_DIAGNOSTICS=1`, dev phase only): the reason and the database
 * consulted ride along, because "credenciales inválidas" is unbearably
 * opaque while an environment is being wired up.
 */
export function loginRefusalMessage(result: RefusedSignIn, diag: Diagnostics): string {
  if (result.kind === 'invalid') return 'Escribe tu correo y tu contraseña.';
  if (result.kind === 'locked')
    return `Demasiados intentos. Vuelve a intentar en ${minutes(result.wait)} min.`;
  if (!diag.on) return 'Correo o contraseña incorrectos.';
  return result.reason === 'no-account'
    ? `Correo o contraseña incorrectos — ese correo no existe en ${diag.db}.`
    : result.reason === 'no-password-set'
      ? `Correo o contraseña incorrectos — esa cuenta aún no tiene contraseña (${diag.db}).`
      : `Correo o contraseña incorrectos — el correo existe; la contraseña no coincide (${diag.db}).`;
}
