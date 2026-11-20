import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  aCargo,
  CargoMxnFaltanteError,
  MontoInvalidoError,
  tipoCambioDelCargo,
  tipoCambioRaro,
} from '../../src/corp/ledger/index.js';

/** E-42: a USD expense paid from a peso account is booked at what the bank charged. */
describe('tipoCambioDelCargo', () => {
  it('is the pesos charged over the dollars, to four decimals', () => {
    assert.equal(tipoCambioDelCargo(20_00n, 372_10n), '18.6050');
    assert.equal(tipoCambioDelCargo(100_00n, 1_861_40n), '18.6140');
    assert.equal(tipoCambioDelCargo(15_00n, 280_35n), '18.6900');
  });

  it('rounds half up', () => {
    assert.equal(tipoCambioDelCargo(3_00n, 55_00n), '18.3333');
    assert.equal(tipoCambioDelCargo(7_00n, 1_29n), '0.1843');
  });

  it('refuses a missing charge, and a zero dollar amount', () => {
    assert.throws(() => tipoCambioDelCargo(20_00n, 0n), CargoMxnFaltanteError);
    assert.throws(() => tipoCambioDelCargo(0n, 372_10n), MontoInvalidoError);
  });
});

describe('tipoCambioRaro', () => {
  it('flags a rate outside 15 to 25 pesos per dollar, a likely typo', () => {
    assert.equal(tipoCambioRaro('18.6050'), false);
    assert.equal(tipoCambioRaro('15.0000'), false);
    assert.equal(tipoCambioRaro('25.0000'), false);
    assert.equal(tipoCambioRaro('186.0500'), true);
    assert.equal(tipoCambioRaro('1.8605'), true);
  });
});

describe('aCargo', () => {
  const factura = { subtotal: 1_810_00n, iva: 0n, retencionIsr: 0n, retencionIva: 0n };

  it('scales a USD invoice booked at its own rate to the bank charge', () => {
    assert.deepEqual(aCargo(factura, 1_861_40n), { ...factura, subtotal: 1_861_40n });
  });

  it('keeps the total paid equal to the charge, with IVA and retentions scaled', () => {
    const c = aCargo(
      { subtotal: 1_000_00n, iva: 160_00n, retencionIsr: 100_00n, retencionIva: 106_67n },
      980_00n,
    );
    assert.equal(c.subtotal + c.iva - c.retencionIsr - c.retencionIva, 980_00n);
    assert.equal(c.iva, 164_48n);
    assert.equal(c.retencionIsr, 102_80n);
  });

  it('refuses a missing charge', () => {
    assert.throws(() => aCargo(factura, 0n), CargoMxnFaltanteError);
  });
});
