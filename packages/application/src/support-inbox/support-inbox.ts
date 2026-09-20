/**
 * The admin inbox, as other services file items into it (N-08).
 *
 * The admin console's `POST /api/internal/support-items` is the only way in;
 * `httpSupportInbox` is its client. Filing is idempotent by
 * `(source, sourceRef)` on the console's side, so a caller that retries — a
 * Stripe redelivery, a re-run cron — never files a second item.
 */

/** The kinds this package files; the console accepts more (`SUPPORT_KINDS`). */
export type InboxKind = 'ayuda' | 'factura' | 'limite' | 'sistema';

export interface InboxItemRequest {
  readonly kind: InboxKind;
  readonly urgent: boolean;
  readonly businessId: string | null;
  /** ≤ 200 characters. */
  readonly title: string;
  readonly body: string;
  /** Who files it, e.g. `stripe-webhook`, `usage-cron`. */
  readonly source: string;
  /** The source's idempotency key. */
  readonly sourceRef: string;
  /** `factura` only: the payment the CFDI is owed for. */
  readonly paymentRef: string | null;
}

export interface SupportInbox {
  file(item: InboxItemRequest): Promise<void>;
}

export type SupportInboxErrorCode =
  | 'INBOX_DISABLED'
  | 'INBOX_UNAUTHORIZED'
  | 'INBOX_REJECTED'
  | 'INBOX_UNAVAILABLE';

/** Filing failed. `retryable` — the same item may succeed later. */
export class SupportInboxError extends Error {
  readonly code: SupportInboxErrorCode;
  readonly retryable: boolean;

  constructor(code: SupportInboxErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'SupportInboxError';
    this.code = code;
    this.retryable = retryable;
  }
}

/** Records what would be filed; for tests and for a portal without the console configured. */
export class RecordingSupportInbox implements SupportInbox {
  readonly items: InboxItemRequest[] = [];

  file(item: InboxItemRequest): Promise<void> {
    if (!this.items.some((i) => i.source === item.source && i.sourceRef === item.sourceRef)) {
      this.items.push(item);
    }
    return Promise.resolve();
  }
}
