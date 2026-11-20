import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  gastoDesdeCaptura,
  MontoInvalidoError,
  postMovement,
  resumenDelMes,
  CargoMxnFaltanteError,
  type JournalLine,
} from '../../src/corp/ledger/index.js';

/** E-02's capture screen: what the founder types becomes a gasto, and the month adds up. */
describe('gastoDesdeCaptura', () => {
  const base = {
    categoria: 'costo_servicio',
    moneda: 'MXN',
    total: 1_160_00n,
    iva: 160_00n,
    cargoMxn: null,
    deducible: true,
  } as const;

  it('splits a deductible MXN invoice into subtotal and creditable IVA', () => {
    const { movement, usd } = gastoDesdeCaptura(base);
    assert.equal(movement.subtotal, 1_000_00n);
    assert.equal(movement.iva, 160_00n);
    assert.equal(movement.tratamientoIva, 'acreditable');
    assert.equal(movement.pagado, true);
    assert.equal(usd, null);
  });

  it('books a USD charge at what the bank charged in pesos, and keeps the dollars and the rate', () => {
    const { movement, usd } = gastoDesdeCaptura({
      ...base,
      moneda: 'USD',
      total: 20_00n,
      iva: 0n,
      cargoMxn: 372_10n,
    });
    assert.equal(movement.subtotal, 372_10n);
    assert.deepEqual(usd, { montoOriginal: 20_00n, tipoCambio: '18.6050' });
  });

  it('splits the IVA of a USD receipt in the same proportion, the total still the charge', () => {
    const { movement } = gastoDesdeCaptura({
      ...base,
      moneda: 'USD',
      total: 116_00n,
      iva: 16_00n,
      cargoMxn: 2_158_33n,
    });
    assert.equal(movement.iva, 297_70n);
    assert.equal(movement.subtotal + movement.iva, 2_158_33n);
  });

  it('puts the IVA of a non-deductible expense into the expense', () => {
    const { movement } = gastoDesdeCaptura({ ...base, deducible: false });
    assert.equal(movement.tratamientoIva, 'no_acreditable');
    const lines = postMovement(movement);
    assert.equal(lines.find((l) => l.cuenta === 'costo_servicio')?.debe, 1_160_00n);
  });

  it('refuses an IVA that is the whole charge', () => {
    assert.throws(() => gastoDesdeCaptura({ ...base, iva: 1_160_00n }), MontoInvalidoError);
  });

  it('refuses a USD charge without what the bank charged', () => {
    assert.throws(
      () => gastoDesdeCaptura({ ...base, moneda: 'USD', cargoMxn: null }),
      CargoMxnFaltanteError,
    );
    assert.throws(
      () => gastoDesdeCaptura({ ...base, moneda: 'USD', cargoMxn: 0n }),
      CargoMxnFaltanteError,
    );
  });

  it('refuses a zero charge', () => {
    assert.throws(() => gastoDesdeCaptura({ ...base, total: 0n, iva: 0n }), MontoInvalidoError);
  });
});

describe('resumenDelMes', () => {
  const entry = (
    id: string,
    lines: readonly JournalLine[],
    reversesEntryId: string | null = null,
  ) => ({
    id,
    reversesEntryId,
    lines,
  });
  const cobro = postMovement({
    kind: 'cobro',
    subtotal: 1_000_00n,
    iva: 160_00n,
    destino: 'bancos',
  });
  const gasto = postMovement({ kind: 'comision_bancaria', monto: 50_00n });
  const fondeo = postMovement({ kind: 'aportacion_capital', socio: 1, monto: 10_000_00n });

  it('adds what came into and went out of the bank', () => {
    const r = resumenDelMes([entry('a', cobro), entry('b', gasto), entry('c', fondeo)]);
    assert.equal(r.entradas, 11_160_00n);
    assert.equal(r.salidas, 50_00n);
    assert.equal(r.neto, 11_110_00n);
    assert.equal(r.fondeoSocios, 10_000_00n);
    assert.equal(r.movimientos, 3);
  });

  it('leaves out an entry and its reversal: together they never happened', () => {
    const reversa = gasto.map((l) => ({ ...l, debe: l.haber, haber: l.debe }));
    const r = resumenDelMes([entry('b', gasto), entry('r', reversa, 'b')]);
    assert.equal(r.entradas, 0n);
    assert.equal(r.salidas, 0n);
    assert.equal(r.movimientos, 0);
  });

  it('counts nothing for a month without entries', () => {
    const r = resumenDelMes([]);
    assert.equal(r.neto, 0n);
    assert.equal(r.movimientos, 0);
  });

  it('ignores an entry that never touched the bank', () => {
    const porDepositar = postMovement({
      kind: 'cobro',
      subtotal: 100_00n,
      iva: 16_00n,
      destino: 'stripe_por_depositar',
    });
    const r = resumenDelMes([entry('s', porDepositar)]);
    assert.equal(r.entradas, 0n);
    assert.equal(r.movimientos, 1);
  });
});
