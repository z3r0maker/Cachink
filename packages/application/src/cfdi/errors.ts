/**
 * Typed CFDI errors (CLAUDE.md §8). Every error carries a stable `code`;
 * `retryable` tells the caller (a webhook handler, a cron) whether trying the
 * same input again can succeed.
 */

export type CfdiErrorCode =
  | 'CFDI_INVALID_AMOUNT'
  | 'CFDI_INVALID_PAYMENT'
  | 'CFDI_UNSUPPORTED_CURRENCY'
  | 'CFDI_INVALID_PERIOD'
  | 'CFDI_PERIOD_NOT_CLOSED'
  | 'CFDI_RECORD_NOT_FOUND'
  | 'CFDI_NOT_STAMPED_YET'
  | 'CFDI_GLOBAL_IN_PROGRESS'
  | 'CFDI_INVALID_CANCELLATION'
  | 'CFDI_INVALID_REFUND'
  | 'CFDI_PARTIAL_REFUND_NEEDS_CREDIT_NOTE'
  | 'CFDI_GLOBAL_REFUND_NEEDS_CREDIT_NOTE'
  | 'CFDI_PROVIDER_REJECTED'
  | 'CFDI_PROVIDER_AUTH'
  | 'CFDI_PROVIDER_UNAVAILABLE'
  | 'CFDI_PROVIDER_CONFIG';

export class CfdiError extends Error {
  readonly code: CfdiErrorCode;
  readonly retryable: boolean;

  constructor(code: CfdiErrorCode, message: string, retryable = false) {
    super(message);
    this.name = 'CfdiError';
    this.code = code;
    this.retryable = retryable;
  }
}

/** The PAC or the SAT refused the document. Not retryable as-is. */
export class CfdiProviderRejectedError extends CfdiError {
  readonly providerCode: string;
  readonly details: readonly string[];

  constructor(providerCode: string, message: string, details: readonly string[] = []) {
    super('CFDI_PROVIDER_REJECTED', message);
    this.name = 'CfdiProviderRejectedError';
    this.providerCode = providerCode;
    this.details = details;
  }
}

/** Network failure, 5xx, rate limit or an idempotency key still in flight. */
export class CfdiProviderUnavailableError extends CfdiError {
  constructor(message: string) {
    super('CFDI_PROVIDER_UNAVAILABLE', message, true);
    this.name = 'CfdiProviderUnavailableError';
  }
}
