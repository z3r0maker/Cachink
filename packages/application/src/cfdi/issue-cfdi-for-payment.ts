/**
 * IssueCfdiForPaymentUseCase — the reaction to a paid subscription invoice
 * (Stripe `invoice.paid`, wired in B-10).
 *
 *   complete fiscal data + card → individual CFDI, PUE, forma 04/28
 *   complete fiscal data + SPEI → individual CFDI, PPD (forma 99) + REP (forma 03)
 *   anything else               → accumulate into the monthly global CFDI
 *
 * Idempotent per external payment id: the record is claimed before stamping,
 * every PAC call carries a deterministic idempotency key, and a retry resumes
 * whatever step is missing. A claimed record with nothing stamped yet is
 * re-routed with the fiscal data given on the retry, so a tenant who fixes a
 * rejected RFC gets an individual CFDI (and one who doesn't falls to global).
 */

import type { UseCase } from '../_use-case.js';
import { validateTenantFiscal } from './fiscal-validation.js';
import type { IssuedCfdiRecord, IssuedCfdiRepository } from './issued-cfdi-repository.js';
import type { PacProvider } from './pac-provider.js';
import { buildComplementRequest, buildInvoiceRequest, formaPagoOf } from './payload-builder.js';
import { validatePayment } from './payment-validation.js';
import { fiscalPeriodOf } from './period.js';
import type {
  CfdiDocumentRef,
  CfdiIssuerConfig,
  SubscriptionPayment,
  TenantFiscalData,
} from './types.js';

export interface IssueCfdiForPaymentInput {
  readonly payment: SubscriptionPayment;
  /** Null when the tenant never filled in fiscal data. */
  readonly tenantFiscal: TenantFiscalData | null;
}

export interface IssueCfdiForPaymentResult {
  readonly outcome: 'stamped' | 'accumulated_for_global';
  readonly record: IssuedCfdiRecord;
  /** True when an earlier call had already finished this payment. */
  readonly alreadyProcessed: boolean;
}

/** Route + receptor for a payment given the tenant's current fiscal data. */
export function routePayment(
  payment: SubscriptionPayment,
  fiscal: TenantFiscalData | null,
): IssuedCfdiRecord {
  const base = {
    externalPaymentId: payment.externalId,
    tenantId: payment.tenantId,
    totalCentavos: payment.totalCentavos,
    paidAt: payment.paidAt,
    period: fiscalPeriodOf(payment.paidAt),
    formaPago: formaPagoOf(payment),
    description: payment.description,
  };
  const validation = validateTenantFiscal(fiscal ?? {});
  if (!validation.ok) {
    return {
      ...base,
      route: 'global',
      status: 'pending_global',
      globalReasons: validation.reasons,
    };
  }
  const route = payment.method === 'spei' ? 'individual_ppd' : 'individual_pue';
  return { ...base, route, status: 'claimed', receptor: validation.receptor };
}

export class IssueCfdiForPaymentUseCase implements UseCase<
  IssueCfdiForPaymentInput,
  IssueCfdiForPaymentResult
> {
  readonly #repo: IssuedCfdiRepository;
  readonly #pac: PacProvider;
  readonly #issuer: CfdiIssuerConfig;

  constructor(repo: IssuedCfdiRepository, pac: PacProvider, issuer: CfdiIssuerConfig) {
    this.#repo = repo;
    this.#pac = pac;
    this.#issuer = issuer;
  }

  async execute(input: IssueCfdiForPaymentInput): Promise<IssueCfdiForPaymentResult> {
    const payment = validatePayment(input.payment);
    const fresh = routePayment(payment, input.tenantFiscal);
    let record = await this.#repo.findByPaymentId(payment.externalId);
    if (!record) {
      if (await this.#repo.claim(fresh)) return this.#finish(fresh, false);
      record = (await this.#repo.findByPaymentId(payment.externalId)) ?? fresh;
    }
    if (record.status !== 'claimed') return this.#finish(record, true);
    if (!record.invoice) {
      record = fresh;
      await this.#repo.update(record);
    }
    return this.#finish(record, false);
  }

  async #finish(
    record: IssuedCfdiRecord,
    alreadyProcessed: boolean,
  ): Promise<IssueCfdiForPaymentResult> {
    const done = record.status === 'claimed' ? await this.#stamp(record) : record;
    const outcome = done.route === 'global' ? 'accumulated_for_global' : 'stamped';
    return { outcome, record: done, alreadyProcessed };
  }

  async #stamp(claimed: IssuedCfdiRecord): Promise<IssuedCfdiRecord> {
    let record = claimed;
    if (!record.invoice) {
      const invoice = await this.#pac.stampInvoice(buildInvoiceRequest(record, this.#issuer));
      record = { ...record, invoice: refOf(invoice) };
      if (record.route === 'individual_pue') record = { ...record, status: 'stamped' };
      await this.#repo.update(record);
    }
    if (record.route === 'individual_ppd' && record.invoice && !record.complement) {
      const rep = await this.#pac.stampPaymentComplement(
        buildComplementRequest(record, record.invoice),
      );
      record = { ...record, complement: refOf(rep), status: 'stamped' };
      await this.#repo.update(record);
    }
    return record;
  }
}

function refOf(doc: CfdiDocumentRef): CfdiDocumentRef {
  return { providerId: doc.providerId, uuid: doc.uuid };
}
