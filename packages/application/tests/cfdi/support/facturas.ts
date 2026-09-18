import type { FacturaRegistrada } from '../../../src/cfdi/index.js';

/** A PAC-stamped individual payment; override to get the other states. */
export function registrada(overrides: Partial<FacturaRegistrada> = {}): FacturaRegistrada {
  return {
    paymentId: 'in_1',
    stripeInvoiceId: 'in_1',
    paidAt: '2026-09-01T12:00:00.000Z',
    totalCentavos: 34_800n,
    ruta: 'individual',
    estado: 'timbrada',
    cfdiUuid: '6F9619FF-8B86-D011-B42D-00C04FC964FF',
    pdfDisponible: true,
    xmlDisponible: true,
    emitidaManual: false,
    ...overrides,
  };
}
