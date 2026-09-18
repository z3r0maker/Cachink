import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { GlobalCfdiRecord, IssuedCfdiRecord } from '@xangarro/application/cfdi';

import {
  fromRow,
  globalFromRow,
  globalToRow,
  toRow,
} from '../../src/server/billing/cfdi-repository';

/** The Postgres adapter's row ↔ record mapping (N-33); the SQL side is in data-pg. */
const MANUAL: IssuedCfdiRecord = {
  externalPaymentId: 'in_1',
  tenantId: '01HZ8XQN9GZJXV8AKQ5X0C7AAA',
  route: 'global',
  status: 'manual',
  totalCentavos: 34_800n,
  paidAt: new Date('2026-09-17T12:00:00.000Z'),
  period: '2026-09',
  formaPago: '04',
  description: 'Suscripción Xangarro',
  globalReasons: ['rfc_missing'],
};

const STAMPED: IssuedCfdiRecord = {
  ...MANUAL,
  route: 'individual_ppd',
  status: 'stamped',
  receptor: {
    rfc: 'EKU9003173C9',
    nombre: 'ESCUELA KEMPER URGATE',
    regimenFiscal: '601',
    usoCfdi: 'G03',
    codigoPostal: '26015',
  },
  invoice: { providerId: 'pac_1', uuid: 'U1' },
  complement: { providerId: 'pac_2', uuid: 'U2' },
  cancellation: { motivo: '02', invoice: 'pending_acceptance' },
};

describe('cfdi_payments mapping', () => {
  it('round-trips a manual record without inventing documents', () => {
    const back = fromRow(toRow(MANUAL));
    assert.deepEqual(back, MANUAL);
    assert.equal(toRow(MANUAL).invoiceUuid, null);
  });

  it('round-trips a stamped record with both documents and its cancellation', () => {
    assert.deepEqual(fromRow(toRow(STAMPED)), STAMPED);
  });

  it('round-trips a global CFDI draft and its stamped form', () => {
    const draft: GlobalCfdiRecord = {
      id: '2026-09#1',
      period: '2026-09',
      sequence: 1,
      paymentIds: ['in_1', 'in_2'],
      status: 'stamping',
    };
    assert.deepEqual(globalFromRow(globalToRow(draft)), draft);
    const stamped = {
      ...draft,
      status: 'stamped' as const,
      invoice: { providerId: 'g', uuid: 'G' },
    };
    assert.deepEqual(globalFromRow(globalToRow(stamped)), stamped);
  });
});
