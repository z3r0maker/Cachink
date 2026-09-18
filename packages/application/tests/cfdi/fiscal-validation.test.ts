/**
 * Receptor fiscal-data validation — decides individual CFDI vs global.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { isValidRfc, validateTenantFiscal } from '../../src/cfdi/index.js';
import { makeTenantFiscal } from './support/fixtures.js';

describe('isValidRfc', () => {
  it('accepts persona moral (12) and persona física (13) RFCs', () => {
    assert.equal(isValidRfc('EKU9003173C9'), true);
    assert.equal(isValidRfc('XOJI740919U48'), true);
    // Ñ and & are RFC letters. Since P-08 the check digit is verified too, so
    // the sample carries its real one (A), not a made-up homoclave.
    assert.equal(isValidRfc('ÑAÑ010101ABA'), true);
    assert.equal(isValidRfc('A&C010101AB1'), true);
  });

  it('rejects malformed RFCs', () => {
    for (const rfc of [
      '',
      'EKU900317',
      'EKU9013173C9',
      'EKU9003323C9',
      'eku9003173c9',
      'EKU9003173CZ',
    ]) {
      assert.equal(isValidRfc(rfc), false, rfc);
    }
  });
});

describe('validateTenantFiscal', () => {
  it('returns a normalised receptor for complete, valid data', () => {
    const result = validateTenantFiscal(
      makeTenantFiscal({ rfc: ' eku9003173c9 ', razonSocial: '  ESCUELA KEMPER URGATE  ' }),
    );
    assert.equal(result.ok, true);
    assert.ok(result.ok);
    assert.deepEqual(result.receptor, {
      rfc: 'EKU9003173C9',
      nombre: 'ESCUELA KEMPER URGATE',
      regimenFiscal: '601',
      usoCfdi: 'G03',
      codigoPostal: '26015',
      email: 'facturas@kemper.mx',
    });
  });

  it('reports every missing field', () => {
    const result = validateTenantFiscal({});
    assert.equal(result.ok, false);
    assert.ok(!result.ok);
    assert.deepEqual([...result.reasons].sort(), [
      'codigo_postal_missing',
      'razon_social_missing',
      'regimen_missing',
      'rfc_missing',
      'uso_cfdi_missing',
    ]);
  });

  it('rejects the generic RFCs (they mean "público en general")', () => {
    for (const rfc of ['XAXX010101000', 'XEXX010101000']) {
      const result = validateTenantFiscal(makeTenantFiscal({ rfc }));
      assert.ok(!result.ok);
      assert.deepEqual(result.reasons, ['rfc_generic']);
    }
  });

  it('rejects an invalid RFC, CP, régimen and uso', () => {
    const result = validateTenantFiscal(
      makeTenantFiscal({
        rfc: 'NOPE',
        codigoPostal: '2601',
        regimenFiscal: '999',
        usoCfdi: 'CP01',
      }),
    );
    assert.ok(!result.ok);
    assert.deepEqual([...result.reasons].sort(), [
      'codigo_postal_invalid',
      'regimen_invalid',
      'rfc_invalid',
      'uso_cfdi_invalid',
    ]);
  });

  it('rejects a régimen that does not match the RFC type', () => {
    // 612 is persona física only; EKU9003173C9 is a persona moral.
    const moral = validateTenantFiscal(makeTenantFiscal({ regimenFiscal: '612' }));
    assert.ok(!moral.ok);
    assert.deepEqual(moral.reasons, ['regimen_rfc_mismatch']);
    // 601 is persona moral only.
    const fisica = validateTenantFiscal(makeTenantFiscal({ rfc: 'XOJI740919U48' }));
    assert.ok(!fisica.ok);
    assert.deepEqual(fisica.reasons, ['regimen_rfc_mismatch']);
  });

  it('rejects deducciones personales (D01–D10) for a persona moral', () => {
    const result = validateTenantFiscal(makeTenantFiscal({ usoCfdi: 'D01' }));
    assert.ok(!result.ok);
    assert.deepEqual(result.reasons, ['uso_cfdi_regimen_mismatch']);
    const fisica = validateTenantFiscal(
      makeTenantFiscal({ rfc: 'XOJI740919U48', regimenFiscal: '612', usoCfdi: 'D01' }),
    );
    assert.equal(fisica.ok, true);
  });

  it('accepts RESICO (626) for both RFC types and drops an invalid email', () => {
    const moral = validateTenantFiscal(makeTenantFiscal({ regimenFiscal: '626', email: 'nope' }));
    assert.ok(moral.ok);
    assert.equal(moral.receptor.email, undefined);
    const fisica = validateTenantFiscal(
      makeTenantFiscal({ rfc: 'XOJI740919U48', regimenFiscal: '626', email: null }),
    );
    assert.equal(fisica.ok, true);
  });

  it('rejects an over-long razón social', () => {
    const result = validateTenantFiscal(makeTenantFiscal({ razonSocial: 'A'.repeat(255) }));
    assert.ok(!result.ok);
    assert.deepEqual(result.reasons, ['razon_social_invalid']);
  });
});
