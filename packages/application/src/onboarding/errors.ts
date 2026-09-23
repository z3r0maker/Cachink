/**
 * Typed errors for signup and the trial request. Messages are Spanish and safe
 * to show; `issues` are for logs only.
 */

export const SIGNUP_ERROR_CODES = [
  'INVALID_SIGNUP',
  'EMAIL_TAKEN',
  'NOT_A_PAID_PLAN',
  'CONSENT_REQUIRED',
] as const;
export type SignupErrorCode = (typeof SIGNUP_ERROR_CODES)[number];

export class SignupError extends Error {
  constructor(
    readonly code: SignupErrorCode,
    message: string,
    readonly issues: readonly string[] = [],
  ) {
    super(message);
    this.name = 'SignupError';
  }
}
