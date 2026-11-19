import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertDeclaracion,
  compararConDeclaracion,
  DeclaracionInvalidaError,
  estimadosDeImpuestos,
  lineaCuadra,
  pagoDeDeclaracion,
  refPagoImpuestos,
  totalDeclarado,
  type Declaracion,
} from '../../src/corp/impuestos/index.js';

/** The contador's figures against the estimate (E-13, board CD-09b). */
const octubre: Declaracion = {
  periodo: '2026-10',
  isr: 0n,
  iva: 612_85n,
  retencionIsr: 350_00n,
  retencionIva: 373_33n,
  lineaImporte: 1_336_18n,
  lineaVigencia: '2026-11-17',
};

const [estimado] = estimadosDeImpuestos(
  [
    {
      mes: '2026-10',
      ingresos: 13_794_81n,
      deducciones: 40_000_00n,
      ivaTrasladado: 2_207_17n,
      ivaAcreditable: 1_640_32n,
      retencionIsr: 350_00n,
      retencionIva: 373_33n,
    },
  ],
  new Map(),
);

describe('assertDeclaracion', () => {
  it('accepts the contador’s figures with or without the línea de captura', () => {
    assertDeclaracion(octubre);
    assertDeclaracion({ ...octubre, lineaImporte: null, lineaVigencia: null });
  });

  it('refuses a negative amount', () => {
    assert.throws(() => assertDeclaracion({ ...octubre, iva: -1n }), DeclaracionInvalidaError);
  });

  it('refuses a period that is not a month and an expiry that is not a day', () => {
    assert.throws(
      () => assertDeclaracion({ ...octubre, periodo: '2026-10-01' }),
      DeclaracionInvalidaError,
    );
    assert.throws(
      () => assertDeclaracion({ ...octubre, lineaVigencia: '2026-11-31' }),
      DeclaracionInvalidaError,
    );
  });

  it('refuses a línea de captura of zero', () => {
    assert.throws(
      () => assertDeclaracion({ ...octubre, lineaImporte: 0n }),
      DeclaracionInvalidaError,
    );
  });
});

describe('compararConDeclaracion', () => {
  it('flags a difference over $1 and only that one', () => {
    assert.ok(estimado !== undefined);
    const c = compararConDeclaracion(estimado, octubre);
    assert.equal(c.isr.diferencia, 0n);
    assert.equal(c.iva.estimado, 566_85n);
    assert.equal(c.iva.diferencia, 46_00n);
    assert.equal(c.iva.revisar, true);
    assert.equal(c.retenciones.revisar, false);
    assert.equal(c.total.declarado, 1_336_18n);
  });

  it('does not flag a difference of exactly $1', () => {
    assert.ok(estimado !== undefined);
    const c = compararConDeclaracion(estimado, { ...octubre, iva: 567_85n });
    assert.equal(c.iva.diferencia, 1_00n);
    assert.equal(c.iva.revisar, false);
  });

  it('has nothing to compare before the contador declares', () => {
    assert.ok(estimado !== undefined);
    const c = compararConDeclaracion(estimado, null);
    assert.equal(c.iva.declarado, null);
    assert.equal(c.iva.diferencia, null);
    assert.equal(c.iva.revisar, false);
  });
});

describe('the línea de captura and the payment', () => {
  it('adds up the four figures, and the línea matches them', () => {
    assert.equal(totalDeclarado(octubre), 1_336_18n);
    assert.equal(lineaCuadra(octubre), true);
    assert.equal(lineaCuadra({ ...octubre, lineaImporte: 1_290_18n }), false);
    assert.equal(lineaCuadra({ ...octubre, lineaImporte: null }), true);
  });

  it('pays the ISR, the IVA and both withholdings in one movement', () => {
    assert.deepEqual(pagoDeDeclaracion(octubre), {
      kind: 'pago_impuestos',
      isr: 0n,
      iva: 612_85n,
      retenciones: 723_33n,
    });
    assert.equal(refPagoImpuestos('2026-10'), 'impuestos:2026-10');
  });

  it('pays nothing for a declaration en ceros', () => {
    assert.equal(
      pagoDeDeclaracion({ ...octubre, iva: 0n, retencionIsr: 0n, retencionIva: 0n }),
      null,
    );
  });
});
