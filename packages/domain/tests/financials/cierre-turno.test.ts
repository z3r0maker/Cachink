import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { CorteInvalidoError } from '../../src/errors/caja-errors.js';
import {
  DENOMINACIONES_MXN,
  diferenciaCorte,
  efectivoEsperado,
  totalContado,
} from '../../src/financials/cierre-turno.js';

/** The operator handoff's turno: $800 + $2,140 + $550 − $620. */
const TURNO = {
  fondo: 800_00n,
  ventasEfectivo: [1_000_00n, 1_140_00n],
  abonosEfectivo: [400_00n, 150_00n],
  gastosCaja: [620_00n],
};

describe('efectivoEsperado (ADR-074 §3: one calculator per turno)', () => {
  it('reproduces the handoff: $2,870.00', () => {
    assert.equal(efectivoEsperado(TURNO), 2_870_00n);
  });

  it('is the fondo alone when nothing moved', () => {
    assert.equal(
      efectivoEsperado({ fondo: 500_00n, ventasEfectivo: [], abonosEfectivo: [], gastosCaja: [] }),
      500_00n,
    );
  });

  it('rejects a negative fondo', () => {
    assert.throws(() => efectivoEsperado({ ...TURNO, fondo: -1n }), CorteInvalidoError);
  });

  it('rejects a negative sale, abono or expense', () => {
    assert.throws(
      () => efectivoEsperado({ ...TURNO, ventasEfectivo: [-5_00n] }),
      CorteInvalidoError,
    );
    assert.throws(
      () => efectivoEsperado({ ...TURNO, abonosEfectivo: [-5_00n] }),
      CorteInvalidoError,
    );
    assert.throws(
      () => efectivoEsperado({ ...TURNO, gastosCaja: [-5_00n] }),
      (e: unknown) => e instanceof CorteInvalidoError && e.code === 'CORTE_INVALIDO',
    );
  });
});

describe('totalContado and diferenciaCorte', () => {
  it('counts bills and coins from $1,000 down to $1', () => {
    assert.deepEqual(
      DENOMINACIONES_MXN.map((d) => d.valor),
      [1000_00n, 500_00n, 200_00n, 100_00n, 50_00n, 20_00n, 10_00n, 5_00n, 2_00n, 1_00n],
    );
    const conteo = { 1000: 1, 500: 2, 200: 4, 100: 6, 50: 3, 20: 5, 10: 8, 5: 6, 2: 5, 1: 10 };
    assert.equal(totalContado(conteo), 3_780_00n);
    assert.equal(totalContado({}), 0n);
  });

  it('rejects a negative or fractional count', () => {
    assert.throws(() => totalContado({ 100: -1 }), CorteInvalidoError);
    assert.throws(() => totalContado({ 100: 1.5 }), CorteInvalidoError);
  });

  it('says cuadra, falta or sobra with the amount', () => {
    assert.deepEqual(diferenciaCorte(2_870_00n, 2_870_00n), { tipo: 'cuadra', monto: 0n });
    assert.deepEqual(diferenciaCorte(2_800_00n, 2_870_00n), { tipo: 'falta', monto: 70_00n });
    assert.deepEqual(diferenciaCorte(3_780_00n, 2_870_00n), { tipo: 'sobra', monto: 910_00n });
  });
});
