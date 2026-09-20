/**
 * Maps an activation failure to the i18n key the screen shows.
 * Contract codes come from ERROR_CATALOG (single source); NETWORK and
 * BAD_RESPONSE are client-side conditions.
 */

import { ERROR_CATALOG, isKnownErrorCode } from '@xangarro/contracts';

export type ActivationErrorKey =
  | 'activate.errors.codeInvalid'
  | 'activate.errors.codeExpired'
  | 'activate.errors.codeUsed'
  | 'activate.errors.noSlots'
  | 'activate.errors.suspended'
  | 'activate.errors.network'
  | 'activate.errors.unknown';

const ACTIVATION_KEYS: ReadonlySet<string> = new Set([
  'activate.errors.codeInvalid',
  'activate.errors.codeExpired',
  'activate.errors.codeUsed',
  'activate.errors.noSlots',
  'activate.errors.suspended',
]);

export function activationErrorKey(code: string): ActivationErrorKey {
  if (code === 'NETWORK') return 'activate.errors.network';
  if (isKnownErrorCode(code)) {
    const key = ERROR_CATALOG[code].userMessageKey;
    if (ACTIVATION_KEYS.has(key)) return key as ActivationErrorKey;
  }
  return 'activate.errors.unknown';
}
