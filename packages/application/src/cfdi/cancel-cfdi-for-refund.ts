/**
 * CancelCfdiForRefundUseCase — the reaction to a full refund (Stripe
 * `charge.refunded`, wired in B-10).
 *
 * - Payment still waiting for the global CFDI → just drop it (no PAC call).
 * - Individual CFDI → cancel with motivo 03 (the operation did not happen) or
 *   02 (issued with errors). A REP is cancelled before its PPD invoice, and a
 *   REP always needs the receptor's acceptance, so this can end
 *   `cancel_requested`; calling again resumes where it stopped.
 * - Partial refunds and refunds of payments already in a stamped global CFDI
 *   need a CFDI de egreso (nota de crédito): typed error here, handled by
 *   `IssueCreditNoteForRefundUseCase` (the router is `SettleRefundForCfdiUseCase`).
 */

import type { Money } from '@xangarro/domain';
import type { UseCase } from '../_use-case.js';
import { CfdiError } from './errors.js';
import type {
  CfdiCancellationState,
  IssuedCfdiRecord,
  IssuedCfdiRepository,
} from './issued-cfdi-repository.js';
import type { PacProvider } from './pac-provider.js';
import type { MotivoCancelacion } from './sat-catalogs.js';
import type { CancellationStatus, CfdiDocumentRef } from './types.js';

export interface CancelCfdiForRefundInput {
  readonly externalPaymentId: string;
  /** Amount refunded, in centavos. Must equal the payment total. */
  readonly refundedCentavos: Money;
  /** 03 (default) or 02. 01 needs a substitute CFDI; 04 is for global CFDIs. */
  readonly motivo?: MotivoCancelacion;
}

export interface CancelCfdiForRefundResult {
  readonly outcome: 'cancelled' | 'cancel_requested' | 'rejected' | 'removed_from_global';
  readonly record: IssuedCfdiRecord;
  readonly alreadyProcessed: boolean;
}

const DONE = new Set(['cancelled', 'excluded_from_global']);

export class CancelCfdiForRefundUseCase implements UseCase<
  CancelCfdiForRefundInput,
  CancelCfdiForRefundResult
> {
  readonly #repo: IssuedCfdiRepository;
  readonly #pac: PacProvider;

  constructor(repo: IssuedCfdiRepository, pac: PacProvider) {
    this.#repo = repo;
    this.#pac = pac;
  }

  async execute(input: CancelCfdiForRefundInput): Promise<CancelCfdiForRefundResult> {
    const motivo = input.motivo ?? '03';
    if (motivo !== '02' && motivo !== '03') {
      throw invalid(`Motivo ${motivo} no aplica a un reembolso (usa 02 o 03)`);
    }
    const record = await this.#repo.findByPaymentId(input.externalPaymentId);
    if (!record) {
      throw new CfdiError('CFDI_RECORD_NOT_FOUND', `Sin CFDI para ${input.externalPaymentId}`);
    }
    if (DONE.has(record.status)) {
      const outcome = record.status === 'cancelled' ? 'cancelled' : 'removed_from_global';
      return { outcome, record, alreadyProcessed: true };
    }
    checkRefundAmount(record, input.refundedCentavos);
    if (record.status === 'pending_global') return this.#dropFromGlobal(record);
    assertCancellable(record);
    return this.#cancelDocuments(record, motivo);
  }

  async #dropFromGlobal(record: IssuedCfdiRecord): Promise<CancelCfdiForRefundResult> {
    const globals = await this.#repo.listGlobals(record.period);
    const inFlight = globals.some(
      (g) => g.status === 'stamping' && g.paymentIds.includes(record.externalPaymentId),
    );
    if (inFlight) {
      throw new CfdiError('CFDI_GLOBAL_IN_PROGRESS', 'El CFDI global se está timbrando', true);
    }
    const updated: IssuedCfdiRecord = { ...record, status: 'excluded_from_global' };
    await this.#repo.update(updated);
    return { outcome: 'removed_from_global', record: updated, alreadyProcessed: false };
  }

  /** REP first, then the invoice; stop at the first one not yet cancelled. */
  async #cancelDocuments(
    record: IssuedCfdiRecord,
    motivo: MotivoCancelacion,
  ): Promise<CancelCfdiForRefundResult> {
    let state: CfdiCancellationState = record.cancellation ?? { motivo };
    const steps: ['complement' | 'invoice', CfdiDocumentRef | undefined][] = [
      ['complement', record.complement],
      ['invoice', record.invoice],
    ];
    let last: CancellationStatus = 'cancelled';
    for (const [key, doc] of steps) {
      if (!doc || state[key] === 'cancelled') continue;
      last = await this.#pac.cancel({ ...doc, motivo: state.motivo });
      state = { ...state, [key]: last };
      if (last !== 'cancelled') break;
    }
    const outcome = outcomeOf(last);
    // A rejected cancellation leaves the CFDI valid: the record stays stamped.
    const status = outcome === 'rejected' ? 'stamped' : outcome;
    const updated: IssuedCfdiRecord = { ...record, status, cancellation: state };
    await this.#repo.update(updated);
    return { outcome, record: updated, alreadyProcessed: false };
  }
}

function outcomeOf(status: CancellationStatus): 'cancelled' | 'rejected' | 'cancel_requested' {
  if (status === 'cancelled' || status === 'rejected') return status;
  return 'cancel_requested';
}

function invalid(message: string): CfdiError {
  return new CfdiError('CFDI_INVALID_CANCELLATION', message);
}

function checkRefundAmount(record: IssuedCfdiRecord, refunded: Money): void {
  if (typeof refunded !== 'bigint' || refunded <= 0n || refunded > record.totalCentavos) {
    throw invalid(`Reembolso inválido: ${String(refunded)} de ${record.totalCentavos} centavos`);
  }
  if (refunded < record.totalCentavos) {
    throw new CfdiError(
      'CFDI_PARTIAL_REFUND_NEEDS_CREDIT_NOTE',
      'Un reembolso parcial requiere un CFDI de egreso (nota de crédito)',
    );
  }
}

function assertCancellable(record: IssuedCfdiRecord): void {
  if (record.status === 'in_global') {
    throw new CfdiError(
      'CFDI_GLOBAL_REFUND_NEEDS_CREDIT_NOTE',
      'El pago ya está en un CFDI global timbrado; requiere un CFDI de egreso',
    );
  }
  if (record.status === 'claimed') {
    throw new CfdiError('CFDI_NOT_STAMPED_YET', 'El CFDI de este pago aún no se timbra', true);
  }
}
