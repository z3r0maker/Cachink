import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  mesMas,
  promedioMensual,
  proximoCargo,
  proyeccionDelMes,
  ServicioInvalidoError,
  usoDelPlan,
} from '../../src/corp/servicios/index.js';
import { fijo } from './servicios-fixture.js';

/**
 * E-24, board CD-18c: Azure AI Foundry on 8 October 2026 posted $120 for June,
 * $480 for July, $900 for August and $1,240 for September; $441.29 so far in
 * October projects $1,710.00 at 31 days.
 */
const azure = new Map([
  ['2026-06', 120_00n],
  ['2026-07', 480_00n],
  ['2026-08', 900_00n],
  ['2026-09', 1_240_00n],
]);

describe('promedioMensual', () => {
  it("averages the board's July to September: ($480 + $900 + $1,240) ÷ 3", () => {
    assert.equal(promedioMensual('uso', azure, '2026-10'), 873_33n);
  });

  it('never counts the month on screen, nor a month that posted nothing', () => {
    const conHueco = new Map([...azure, ['2026-10', 9_999_00n], ['2026-08', 0n]]);
    assert.equal(promedioMensual('uso', conHueco, '2026-10'), 613_33n);
  });

  it('divides by the months it has when it has fewer than three', () => {
    assert.equal(promedioMensual('fijo', new Map([['2026-09', 368_00n]]), '2026-10'), 368_00n);
  });

  it('is null before anything posted', () => {
    assert.equal(promedioMensual('fijo', new Map(), '2026-10'), null);
    assert.equal(promedioMensual('anual', new Map(), '2026-10'), null);
  });

  it('spreads an annual charge over 12, and forgets one from over a year ago', () => {
    assert.equal(promedioMensual('anual', new Map([['2026-09', 1_848_00n]]), '2026-10'), 154_00n);
    assert.equal(promedioMensual('anual', new Map([['2025-09', 1_848_00n]]), '2026-10'), null);
  });
});

describe('proyeccionDelMes', () => {
  it("carries the board's 8 days to October's 31", () => {
    assert.deepEqual(proyeccionDelMes(441_29n, '2026-10-08', '2026-10'), {
      monto: 1_710_00n,
      dias: 8,
    });
  });

  it('shows nothing with fewer than 3 days of data (plan E-24)', () => {
    assert.equal(proyeccionDelMes(96_40n, '2026-10-02', '2026-10'), null);
    assert.notEqual(proyeccionDelMes(96_40n, '2026-10-03', '2026-10'), null);
  });

  it("never projects last month's reading onto this one", () => {
    assert.equal(proyeccionDelMes(1_240_00n, '2026-09-30', '2026-10'), null);
  });

  it('uses the month’s own length', () => {
    assert.equal(proyeccionDelMes(100_00n, '2027-02-14', '2027-02')?.monto, 200_00n);
  });
});

describe('usoDelPlan', () => {
  it("reads the board's Supabase: 310 of 500 MB is 62 %", () => {
    assert.equal(usoDelPlan(310, 500), 62);
  });

  it('rounds down, so 59.9 % is not yet 60', () => {
    assert.equal(usoDelPlan(599, 1000), 59);
  });

  it('refuses a limit of zero', () => {
    assert.throws(() => usoDelPlan(1, 0), ServicioInvalidoError);
  });
});

describe('proximoCargo', () => {
  it('is this month’s day while it has not passed, else next month’s', () => {
    assert.equal(proximoCargo(fijo, '2026-10-08'), '2026-10-28');
    assert.equal(proximoCargo(fijo, '2026-10-28'), '2026-10-28');
    assert.equal(proximoCargo(fijo, '2026-10-29'), '2026-11-28');
  });

  it('moves a past renewal to its next year', () => {
    const apple: Servicio = { ...fijo, cobro: 'anual', diaCargo: null, renueva: '2026-09-10' };
    assert.equal(proximoCargo(apple, '2026-10-08'), '2027-09-10');
    assert.equal(proximoCargo(apple, '2026-09-10'), '2026-09-10');
  });

  it('has none for a free plan, a commission or a service not contracted', () => {
    assert.equal(proximoCargo({ ...fijo, cobro: 'gratis' }, '2026-10-08'), null);
    assert.equal(proximoCargo({ ...fijo, cobro: 'comision' }, '2026-10-08'), null);
    assert.equal(proximoCargo({ ...fijo, estado: 'por_contratar' }, '2026-10-08'), null);
  });
});

describe('mesMas', () => {
  it('crosses a year both ways, and refuses what is not a month', () => {
    assert.equal(mesMas('2026-12', 1), '2027-01');
    assert.equal(mesMas('2026-01', -1), '2025-12');
    assert.throws(() => mesMas('2026-13', 1), ServicioInvalidoError);
  });
});
