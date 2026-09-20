import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { AbonoInvalidoError } from '../../src/errors/cobranza-errors.js';
import {
  disponible,
  estadoDeCuenta,
  type CargoFiado,
  type PagoCliente,
} from '../../src/financials/estado-cuenta.js';

/** Taller de Chuy in `Operador Detalle de cliente.dc.html`. */
const CHUY_VENTAS: readonly CargoFiado[] = [
  { id: 'V-0310', fecha: '2026-05-02T14:20', monto: 460_00n },
  { id: 'V-0244', fecha: '2026-04-18T13:40', monto: 300_00n },
  { id: 'V-0288', fecha: '2026-04-28T13:10', monto: 520_00n },
];
const CHUY_ABONOS: readonly PagoCliente[] = [
  { id: 'a2', fecha: '2026-05-14T13:52', monto: 120_00n },
  { id: 'a1', fecha: '2026-04-24T17:05', monto: 300_00n },
];

describe('estadoDeCuenta (ADR-074: two facts, everything else derived)', () => {
  it('applies the abonos in date order to the oldest tickets and derives the balance', () => {
    const e = estadoDeCuenta(CHUY_VENTAS, CHUY_ABONOS);
    assert.deepEqual(
      e.ventas.map((v) => [v.id, v.pagado, v.pendiente]),
      [
        ['V-0244', 300_00n, 0n],
        ['V-0288', 120_00n, 400_00n],
        ['V-0310', 0n, 460_00n],
      ],
    );
    assert.equal(e.saldo, 860_00n);
    assert.equal(e.saldoAFavor, 0n);
  });

  it('names the last ticket each abono reached', () => {
    const e = estadoDeCuenta(CHUY_VENTAS, CHUY_ABONOS);
    assert.deepEqual(e.hasta, { a1: 'V-0244', a2: 'V-0288' });
  });

  it('keeps money beyond every ticket as saldo a favor', () => {
    const e = estadoDeCuenta(CHUY_VENTAS, [
      ...CHUY_ABONOS,
      { id: 'a3', fecha: '2026-05-15T10:00', monto: 900_00n },
    ]);
    assert.equal(e.saldo, 0n);
    assert.equal(e.saldoAFavor, 40_00n);
    assert.equal(e.hasta.a3, 'V-0310');
  });

  it('with no abonos, the balance is every ticket', () => {
    const e = estadoDeCuenta(CHUY_VENTAS, []);
    assert.equal(e.saldo, 1280_00n);
    assert.deepEqual(e.hasta, {});
  });

  it('an abono with nothing owed only builds saldo a favor', () => {
    const e = estadoDeCuenta([], [{ id: 'a', fecha: '2026-05-01', monto: 50_00n }]);
    assert.equal(e.saldoAFavor, 50_00n);
    assert.equal(e.hasta.a, null);
  });

  it('rejects an abono of zero or less', () => {
    assert.throws(
      () => estadoDeCuenta(CHUY_VENTAS, [{ id: 'x', fecha: '2026-05-01', monto: 0n }]),
      AbonoInvalidoError,
    );
  });

  it('disponible never goes below zero', () => {
    assert.equal(disponible(1500_00n, 860_00n), 640_00n);
    assert.equal(disponible(800_00n, 900_00n), 0n);
  });
});

describe('estadoDeCuenta with an opening saldo (C-20: the third fact)', () => {
  it('an opening saldo with no tickets is the saldo', () => {
    const e = estadoDeCuenta([], [], 500_00n);
    assert.equal(e.saldo, 500_00n);
    assert.equal(e.saldoAFavor, 0n);
  });

  it('abonos pay the opening saldo before any ticket', () => {
    const e = estadoDeCuenta(
      [{ id: 'V-1', fecha: '2026-05-01', monto: 300_00n }],
      [{ id: 'a1', fecha: '2026-05-02', monto: 200_00n }],
      500_00n,
    );
    // 200 pays apertura only: apertura 300 + ticket 300.
    assert.equal(e.saldo, 600_00n);
    assert.equal(e.ventas[0]?.pendiente, 300_00n);
    assert.equal(e.hasta.a1, null, 'the abono reached no ticket, only the opening');
  });

  it('an abono that covers the opening spills into the oldest ticket', () => {
    const e = estadoDeCuenta(
      [
        { id: 'V-1', fecha: '2026-05-01', monto: 300_00n },
        { id: 'V-2', fecha: '2026-05-03', monto: 200_00n },
      ],
      [{ id: 'a1', fecha: '2026-05-04', monto: 600_00n }],
      100_00n,
    );
    // 100 → apertura; 500 → V-1 (300) + V-2 (200); 0 pendiente.
    assert.equal(e.saldo, 0n);
    assert.equal(e.saldoAFavor, 0n);
    assert.equal(e.hasta.a1, 'V-2');
  });

  it('an abono beyond opening and every ticket is saldo a favor', () => {
    const e = estadoDeCuenta(
      [{ id: 'V-1', fecha: '2026-05-01', monto: 100_00n }],
      [{ id: 'a1', fecha: '2026-05-02', monto: 400_00n }],
      100_00n,
    );
    assert.equal(e.saldoAFavor, 200_00n);
    assert.equal(e.saldo, 0n);
  });
});
