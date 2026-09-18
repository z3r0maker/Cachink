/**
 * Builds provider-independent stamp requests from issued-CFDI records.
 * Pure functions: the SAT rules live here, not in the adapters.
 */

import { CfdiError } from './errors.js';
import type { IssuedCfdiRecord } from './issued-cfdi-repository.js';
import { splitIvaIncluded } from './iva.js';
import type { FiscalPeriod } from './period.js';
import {
  FORMA_PAGO,
  GLOBAL_CONCEPTO,
  PERIODICIDAD_MENSUAL,
  type FormaPago,
} from './sat-catalogs.js';
import type {
  CfdiDocumentRef,
  CfdiIssuerConfig,
  CfdiReceptor,
  StampGlobalInvoiceRequest,
  StampInvoiceRequest,
  StampPaymentComplementRequest,
  SubscriptionPayment,
} from './types.js';

/** Deterministic PAC idempotency keys — a retry must reuse them. */
export const cfdiKeys = {
  invoice: (paymentId: string) => `cfdi:${paymentId}:ingreso`,
  complement: (paymentId: string) => `cfdi:${paymentId}:pago`,
  global: (globalId: string) => `cfdi:global:${globalId}`,
} as const;

/**
 * Forma de pago the money arrived by. Prepaid cards are reported as débito
 * (28) and an unknown funding as crédito (04) — both to confirm with the contador.
 */
export function formaPagoOf(payment: SubscriptionPayment): FormaPago {
  if (payment.method === 'spei') return FORMA_PAGO.transferencia;
  const debit = payment.cardFunding === 'debit' || payment.cardFunding === 'prepaid';
  return debit ? FORMA_PAGO.tarjetaDebito : FORMA_PAGO.tarjetaCredito;
}

function requireReceptor(record: IssuedCfdiRecord): CfdiReceptor {
  if (!record.receptor) {
    throw new CfdiError('CFDI_INVALID_PAYMENT', `${record.externalPaymentId} no tiene receptor`);
  }
  return record.receptor;
}

/** Individual income CFDI: PUE with the real forma de pago, or PPD with 99. */
export function buildInvoiceRequest(
  record: IssuedCfdiRecord,
  issuer: CfdiIssuerConfig,
): StampInvoiceRequest {
  const ppd = record.route === 'individual_ppd';
  return {
    idempotencyKey: cfdiKeys.invoice(record.externalPaymentId),
    externalId: record.externalPaymentId,
    receptor: requireReceptor(record),
    conceptos: [
      {
        claveProdServ: issuer.productKey,
        claveUnidad: issuer.unitKey,
        descripcion: record.description,
        totalCentavos: record.totalCentavos,
      },
    ],
    formaPago: ppd ? FORMA_PAGO.porDefinir : record.formaPago,
    metodoPago: ppd ? 'PPD' : 'PUE',
  };
}

/** REP for a single payment that settles the whole PPD invoice. */
export function buildComplementRequest(
  record: IssuedCfdiRecord,
  invoice: CfdiDocumentRef,
): StampPaymentComplementRequest {
  const total = record.totalCentavos;
  return {
    idempotencyKey: cfdiKeys.complement(record.externalPaymentId),
    externalId: record.externalPaymentId,
    receptor: requireReceptor(record),
    fechaPago: record.paidAt,
    formaPago: record.formaPago,
    documentoRelacionado: {
      uuid: invoice.uuid,
      numParcialidad: 1,
      saldoAnteriorCentavos: total,
      importePagadoCentavos: total,
      baseIvaCentavos: splitIvaIncluded(total).subtotal,
    },
  };
}

/** The forma de pago with the largest amount (ties: first seen). */
export function predominantFormaPago(records: readonly IssuedCfdiRecord[]): FormaPago {
  const totals = new Map<FormaPago, bigint>();
  for (const r of records)
    totals.set(r.formaPago, (totals.get(r.formaPago) ?? 0n) + r.totalCentavos);
  let best: FormaPago = FORMA_PAGO.transferencia;
  let bestTotal = -1n;
  for (const [forma, total] of totals) {
    if (total > bestTotal) [best, bestTotal] = [forma, total];
  }
  return best;
}

/** Global CFDI: one concepto per operation (SAT guía de llenado del CFDI global). */
export function buildGlobalRequest(
  globalId: string,
  records: readonly IssuedCfdiRecord[],
  period: FiscalPeriod,
  issuer: CfdiIssuerConfig,
): StampGlobalInvoiceRequest {
  return {
    idempotencyKey: cfdiKeys.global(globalId),
    externalId: `global:${globalId}`,
    informacionGlobal: {
      periodicidad: PERIODICIDAD_MENSUAL,
      meses: period.meses,
      anio: period.anio,
    },
    lugarExpedicion: issuer.lugarExpedicion,
    formaPago: predominantFormaPago(records),
    conceptos: records.map((r) => ({
      claveProdServ: GLOBAL_CONCEPTO.claveProdServ,
      claveUnidad: GLOBAL_CONCEPTO.claveUnidad,
      descripcion: 'Venta',
      noIdentificacion: r.externalPaymentId,
      totalCentavos: r.totalCentavos,
    })),
  };
}
