/**
 * RecordRefundForCfdiUseCase — what a Stripe refund (`charge.refunded`)
 * does for the CFDI side (N-33, owner decision 2026-09-18).
 *
 * The manual path: **no PAC call here**. It is all of `CFDI_MODE=off`, and
 * the fallback of `SettleRefundForCfdiUseCase` when the PAC fails or the
 * case is not automated. What the refund does is honest bookkeeping:
 *
 * - the payment's status moves to a refunded state, so the customer's
 *   Facturas list shows it as `reembolso` instead of vanishing (0021):
 *   `stamped`/`in_global` → `cancel_requested` (a CFDI exists; staff cancels
 *   it), `pending_global` → `excluded_from_global` (it drops out of the next
 *   monthly global), `manual`/`claimed` → `cancelled` (nothing was issued);
 * - a **partial** refund of a `pending_global` payment keeps it in the
 *   global: the customer still paid the rest, so dropping it would leave
 *   income without a CFDI. The item asks for an egreso once the global is out;
 * - a `factura` inbox item is filed, idempotent per refund id, so staff
 *   cancels the CFDI in the SAT portal exactly like every other manual step.
 */

import type { SupportInbox } from '../support-inbox/index.js';
import { refundItem } from './cfdi-inbox-items.js';
import type { IssuedCfdiRecord, IssuedCfdiRepository } from './issued-cfdi-repository.js';

export interface RecordRefundForCfdiDeps {
  readonly repo: IssuedCfdiRepository;
  readonly inbox: SupportInbox;
}

export interface RefundReceived {
  /** The Stripe invoice id — the payment's key. */
  readonly invoiceId: string;
  readonly businessId: string;
  /** Stripe refund object id — the idempotency key of the inbox item. */
  readonly refundId: string;
  /** IVA included, in centavos. */
  readonly amountRefundedCentavos: number;
}

export type RecordRefundForCfdiResult =
  | { readonly outcome: 'marked'; readonly record: IssuedCfdiRecord }
  | { readonly outcome: 'unknown_payment' }
  | { readonly outcome: 'already_refunded'; readonly record: IssuedCfdiRecord };

const REFUNDED: Readonly<Record<string, IssuedCfdiRecord['status']>> = {
  stamped: 'cancel_requested',
  in_global: 'cancel_requested',
  pending_global: 'excluded_from_global',
  manual: 'cancelled',
  claimed: 'cancelled',
};

export class RecordRefundForCfdiUseCase {
  readonly #deps: RecordRefundForCfdiDeps;

  constructor(deps: RecordRefundForCfdiDeps) {
    this.#deps = deps;
  }

  /** `error`: why the automated path gave up, shown on the item. */
  async execute(refund: RefundReceived, error: unknown = null): Promise<RecordRefundForCfdiResult> {
    const { repo, inbox } = this.#deps;
    const record = await repo.findByPaymentId(refund.invoiceId);
    if (record === null) return { outcome: 'unknown_payment' };

    const next = nextStatus(record, refund);
    if (next === undefined) return { outcome: 'already_refunded', record };

    const updated: IssuedCfdiRecord = { ...record, status: next };
    await repo.update(updated);
    // Filing after the update, deliberately: if it throws, the webhook 500s
    // and Stripe retries — the status is already idempotent, and the item is
    // keyed per refund id.
    await inbox.file(refundItem(updated, refund, error));
    return { outcome: 'marked', record: updated };
  }
}

function nextStatus(
  record: IssuedCfdiRecord,
  refund: RefundReceived,
): IssuedCfdiRecord['status'] | undefined {
  const partial = BigInt(refund.amountRefundedCentavos) < record.totalCentavos;
  if (partial && record.status === 'pending_global') return 'pending_global';
  return REFUNDED[record.status];
}
