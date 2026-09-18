/**
 * Why an email was not sent (B-14). A typed value, not a thrown generic
 * `Error`: callers decide whether a failed email fails their work (the staff
 * digest answers 502) or is only reported (a trial reminder).
 */

export const EMAIL_ERROR_CODES = [
  /** The message itself is wrong; sending it again will not help. */
  'EMAIL_INVALID_MESSAGE',
  /** The provider said slow down (HTTP 429). */
  'EMAIL_RATE_LIMITED',
  /** The provider is down or unreachable (5xx, network). */
  'EMAIL_PROVIDER_UNAVAILABLE',
  /** The provider refused the message (other 4xx: bad key, unverified domain…). */
  'EMAIL_REJECTED',
] as const;
export type EmailErrorCode = (typeof EMAIL_ERROR_CODES)[number];

const RETRYABLE: ReadonlySet<EmailErrorCode> = new Set([
  'EMAIL_RATE_LIMITED',
  'EMAIL_PROVIDER_UNAVAILABLE',
]);

export class EmailSendError extends Error {
  readonly code: EmailErrorCode;
  readonly retryable: boolean;
  /** HTTP status from the provider, when there was one. */
  readonly status: number | null;

  constructor(code: EmailErrorCode, message: string, status: number | null = null) {
    super(message);
    this.name = 'EmailSendError';
    this.code = code;
    this.status = status;
    this.retryable = RETRYABLE.has(code);
  }

  /** Maps a provider HTTP status (or `null` for a network failure) to a code. */
  static fromStatus(status: number | null, message: string): EmailSendError {
    if (status === 429) return new EmailSendError('EMAIL_RATE_LIMITED', message, status);
    if (status === null || status >= 500) {
      return new EmailSendError('EMAIL_PROVIDER_UNAVAILABLE', message, status);
    }
    return new EmailSendError('EMAIL_REJECTED', message, status);
  }
}
