import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  isValidCodigoPostal,
  isValidRfc,
  normalizeRfc,
  RFC_GENERICO_NACIONAL,
  rfcCheckDigit,
  tipoPersona,
} from '../../src/index.js';

/** P-08's acceptance: persona física, moral, invalid checksum, lowercase normalised. */
describe('RFC', () => {
  it('accepts SAT’s own test RFCs — persona física and moral', () => {
    for (const rfc of ['XOJI740919U48', 'CACX7605101P8', 'EKU9003173C9', 'URE180429TM6']) {
      assert.equal(isValidRfc(rfc), true, rfc);
    }
    assert.equal(tipoPersona('XOJI740919U48'), 'fisica');
    assert.equal(tipoPersona('EKU9003173C9'), 'moral');
  });

  it('refuses a wrong check digit — the typo SAT would reject', () => {
    assert.equal(rfcCheckDigit('EKU9003173C9'), '9');
    assert.equal(isValidRfc('EKU9003173CZ'), false);
    assert.equal(isValidRfc('XOJI740919U47'), false);
  });

  it('refuses the wrong shape and an impossible date', () => {
    for (const rfc of ['EKU9013173C9', 'EKU900317', 'EK9003173C9X1', '', '1234567890123']) {
      assert.equal(isValidRfc(rfc), false, rfc);
    }
  });

  it('normalises what people type: spaces, dashes, lowercase', () => {
    assert.equal(normalizeRfc(' xoji-740919 u48 '), 'XOJI740919U48');
    assert.equal(isValidRfc(normalizeRfc('eku9003173c9')), true);
  });

  it('accepts the generic RFCs, which SAT defines rather than computes', () => {
    assert.equal(isValidRfc(RFC_GENERICO_NACIONAL), true);
    assert.equal(isValidRfc('XEXX010101000'), true);
  });

  it('validates a five-digit código postal', () => {
    assert.equal(isValidCodigoPostal('06600'), true);
    for (const cp of ['6600', '066000', 'ABCDE', '']) assert.equal(isValidCodigoPostal(cp), false);
  });
});
