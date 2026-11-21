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
 * A refusal belongs to what was sent (R7): shown only while the operator is
 * still looking at that same code. A new QR or edited fields clear it.
 */
export function errorDeLoEnviado(
  enviado: string | null,
  actual: string | null,
  errorKey: string | null,
): string | null {
  return enviado !== null && enviado === actual ? errorKey : null;
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

/** Who the preview names as the owner (N-25): either half may be missing. */
export type DuenoLeido =
  | { readonly que: 'ambos'; readonly nombre: string; readonly correo: string }
  | { readonly que: 'uno'; readonly dueno: string };

/** «Dueño: Pedro · pedro@…», or the half there is; null when the business has no owner account. */
export function duenoLeido(nombre: string | null, correo: string | null): DuenoLeido | null {
  if (nombre !== null && correo !== null) return { que: 'ambos', nombre, correo };
  const dueno = nombre ?? correo;
  return dueno === null ? null : { que: 'uno', dueno };
}
