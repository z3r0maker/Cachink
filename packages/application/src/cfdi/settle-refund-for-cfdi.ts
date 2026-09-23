/**
 * SettleRefundForCfdiUseCase — what a Stripe refund does for the CFDI with
 * `CFDI_MODE=test | live` (N-33). `off` uses `RecordRefundForCfdiUseCase`
 * alone.
 *
 * - **Full refund**, nothing credited yet:
 *   - payment with its own CFDI → cancelled at the PAC (motivo 03; a REP
 *     before its invoice), which may end `cancel_requested` while the
 *     receptor accepts;
 *   - payment waiting for the monthly global → dropped from it.
 * - **Partial refund**, or any refund once a note exists, of a payment with
 *   its own CFDI or inside a stamped global → a CFDI de egreso for the part
 *   not yet credited.
 * - Everything else, a SAT rejection, and any PAC failure → the manual path:
 *   status bookkeeping plus a `factura` inbox item carrying the error, the
 *   same way a failed stamp of a payment is handed to staff.
 */

import type { CancelCfdiForRefundUseCase } from './cancel-cfdi-for-refund.js';
import { CfdiError } from './errors.js';
import type { IssueCreditNoteForRefundUseCase } from './issue-credit-note-for-refund.js';
import type { IssuedCfdiRecord, IssuedCfdiRepository } from './issued-cfdi-repository.js';
import type { RecordRefundForCfdiUseCase, RefundReceived } from './record-refund-for-cfdi.js';

export interface SettleRefundForCfdiDeps {
  readonly repo: IssuedCfdiRepository;
  readonly cancel: CancelCfdiForRefundUseCase;
  readonly credit: IssueCreditNoteForRefundUseCase;
  readonly manual: RecordRefundForCfdiUseCase;
}

export type SettleRefundOutcome =
  | 'cancelled'
  | 'cancel_requested'
  | 'removed_from_global'
  | 'credited'
  | 'already_refunded'
  | 'manual'
  | 'unknown_payment';

export interface SettleRefundResult {
  readonly outcome: SettleRefundOutcome;
  readonly record: IssuedCfdiRecord | null;
}

export class SettleRefundForCfdiUseCase {
  readonly #deps: SettleRefundForCfdiDeps;

  constructor(deps: SettleRefundForCfdiDeps) {
    this.#deps = deps;
  }

  async execute(refund: RefundReceived): Promise<SettleRefundResult> {
    const record = await this.#deps.repo.findByPaymentId(refund.invoiceId);
    if (record === null) return { outcome: 'unknown_payment', record: null };
    try {
      const automated = await this.#automate(record, refund);
      if (automated !== null) return automated;
    } catch (error) {
      return this.#manual(refund, error);
    }
    return this.#manual(refund, null);
  }

  /** The PAC path, or `null` when this refund is not one it automates. */
  async #automate(
    record: IssuedCfdiRecord,
    refund: RefundReceived,
  ): Promise<SettleRefundResult | null> {
    const refunded = BigInt(refund.amountRefundedCentavos);
    const noNotes = (record.creditNotes ?? []).length === 0;
    const cancellable = record.status === 'stamped' || record.status === 'pending_global';
    if (refunded >= record.totalCentavos && noNotes && cancellable) {
      const done = await this.#deps.cancel.execute({
        externalPaymentId: record.externalPaymentId,
        refundedCentavos: record.totalCentavos,
      });
      if (done.outcome === 'rejected') {
        throw new CfdiError('CFDI_PROVIDER_REJECTED', 'El SAT rechazó la cancelación del CFDI');
      }
      return { outcome: done.outcome, record: done.record };
    }
    if (record.status === 'stamped' || record.status === 'in_global') {
      const done = await this.#deps.credit.execute({
        externalPaymentId: record.externalPaymentId,
        refundId: refund.refundId,
        refundedToDateCentavos: refunded,
      });
      const outcome = done.outcome === 'credited' ? 'credited' : 'already_refunded';
      return { outcome, record: done.record };
    }
    return null;
  }

  async #manual(refund: RefundReceived, error: unknown): Promise<SettleRefundResult> {
    const done = await this.#deps.manual.execute(refund, error);
    if (done.outcome === 'unknown_payment') return { outcome: 'unknown_payment', record: null };
    const outcome = done.outcome === 'marked' ? 'manual' : 'already_refunded';
    return { outcome, record: done.record };
  }
}
