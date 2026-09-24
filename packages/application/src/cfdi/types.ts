/**
 * Provider-independent CFDI types. All amounts are **integer centavos**
 * (`Money` = bigint) and IVA-included unless the name says otherwise.
 */

import type { Money } from '@xangarro/domain';
import type { FormaPago, MetodoPago, MotivoCancelacion } from './sat-catalogs.js';

/** A subscription payment as the billing provider (Stripe) reports it. */
export interface SubscriptionPayment {
  /** Billing provider's id (Stripe invoice id). The idempotency key. */
  readonly externalId: string;
  readonly tenantId: string;
  /** Amount paid, IVA included, in centavos. */
  readonly totalCentavos: Money;
  readonly currency: string;
  readonly paidAt: Date;
  readonly method: 'card' | 'spei';
  /** Card funding as the processor reports it; decides forma de pago 04 vs 28. */
  readonly cardFunding?: 'credit' | 'debit' | 'prepaid' | 'unknown';
  /** Concepto text, e.g. "Suscripción Xangarro — plan xangarro, septiembre 2026". */
  readonly description: string;
}

/** The fiscal fields a tenant filled in on the portal (README Q15). Any may be missing. */
export interface TenantFiscalData {
  readonly rfc?: string | null;
  readonly razonSocial?: string | null;
  readonly regimenFiscal?: string | null;
  readonly usoCfdi?: string | null;
  readonly codigoPostal?: string | null;
  readonly email?: string | null;
}

/** A validated, normalised nominative receptor. */
export interface CfdiReceptor {
  readonly rfc: string;
  readonly nombre: string;
  readonly regimenFiscal: string;
  readonly usoCfdi: string;
  readonly codigoPostal: string;
  readonly email?: string;
}

/** Issuer-side settings (the CSD itself lives in the PAC's vault). */
export interface CfdiIssuerConfig {
  /** Issuer's CP — LugarExpedicion, and the receptor CP of a global CFDI. */
  readonly lugarExpedicion: string;
  /** ClaveProdServ for the subscription (proposed 81112106). */
  readonly productKey: string;
  /** ClaveUnidad for the subscription (proposed E48, unidad de servicio). */
  readonly unitKey: string;
}

export interface CfdiConcepto {
  readonly claveProdServ: string;
  readonly claveUnidad: string;
  readonly descripcion: string;
  /** NoIdentificacion — the payment id inside a global CFDI. */
  readonly noIdentificacion?: string;
  /** Importe with IVA 16% included, in centavos. Cantidad is always 1. */
  readonly totalCentavos: Money;
}

export interface StampInvoiceRequest {
  readonly idempotencyKey: string;
  readonly externalId: string;
  readonly receptor: CfdiReceptor;
  readonly conceptos: readonly CfdiConcepto[];
  readonly formaPago: FormaPago;
  readonly metodoPago: MetodoPago;
}

export interface StampGlobalInvoiceRequest {
  readonly idempotencyKey: string;
  readonly externalId: string;
  readonly informacionGlobal: {
    readonly periodicidad: '04';
    readonly meses: string;
    readonly anio: number;
  };
  /** Receptor CP of a global CFDI = the issuer's LugarExpedicion. */
  readonly lugarExpedicion: string;
  readonly formaPago: FormaPago;
  readonly conceptos: readonly CfdiConcepto[];
}

/** A REP (complemento de pagos 2.0) for one full payment of one PPD invoice. */
export interface StampPaymentComplementRequest {
  readonly idempotencyKey: string;
  readonly externalId: string;
  readonly receptor: CfdiReceptor;
  readonly fechaPago: Date;
  readonly formaPago: FormaPago;
  readonly documentoRelacionado: {
    readonly uuid: string;
    readonly numParcialidad: number;
    readonly saldoAnteriorCentavos: Money;
    readonly importePagadoCentavos: Money;
    /** Base of IVA for the paid amount, in centavos. */
    readonly baseIvaCentavos: Money;
  };
}

/**
 * A CFDI de egreso (nota de crédito, tipo E) for a refund, related to the
 * income CFDI it reduces with TipoRelacion 01. One concepto, IVA included.
 */
export interface StampCreditNoteRequest {
  readonly idempotencyKey: string;
  readonly externalId: string;
  /** The nominative receptor, or «público en general» for a global CFDI. */
  readonly receptor: CfdiReceptor;
  /** UUID of the income CFDI the credit note reduces. */
  readonly relatedUuid: string;
  /** How the money went back: the payment's own forma de pago. */
  readonly formaPago: FormaPago;
  readonly concepto: CfdiConcepto;
}

export interface CfdiDocumentRef {
  /** PAC's own id (used for cancel / download). */
  readonly providerId: string;
  /** SAT folio fiscal. */
  readonly uuid: string;
}

export interface StampedCfdi extends CfdiDocumentRef {
  readonly totalCentavos: Money;
  readonly stampedAt: Date;
}

export interface CancelCfdiRequest extends CfdiDocumentRef {
  readonly motivo: MotivoCancelacion;
  /** Required for motivo 01 only. */
  readonly folioSustitucion?: string;
}

/**
 * `pending_acceptance`: the receptor must accept (total > $1,000 or a REP).
 * `verifying`: the SAT is still processing. Both settle later.
 */
export type CancellationStatus = 'cancelled' | 'pending_acceptance' | 'verifying' | 'rejected';
