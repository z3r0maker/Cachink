/**
 * Port types ⇄ Facturapi v2 JSON (field names from Facturapi's OpenAPI,
 * `openapi_v2.en.yaml`, and SDK v5 types — see docs/spikes/pac-vendor.md).
 *
 * Money crosses the wire as a decimal peso amount because that is what the
 * API accepts; the conversion is exact for integer centavos (≤ 2 decimals)
 * and happens only here.
 */

import { z } from 'zod';
import { CfdiProviderUnavailableError } from '../../errors.js';
import { PUBLICO_EN_GENERAL } from '../../sat-catalogs.js';
import type {
  CancellationStatus,
  CfdiConcepto,
  CfdiReceptor,
  StampGlobalInvoiceRequest,
  StampInvoiceRequest,
  StampPaymentComplementRequest,
  StampedCfdi,
} from '../../types.js';

const IVA_16 = { type: 'IVA', rate: 0.16 } as const;

/** Centavos → pesos for the wire (e.g. 34_397n → 343.97). */
export function toPesos(centavos: bigint): number {
  const sign = centavos < 0n ? '-' : '';
  const abs = centavos < 0n ? -centavos : centavos;
  return Number(`${sign}${abs / 100n}.${String(abs % 100n).padStart(2, '0')}`);
}

/** Pesos from the wire → centavos, rounded to the nearest centavo. */
export function toCentavos(pesos: number): bigint {
  return BigInt(Math.round(pesos * 100));
}

function customer(receptor: CfdiReceptor): Record<string, unknown> {
  return {
    legal_name: receptor.nombre,
    tax_id: receptor.rfc,
    tax_system: receptor.regimenFiscal,
    ...(receptor.email ? { email: receptor.email } : {}),
    address: { zip: receptor.codigoPostal },
  };
}

function item(concepto: CfdiConcepto): Record<string, unknown> {
  return {
    quantity: 1,
    product: {
      description: concepto.descripcion,
      product_key: concepto.claveProdServ,
      unit_key: concepto.claveUnidad,
      price: toPesos(concepto.totalCentavos),
      tax_included: true,
      taxes: [IVA_16],
      ...(concepto.noIdentificacion ? { sku: concepto.noIdentificacion } : {}),
    },
  };
}

export function invoiceBody(req: StampInvoiceRequest): Record<string, unknown> {
  return {
    type: 'I',
    customer: customer(req.receptor),
    items: req.conceptos.map(item),
    use: req.receptor.usoCfdi,
    payment_form: req.formaPago,
    payment_method: req.metodoPago,
    external_id: req.externalId,
    idempotency_key: req.idempotencyKey,
  };
}

export function globalBody(req: StampGlobalInvoiceRequest): Record<string, unknown> {
  const { meses, anio } = req.informacionGlobal;
  return {
    type: 'I',
    customer: {
      legal_name: PUBLICO_EN_GENERAL.nombre,
      tax_id: PUBLICO_EN_GENERAL.rfc,
      tax_system: PUBLICO_EN_GENERAL.regimenFiscal,
      address: { zip: req.lugarExpedicion },
    },
    items: req.conceptos.map(item),
    use: PUBLICO_EN_GENERAL.usoCfdi,
    payment_form: req.formaPago,
    payment_method: 'PUE',
    global: { periodicity: 'month', months: meses, year: anio },
    external_id: req.externalId,
    idempotency_key: req.idempotencyKey,
  };
}

export function complementBody(req: StampPaymentComplementRequest): Record<string, unknown> {
  const doc = req.documentoRelacionado;
  const relatedDocument = {
    uuid: doc.uuid,
    amount: toPesos(doc.importePagadoCentavos),
    installment: doc.numParcialidad,
    last_balance: toPesos(doc.saldoAnteriorCentavos),
    taxes: [{ base: toPesos(doc.baseIvaCentavos), ...IVA_16 }],
  };
  return {
    type: 'P',
    customer: customer(req.receptor),
    use: 'CP01',
    complements: [
      {
        type: 'pago',
        data: [
          {
            payment_form: req.formaPago,
            date: req.fechaPago.toISOString(),
            related_documents: [relatedDocument],
          },
        ],
      },
    ],
    external_id: req.externalId,
    idempotency_key: req.idempotencyKey,
  };
}

const invoiceSchema = z.object({
  id: z.string().min(1),
  uuid: z.string().nullish(),
  status: z.string(),
  total: z.number(),
  date: z.string().optional(),
  cancellation_status: z.string().nullish(),
});

function parseInvoice(json: unknown): z.infer<typeof invoiceSchema> {
  const parsed = invoiceSchema.safeParse(json);
  if (!parsed.success) throw new CfdiProviderUnavailableError('Respuesta de Facturapi inesperada');
  return parsed.data;
}

/** A stamped (status `valid`) invoice → StampedCfdi. Anything else is retryable. */
export function toStamped(json: unknown): StampedCfdi {
  const invoice = parseInvoice(json);
  if (invoice.status !== 'valid' || !invoice.uuid) {
    throw new CfdiProviderUnavailableError(
      `CFDI ${invoice.id} aún no timbrado (${invoice.status})`,
    );
  }
  return {
    providerId: invoice.id,
    uuid: invoice.uuid,
    totalCentavos: toCentavos(invoice.total),
    stampedAt: invoice.date ? new Date(invoice.date) : new Date(),
  };
}

/** Facturapi `status` + `cancellation_status` → port CancellationStatus. */
export function toCancellationStatus(json: unknown): CancellationStatus {
  const invoice = parseInvoice(json);
  if (invoice.status === 'canceled') return 'cancelled';
  switch (invoice.cancellation_status) {
    case 'pending':
      return 'pending_acceptance';
    case 'rejected':
    case 'expired':
      return 'rejected';
    default:
      return 'verifying';
  }
}
