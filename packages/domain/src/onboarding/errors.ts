/**
 * Typed errors for the "Platícanos de ti" wizard (N-12, ADR-067).
 */

export const ONBOARDING_ERROR_CODES = [
  'INVALID_WIZARD_ANSWERS',
  'CONTRADICTORY_WIZARD_ANSWERS',
  'UNKNOWN_PLAN',
] as const;

export type OnboardingErrorCode = (typeof ONBOARDING_ERROR_CODES)[number];

export class OnboardingError extends Error {
  constructor(
    readonly code: OnboardingErrorCode,
    message: string,
    /** Validation issues ("path: message"), for logs only — never shown raw. */
    readonly issues: readonly string[] = [],
  ) {
    super(message);
    this.name = 'OnboardingError';
  }
}
