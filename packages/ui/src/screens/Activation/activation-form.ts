/**
 * Pure helpers for linking (A-04, C-14): normalise what the operator types,
 * say what is still missing, and read the pairing token out of the portal's
 * QR. The server re-validates everything.
 */

import { ACTIVATION_CODE_REGEX } from '@xangarro/contracts';

export const ACTIVATION_CODE_LENGTH = 8;

/** Uppercase, drop anything outside the code alphabet (no 0/O/1/I), cap at 8. */
export function sanitizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-HJ-NP-Z2-9]/g, '')
    .slice(0, ACTIVATION_CODE_LENGTH);
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const correoValido = (email: string): boolean => EMAIL_SHAPE.test(email.trim());

export function canSubmitActivation(email: string, code: string): boolean {
  return correoValido(email) && ACTIVATION_CODE_REGEX.test(code);
}

/** What «Conectar esta caja» still waits for, first thing first; null when ready. */
export type Falta = { readonly que: 'correo' } | { readonly que: 'letras'; readonly n: number };

export function faltaParaConectar(email: string, code: string): Falta | null {
  if (!correoValido(email)) return { que: 'correo' };
  if (code.length < ACTIVATION_CODE_LENGTH) {
    return { que: 'letras', n: ACTIVATION_CODE_LENGTH - code.length };
  }
  return null;
}

/**
 * The portal's QR is a link with the token in its fragment
 * (`https://…/activar#c=<token>`, C-14). Anything else (a product's barcode,
 * another app's QR) is not ours: null.
 */
export function tokenDeQr(data: string): string | null {
  const m = /\/activar#(?:.*&)?c=([A-Za-z0-9_-]{22,64})(?:&|$)/.exec(data.trim());
  return m?.[1] ?? null;
}
