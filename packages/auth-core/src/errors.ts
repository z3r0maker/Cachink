/**
 * The one error type auth-core throws (CLAUDE.md §8: typed, with a `code`).
 *
 * Verification functions never throw for a *wrong* credential — a wrong
 * password or code is an expected outcome and comes back as `false`/`null`.
 * These codes are for misuse and corrupted inputs: an empty password to hash,
 * a key of the wrong length, a sealed secret that fails authentication.
 */
export type AuthCoreErrorCode =
  | 'INVALID_ARGUMENT'
  | 'INVALID_BASE32'
  | 'INVALID_KEY'
  | 'INVALID_SEALED_SECRET';

export class AuthCoreError extends Error {
  constructor(
    readonly code: AuthCoreErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'AuthCoreError';
  }
}
