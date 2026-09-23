import type { ActivateErrorCode } from './activate';

/**
 * What `/activate` answers for a refusal (SEC-DEV-01, owner decision
 * 2026-09-23): a wrong email is the same `CODE_INVALID` as an unknown code, so
 * the response never confirms that a code exists. The real reason stays in the
 * server's log line; the throttle still counts it as a guess.
 */
export function publicRefusal(reason: ActivateErrorCode): ActivateErrorCode {
  return reason === 'EMAIL_MISMATCH' ? 'CODE_INVALID' : reason;
}
