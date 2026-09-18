/**
 * Builders for CFDI tests. RFCs are the SAT's published test RFCs.
 */

import type {
  CfdiIssuerConfig,
  SubscriptionPayment,
  TenantFiscalData,
} from '../../../src/cfdi/index.js';

export const ISSUER: CfdiIssuerConfig = {
  lugarExpedicion: '06600',
  productKey: '81112106',
  unitKey: 'E48',
};

export function makeTenantFiscal(overrides: Partial<TenantFiscalData> = {}): TenantFiscalData {
  return {
    rfc: 'EKU9003173C9',
    razonSocial: 'ESCUELA KEMPER URGATE',
    regimenFiscal: '601',
    usoCfdi: 'G03',
    codigoPostal: '26015',
    email: 'facturas@kemper.mx',
    ...overrides,
  };
}

export function makePayment(overrides: Partial<SubscriptionPayment> = {}): SubscriptionPayment {
  return {
    externalId: 'in_1QxYz',
    tenantId: 'tenant-1',
    totalCentavos: 19_900n,
    currency: 'MXN',
    paidAt: new Date('2026-09-15T18:00:00Z'),
    method: 'card',
    cardFunding: 'credit',
    description: 'Suscripción Xangarro — plan xangarro, septiembre 2026',
    ...overrides,
  };
}
