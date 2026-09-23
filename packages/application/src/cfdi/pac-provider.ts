/**
 * PacProvider — the port every PAC (Proveedor Autorizado de Certificación)
 * adapter implements. Provider-independent: amounts in integer centavos, SAT
 * catalog codes, no vendor field names.
 *
 * Contract for adapters:
 * - `idempotencyKey` must make a repeated call return the same stamped CFDI
 *   rather than stamping twice.
 * - Throw `CfdiProviderRejectedError` when the PAC/SAT refuses the document,
 *   `CfdiProviderUnavailableError` for anything worth retrying, and
 *   `CfdiError('CFDI_PROVIDER_AUTH')` for bad credentials.
 */

import type {
  CancelCfdiRequest,
  CancellationStatus,
  StampGlobalInvoiceRequest,
  StampInvoiceRequest,
  StampCreditNoteRequest,
  StampPaymentComplementRequest,
  StampedCfdi,
} from './types.js';

export interface PacProvider {
  /** Nominative income CFDI (tipo I), PUE or PPD. */
  stampInvoice(request: StampInvoiceRequest): Promise<StampedCfdi>;
  /** Global income CFDI to "público en general" with InformacionGlobal. */
  stampGlobalInvoice(request: StampGlobalInvoiceRequest): Promise<StampedCfdi>;
  /** Payment CFDI (tipo P) with complemento de pagos 2.0. */
  stampPaymentComplement(request: StampPaymentComplementRequest): Promise<StampedCfdi>;
  /** CFDI de egreso (tipo E, PUE) related to an income CFDI with TipoRelacion 01. */
  stampCreditNote(request: StampCreditNoteRequest): Promise<StampedCfdi>;
  /** Request cancellation; the result may still be pending (receptor acceptance). */
  cancel(request: CancelCfdiRequest): Promise<CancellationStatus>;
  getPdf(providerId: string): Promise<Uint8Array>;
  getXml(providerId: string): Promise<Uint8Array>;
}
