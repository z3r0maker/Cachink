/** Records in each CFDI state, for the refund tests (N-33). */

import type { IssuedCfdiRecord } from '../../../src/cfdi/index.js';
import { makePayment } from './fixtures.js';

export const INVOICE = { providerId: 'fp_1', uuid: '6f9619ff-8b86-d011-b42d-00c04fc964ff' };
export const GLOBAL_UUID = '11111111-2222-4333-8444-555555555555';

/** A 199.00 payment (19 900 centavos) in the given state. */
export function refundRecord(
  status: IssuedCfdiRecord['status'],
  extra: Partial<IssuedCfdiRecord> = {},
): IssuedCfdiRecord {
  const payment = makePayment({ externalId: 'in_refund_1' });
  const individual = status === 'stamped';
  return {
    externalPaymentId: payment.externalId,
    tenantId: payment.tenantId,
    route: individual ? 'individual_pue' : 'global',
    status,
    totalCentavos: payment.totalCentavos,
    paidAt: payment.paidAt,
    period: '2026-09',
    formaPago: '04',
    description: payment.description,
    ...(individual
      ? {
          invoice: INVOICE,
          receptor: {
            rfc: 'EKU9003173C9',
            nombre: 'ESCUELA KEMPER URGATE',
            regimenFiscal: '601',
            usoCfdi: 'G03',
            codigoPostal: '26015',
          },
        }
      : {}),
    ...(status === 'in_global' ? { globalId: '2026-09#1' } : {}),
    ...extra,
  };
}

export const globalStamped = {
  id: '2026-09#1',
  period: '2026-09',
  sequence: 1,
  paymentIds: ['in_refund_1'],
  status: 'stamped' as const,
  invoice: { providerId: 'fp_g', uuid: GLOBAL_UUID },
};
