import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { validateTenantFiscal } from '@xangarro/application/cfdi';
import type { TenantFiscalRow } from '@xangarro/data-pg';

import { tenantFiscalSource } from '../../src/server/billing/fiscal-source';

/** The CFDI's view of a business (N-33); the SQL side is in data-pg. */
const COMPLETE: TenantFiscalRow = {
  rfc: 'XOJI740919U48',
  razonSocial: 'INTERNACIONAL OJEDA',
  regimenFiscal: '626',
  usoCfdi: 'G03',
  codigoPostal: '06600',
  email: 'duena@test.mx',
};

describe('tenantFiscalSource', () => {
  it('passes the business id through and returns its fiscal data as stored', async () => {
    const asked: string[] = [];
    const source = tenantFiscalSource((id) => {
      asked.push(id);
      return Promise.resolve(COMPLETE);
    });
    assert.deepEqual(await source.fiscalOf('BIZ1'), COMPLETE);
    assert.deepEqual(asked, ['BIZ1']);
  });

  it('reads as null for an unknown business, so the payment joins the global CFDI', async () => {
    const source = tenantFiscalSource(() => Promise.resolve(null));
    assert.equal(await source.fiscalOf('NOPE'), null);
  });

  it('hands the SAT régimen code to the receptor', async () => {
    const fiscal = await tenantFiscalSource(() => Promise.resolve(COMPLETE)).fiscalOf('BIZ1');
    const v = validateTenantFiscal(fiscal ?? {});
    assert.equal(v.ok, true);
    assert.equal(v.ok && v.receptor.regimenFiscal, '626');
  });

  it('propagates a database failure, so the webhook answers 500 and Stripe retries', async () => {
    const source = tenantFiscalSource(() => Promise.reject(new Error('connection refused')));
    await assert.rejects(source.fiscalOf('BIZ1'), /connection refused/);
  });
});
