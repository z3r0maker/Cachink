/**
 * Authentication result types for the user auth flow.
 *
 * AuthResult is returned by the AutenticarUsuarioUseCase. It indicates
 * whether the login attempt succeeded and if the user must change their
 * PIN on first login.
 *
 * ADR-049: PIN for daily login, Password for recovery.
 */

import type { UserId } from '../ids/index.js';
import type { UserRole } from '../entities/user.js';

export interface AuthResult {
  readonly success: boolean;
  readonly userId: UserId | null;
  readonly role: UserRole | null;
  readonly mustChangePin: boolean;
}

/** Successful authentication result. */
export function authSuccess(
  userId: UserId,
  role: UserRole,
  mustChangePin: boolean,
): AuthResult {
  return { success: true, userId, role, mustChangePin };
}

/** Failed authentication result. */
export function authFailure(): AuthResult {
  return { success: false, userId: null, role: null, mustChangePin: false };
}
