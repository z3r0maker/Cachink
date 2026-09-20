/**
 * Pure helpers for the activation form: normalise what the user types and
 * decide when "Activar" is enabled. The server re-validates everything.
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

export function canSubmitActivation(email: string, code: string): boolean {
  return EMAIL_SHAPE.test(email.trim()) && ACTIVATION_CODE_REGEX.test(code);
}
