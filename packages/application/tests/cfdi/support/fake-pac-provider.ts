/**
 * FakePacProvider — an in-process PAC that honours idempotency keys the way
 * the port requires, records every call, and can be told to fail.
 */

import type {
  CancelCfdiRequest,
  CancellationStatus,
  PacProvider,
  StampCreditNoteRequest,
  StampGlobalInvoiceRequest,
  StampInvoiceRequest,
  StampPaymentComplementRequest,
  StampedCfdi,
} from '../../../src/cfdi/index.js';

type Method =
  | 'stampInvoice'
  | 'stampGlobalInvoice'
  | 'stampPaymentComplement'
  | 'stampCreditNote'
  | 'cancel';

export class FakePacProvider implements PacProvider {
  readonly invoices: StampInvoiceRequest[] = [];
  readonly globals: StampGlobalInvoiceRequest[] = [];
  readonly complements: StampPaymentComplementRequest[] = [];
  readonly creditNotes: StampCreditNoteRequest[] = [];
  readonly cancellations: CancelCfdiRequest[] = [];
  /** Cancellation result per providerId; default `cancelled`. */
  readonly cancelStatus = new Map<string, CancellationStatus>();
  readonly #byKey = new Map<string, StampedCfdi>();
  readonly #failures = new Map<Method, Error>();
  #seq = 0;

  failNext(method: Method, error: Error): void {
    this.#failures.set(method, error);
  }

  /** Distinct CFDIs actually stamped (idempotent retries don't count). */
  get stampedCount(): number {
    return this.#byKey.size;
  }

  #maybeFail(method: Method): void {
    const error = this.#failures.get(method);
    if (!error) return;
    this.#failures.delete(method);
    throw error;
  }

  #stamp(key: string, total: bigint): StampedCfdi {
    const existing = this.#byKey.get(key);
    if (existing) return existing;
    this.#seq += 1;
    const n = String(this.#seq).padStart(12, '0');
    const stamped: StampedCfdi = {
      providerId: `pac_${this.#seq}`,
      uuid: `00000000-0000-4000-8000-${n}`,
      totalCentavos: total,
      stampedAt: new Date('2026-09-15T18:00:05Z'),
    };
    this.#byKey.set(key, stamped);
    return stamped;
  }

  async stampInvoice(request: StampInvoiceRequest): Promise<StampedCfdi> {
    this.invoices.push(request);
    this.#maybeFail('stampInvoice');
    const total = request.conceptos.reduce((sum, c) => sum + c.totalCentavos, 0n);
    return this.#stamp(request.idempotencyKey, total);
  }

  async stampGlobalInvoice(request: StampGlobalInvoiceRequest): Promise<StampedCfdi> {
    this.globals.push(request);
    this.#maybeFail('stampGlobalInvoice');
    const total = request.conceptos.reduce((sum, c) => sum + c.totalCentavos, 0n);
    return this.#stamp(request.idempotencyKey, total);
  }

  async stampPaymentComplement(request: StampPaymentComplementRequest): Promise<StampedCfdi> {
    this.complements.push(request);
    this.#maybeFail('stampPaymentComplement');
    return this.#stamp(request.idempotencyKey, 0n);
  }

  async stampCreditNote(request: StampCreditNoteRequest): Promise<StampedCfdi> {
    this.creditNotes.push(request);
    this.#maybeFail('stampCreditNote');
    return this.#stamp(request.idempotencyKey, request.concepto.totalCentavos);
  }

  async cancel(request: CancelCfdiRequest): Promise<CancellationStatus> {
    this.cancellations.push(request);
    this.#maybeFail('cancel');
    return this.cancelStatus.get(request.providerId) ?? 'cancelled';
  }

  async getPdf(providerId: string): Promise<Uint8Array> {
    return new TextEncoder().encode(`%PDF ${providerId}`);
  }

  async getXml(providerId: string): Promise<Uint8Array> {
    return new TextEncoder().encode(`<cfdi id="${providerId}"/>`);
  }
}
