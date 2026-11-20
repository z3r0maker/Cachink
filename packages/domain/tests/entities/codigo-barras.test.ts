/**
 * A barcode names one product (M-19, ADR-150): the comparison key and the
 * error a duplicate raises.
 */
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { codigoCanonico, mismoCodigo } from '../../src/entities/codigo-barras.js';
import { CodigoDuplicadoError } from '../../src/errors/codigo-barras-errors.js';

describe('codigoCanonico', () => {
  it('pads every GTIN length to the GS1 14-digit form', () => {
    assert.equal(codigoCanonico('12345670'), '00000012345670');
    assert.equal(codigoCanonico('012000001772'), '00012000001772');
    assert.equal(codigoCanonico('7501055300075'), '07501055300075');
    assert.equal(codigoCanonico('17501055300072'), '17501055300072');
  });

  it('makes a UPC-A and the same code read as EAN-13 one key', () => {
    assert.equal(codigoCanonico('012000001772'), codigoCanonico('0012000001772'));
  });

  it('trims the code before deciding what it is', () => {
    assert.equal(codigoCanonico(' 7501055300075 '), '07501055300075');
  });

  it('compares a digits-only code of another length as it is', () => {
    assert.equal(codigoCanonico('1234567890'), '1234567890');
    assert.equal(codigoCanonico('00123'), '00123');
  });

  it('keeps letters, upper-cased, for Code 128 and Code 39', () => {
    assert.equal(codigoCanonico(' tac-01 '), 'TAC-01');
    assert.equal(codigoCanonico('TAC-01'), codigoCanonico('tac-01'));
  });

  it('gives null for no code at all', () => {
    assert.equal(codigoCanonico(null), null);
    assert.equal(codigoCanonico(undefined), null);
    assert.equal(codigoCanonico(''), null);
    assert.equal(codigoCanonico('   '), null);
  });
});

describe('mismoCodigo', () => {
  it('is true for two forms of one code', () => {
    assert.equal(mismoCodigo('012000001772', '0012000001772'), true);
  });

  it('is false for two different codes', () => {
    assert.equal(mismoCodigo('7501055300075', '7501055300082'), false);
  });

  it('is false when either side has no code', () => {
    assert.equal(mismoCodigo(null, null), false);
    assert.equal(mismoCodigo('', '  '), false);
    assert.equal(mismoCodigo('7501055300075', null), false);
  });
});

describe('CodigoDuplicadoError', () => {
  it('names the product that already has the code', () => {
    const e = new CodigoDuplicadoError('7501055300075', 'Refresco de cola');
    assert.equal(e.code, 'CODIGO_DUPLICADO');
    assert.equal(e.name, 'CodigoDuplicadoError');
    assert.equal(e.codigo, '7501055300075');
    assert.equal(e.otroProducto, 'Refresco de cola');
    assert.ok(e instanceof Error);
    assert.equal(e.message, 'Ese código ya lo tiene «Refresco de cola».');
  });
});
