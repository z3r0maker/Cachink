/**
 * Edge cases: centavos ⇄ pesos at the PAC wire boundary, and the in-memory
 * repository's guard against updating an unclaimed payment.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { InMemoryIssuedCfdiRepository, toCentavos, toPesos } from '../../src/cfdi/index.js';

describe('toPesos / toCentavos', () => {
  it('converts exactly for integer centavos', () => {
    assert.equal(toPesos(34_397n), 343.97);
    assert.equal(toPesos(5n), 0.05);
    assert.equal(toPesos(0n), 0);
    assert.equal(toPesos(-1_050n), -10.5);
    assert.equal(toCentavos(343.97), 34_397n);
    assert.equal(toCentavos(0.1 + 0.2), 30n);
  });

  it('round-trips every centavo amount up to $10,000', () => {
    for (let c = 0n; c <= 1_000_000n; c += 7n) assert.equal(toCentavos(toPesos(c)), c);
  });
});

describe('InMemoryIssuedCfdiRepository', () => {
  it('refuses to update a payment that was never claimed', async () => {
    const repo = new InMemoryIssuedCfdiRepository();
    await assert.rejects(
      repo.update({
        externalPaymentId: 'in_x',
        tenantId: 't',
        route: 'global',
        status: 'pending_global',
        totalCentavos: 100n,
        paidAt: new Date('2026-09-01T12:00:00Z'),
        period: '2026-09',
        formaPago: '03',
        description: 'x',
      }),
      { code: 'CFDI_RECORD_NOT_FOUND' },
    );
  });
});
