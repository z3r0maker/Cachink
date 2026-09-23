/**
 * RecordPaymentForCfdiUseCase — what `invoice.paid` does for the CFDI
 * (N-33, ADR-070), behind `CFDI_MODE`.
 *
 * - Every payment is recorded in `IssuedCfdiRepository`, idempotently per
 *   Stripe invoice id, whatever the mode.
 * - `off`: recorded as `manual` and filed as a "pago sin CFDI" inbox item
 *   (idempotent by the invoice id); no PAC call.
 * - `test` / `live`: `IssueCfdiForPaymentUseCase` stamps it (or queues it for
 *   the monthly global CFDI); an item is filed only when that fails.
 * - A payment that cannot be invoiced at all (e.g. not MXN) is filed, not
 *   recorded.
 *
 * A failure to *file* is thrown, so the webhook answers 500 and Stripe
 * retries; the record claimed so far makes the retry a no-op up to that point.
 */

import type { UseCase } from '../_use-case.js';
import type { SupportInbox } from '../support-inbox/index.js';
import { paymentItem } from './cfdi-inbox-items.js';
import type { CfdiMode } from './cfdi-mode.js';
import { CfdiError } from './errors.js';
import {
  routePayment,
  type IssueCfdiForPaymentResult,
  type IssueCfdiForPaymentUseCase,
} from './issue-cfdi-for-payment.js';
import type { IssuedCfdiRecord, IssuedCfdiRepository } from './issued-cfdi-repository.js';
import { validatePayment } from './payment-validation.js';
import type { SubscriptionPayment, TenantFiscalData } from './types.js';

/** The tenant's fiscal data as the portal holds it; null when never given (P-10). */
export interface TenantFiscalSource {
  fiscalOf(tenantId: string): Promise<TenantFiscalData | null>;
}

/**
 * Told once a CFDI was stamped for a payment — the customer's `factura-issued`
 * email (B-14). Never for `accumulated_for_global`: a global CFDI is nobody's
 * factura. Not called again for a payment an earlier call already finished.
 */
export interface IssuedCfdiListener {
  onIssued(record: IssuedCfdiRecord): Promise<void>;
}

export interface RecordPaymentForCfdiDeps {
  readonly mode: CfdiMode;
  readonly repo: IssuedCfdiRepository;
  readonly inbox: SupportInbox;
  /** Required for `test` and `live`. */
  readonly issue: IssueCfdiForPaymentUseCase | null;
  readonly fiscal: TenantFiscalSource;
  readonly issued?: IssuedCfdiListener;
}

export interface RecordPaymentForCfdiResult {
  readonly outcome: 'manual' | 'stamped' | 'accumulated_for_global' | 'failed';
  readonly record: IssuedCfdiRecord | null;
}

export class RecordPaymentForCfdiUseCase implements UseCase<
  { readonly payment: SubscriptionPayment },
  RecordPaymentForCfdiResult
> {
  readonly #deps: RecordPaymentForCfdiDeps;

  constructor(deps: RecordPaymentForCfdiDeps) {
    if (deps.mode !== 'off' && deps.issue === null) {
      throw new CfdiError('CFDI_PROVIDER_CONFIG', `CFDI_MODE=${deps.mode} necesita un PAC`);
    }
    this.#deps = deps;
  }

  async execute(input: {
    readonly payment: SubscriptionPayment;
  }): Promise<RecordPaymentForCfdiResult> {
    let payment: SubscriptionPayment;
    try {
      payment = validatePayment(input.payment);
    } catch (error) {
      await this.#deps.inbox.file(paymentItem(input.payment, null, error));
      return { outcome: 'failed', record: null };
    }
    const fiscal = await this.#deps.fiscal.fiscalOf(payment.tenantId);
    return this.#deps.mode === 'off' ? this.#manual(payment, fiscal) : this.#issue(payment, fiscal);
  }

  async #manual(
    payment: SubscriptionPayment,
    fiscal: TenantFiscalData | null,
  ): Promise<RecordPaymentForCfdiResult> {
    const { repo, inbox } = this.#deps;
    const fresh: IssuedCfdiRecord = { ...routePayment(payment, fiscal), status: 'manual' };
    const record = (await repo.claim(fresh))
      ? fresh
      : ((await repo.findByPaymentId(payment.externalId)) ?? fresh);
    await inbox.file(paymentItem(payment, record, null));
    return { outcome: 'manual', record };
  }

  async #issue(
    payment: SubscriptionPayment,
    fiscal: TenantFiscalData | null,
  ): Promise<RecordPaymentForCfdiResult> {
    const { repo, inbox, issue, issued } = this.#deps;
    let result: IssueCfdiForPaymentResult;
    try {
      result = await (issue as IssueCfdiForPaymentUseCase).execute({
        payment,
        tenantFiscal: fiscal,
      });
    } catch (error) {
      const record = await repo.findByPaymentId(payment.externalId);
      await inbox.file(paymentItem(payment, record, error));
      return { outcome: 'failed', record };
    }
    if (result.outcome === 'stamped' && !result.alreadyProcessed && issued) {
      await issued.onIssued(result.record);
    }
    return { outcome: result.outcome, record: result.record };
  }
}
