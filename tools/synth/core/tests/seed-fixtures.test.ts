import assert from 'node:assert/strict';

import { PLAN_LIMITS } from '@xangarro/domain';
import { describe, it } from 'vitest';

import { FIXTURES, historyDates, shiftDate } from '../src/seed/fixtures';
import { Seed } from '../src/schemas/common';

/** The four seeds a scenario can start from (S-04), as plans the seeder executes. */
describe('FIXTURES', () => {
  it('has a plan for every seed the scenario schema accepts, and no other', () => {
    assert.deepEqual(Object.keys(FIXTURES).sort(), [...Seed.options].sort());
  });

  it('plan-al-limite sits exactly at its plan’s operator and device limits', () => {
    const f = FIXTURES['plan-al-limite'];
    assert.equal(f.plan, 'xangarrito');
    assert.equal(f.operators.length, PLAN_LIMITS.xangarrito.operators);
    // mintTenant links one device; the limit is one.
    assert.equal(PLAN_LIMITS.xangarrito.devices, 1);
  });

  it('vacio has nothing on it; catalogo-minimo has a catalogue and an operator, no history', () => {
    assert.deepEqual(
      [
        FIXTURES.vacio.products.length,
        FIXTURES.vacio.operators.length,
        FIXTURES.vacio.history.days,
      ],
      [0, 0, 0],
    );
    const min = FIXTURES['negocio-con-catalogo-minimo'];
    assert.ok(min.products.length >= 2, 'primera-venta sells two products');
    assert.equal(min.operators.length, 1);
    assert.equal(min.history.days, 0);
  });

  it('historial-30-dias is the minimal catalogue plus thirty days of sales', () => {
    const h = FIXTURES['negocio-con-historial-30-dias'];
    assert.equal(h.history.days, 30);
    assert.ok(h.history.perDay >= 1);
    assert.deepEqual(h.products, FIXTURES['negocio-con-catalogo-minimo'].products);
  });

  it('every NIP is four digits (ADR-072), and every price is whole centavos', () => {
    for (const f of Object.values(FIXTURES)) {
      for (const op of f.operators) assert.match(op.nip, /^\d{4}$/);
      for (const p of f.products) assert.ok(Number.isInteger(p.precio) && p.precio > 0, p.nombre);
    }
  });
});

describe('dates', () => {
  it('shifts across month and year ends in the calendar, not in a timezone', () => {
    assert.equal(shiftDate('2026-03-01', -1), '2026-02-28');
    assert.equal(shiftDate('2028-03-01', -1), '2028-02-29');
    assert.equal(shiftDate('2026-01-01', -1), '2025-12-31');
  });

  it('history runs the N days before today, oldest first, and never includes today', () => {
    const d = historyDates('2026-11-19', 3);
    assert.deepEqual(d, ['2026-11-16', '2026-11-17', '2026-11-18']);
    assert.deepEqual(historyDates('2026-11-19', 0), []);
  });

  it('refuses a today that is not a calendar date', () => {
    for (const bad of ['2026-13-01', '2026-02-30', '19/11/2026', '']) {
      assert.throws(() => shiftDate(bad, -1), /date/, bad);
    }
  });
});
