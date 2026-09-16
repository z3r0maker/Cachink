/**
 * Authentication result for operator sign-in (name + PIN).
 *
 * Returned by AutenticarUsuarioUseCase. Operators have no role and no
 * forced PIN change on the device (A-05): success carries only the id.
 */

import type { UserId } from '../ids/index.js';

export interface AuthResult {
  readonly success: boolean;
  readonly userId: UserId | null;
}

/** Successful authentication result. */
export function authSuccess(userId: UserId): AuthResult {
  return { success: true, userId };
}

/** Failed authentication result. */
export function authFailure(): AuthResult {
  return { success: false, userId: null };
}
