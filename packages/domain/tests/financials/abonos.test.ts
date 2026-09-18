import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { AbonoInvalidoError } from '../../src/errors/cobranza-errors.js';
import { aplicarAbono, type VentaAbierta } from '../../src/financials/abonos.js';

/** Doña Mari in the operator handoff: $340.00 across three fiado sales. */
const MARI: readonly VentaAbierta[] = [
  { id: 'V-0409', fecha: '2026-05-14', pendiente: 90_00n },
  { id: 'V-0388', fecha: '2026-05-11', pendiente: 150_00n },
  { id: 'V-0361', fecha: '2026-05-08', pendiente: 100_00n },
];

describe('aplicarAbono (ADR-074: oldest fiado ticket first)', () => {
  it('covers the oldest sales first and leaves the rest open', () => {
    const r = aplicarAbono(MARI, 200_00n);
    assert.deepEqual(r.aplicaciones, [
      { ventaId: 'V-0361', aplicado: 100_00n, completa: true },
      { ventaId: 'V-0388', aplicado: 100_00n, completa: false },
    ]);
    assert.equal(r.aplicado, 200_00n);
    assert.equal(r.restante, 140_00n);
    assert.equal(r.excedente, 0n);
  });

  it('settles everything exactly with the whole balance', () => {
    const r = aplicarAbono(MARI, 340_00n);
    assert.equal(r.aplicaciones.length, 3);
    assert.ok(r.aplicaciones.every((a) => a.completa));
    assert.equal(r.restante, 0n);
  });

  it('returns what exceeds the balance as excedente instead of applying it', () => {
    const r = aplicarAbono(MARI, 400_00n);
    assert.equal(r.aplicado, 340_00n);
    assert.equal(r.excedente, 60_00n);
    assert.equal(r.restante, 0n);
  });

  it('skips sales already paid and ignores input order', () => {
    const r = aplicarAbono(
      [
        { id: 'V-0500', fecha: '2026-05-20', pendiente: 50_00n },
        { id: 'V-0100', fecha: '2026-04-01', pendiente: 0n },
      ],
      20_00n,
    );
    assert.deepEqual(r.aplicaciones, [{ ventaId: 'V-0500', aplicado: 20_00n, completa: false }]);
  });

  it('rejects a zero or negative abono', () => {
    assert.throws(() => aplicarAbono(MARI, 0n), AbonoInvalidoError);
    assert.throws(
      () => aplicarAbono(MARI, -5_00n),
      (e: unknown) => e instanceof AbonoInvalidoError && e.code === 'ABONO_INVALIDO',
    );
  });

  it('with nothing owed, everything is excedente', () => {
    const r = aplicarAbono([], 100_00n);
    assert.deepEqual(r.aplicaciones, []);
    assert.equal(r.excedente, 100_00n);
  });
});
