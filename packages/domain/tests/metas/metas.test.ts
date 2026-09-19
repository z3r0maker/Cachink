import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  figuraDelMes,
  fueraDeRango,
  metaLograda,
  objetivoDe,
  rachaDe,
  ritmoDeMeta,
  type Meta,
} from '../../src/metas/index.js';

const meta = (patch: Partial<Meta>): Meta => ({
  id: 'm1',
  objetivo: 'vender',
  motivo: 'comprar',
  nivel: 'reto',
  objetivoCentavos: 120_000n,
  periodo: '2026-05',
  lograda: null,
  resultadoCentavos: null,
  cerradaAt: null,
  ...patch,
});

describe('objetivoDe', () => {
  it('adds the level for ganar y vender, subtracts it for gastar', () => {
    assert.equal(objetivoDe(100_000n, 'reto', 'vender'), 120_000n);
    assert.equal(objetivoDe(100_000n, 'empujon', 'ganar'), 110_000n);
    assert.equal(objetivoDe(100_000n, 'ambicioso', 'gastar'), 70_000n);
  });

  it('integer maths never invents centavos', () => {
    // 33,333 × 1.2 = 39,999.6 → truncates toward the harder goal, not past it.
    assert.equal(objetivoDe(33_333n, 'reto', 'vender'), 39_999n);
  });
});

describe('figuraDelMes y metaLograda', () => {
  const totales = { ventas: 200_000n, gastos: 80_000n };
  it('each kind reads its own figure', () => {
    assert.equal(figuraDelMes('vender', totales), 200_000n);
    assert.equal(figuraDelMes('gastar', totales), 80_000n);
    assert.equal(figuraDelMes('ganar', totales), 120_000n);
  });
  it('ganar/vender meet the target at or above it; gastar at or below', () => {
    assert.ok(metaLograda(meta({ objetivoCentavos: 120_000n }), 120_000n));
    assert.ok(!metaLograda(meta({ objetivoCentavos: 120_000n }), 119_999n));
    assert.ok(metaLograda(meta({ objetivo: 'gastar', objetivoCentavos: 70_000n }), 70_000n));
    assert.ok(!metaLograda(meta({ objetivo: 'gastar', objetivoCentavos: 70_000n }), 70_001n));
  });
});

describe('ritmoDeMeta', () => {
  it('ahead when actual beats the linear pace by a full day', () => {
    // May has 31 days; on day 16 the line expects ~61,935 of 120,000.
    const r = ritmoDeMeta(meta({}), 90_000n, '2026-05-16');
    assert.equal(r.ritmo, 'ahead');
    assert.equal(r.faltante, 30_000n);
  });

  it('behind when the pace is a day short, and says the whole target before the month starts', () => {
    assert.equal(ritmoDeMeta(meta({}), 10_000n, '2026-05-20').ritmo, 'behind');
    const antes = ritmoDeMeta(meta({}), 0n, '2026-04-28');
    assert.equal(antes.ritmo, 'onpace');
    assert.equal(antes.faltante, 120_000n);
  });

  it('a reached goal owes nothing', () => {
    assert.equal(ritmoDeMeta(meta({}), 130_000n, '2026-05-31').faltante, 0n);
  });
});

describe('rachaDe', () => {
  const cerrada = (periodo: string, lograda: boolean): Meta =>
    meta({ periodo, lograda, resultadoCentavos: 1n, cerradaAt: 'x' });
  it('counts consecutive wins back from the newest, and stops at a miss', () => {
    assert.equal(
      rachaDe([cerrada('2026-05', true), cerrada('2026-04', true), cerrada('2026-03', false)]),
      2,
    );
  });
  it('a miss in the newest month is a racha of zero', () => {
    assert.equal(rachaDe([cerrada('2026-05', false), cerrada('2026-04', true)]), 0);
  });
  it('a gap in the months breaks the racha', () => {
    assert.equal(rachaDe([cerrada('2026-05', true), cerrada('2026-03', true)]), 1);
  });
  it('no history is no racha', () => {
    assert.equal(rachaDe([]), 0);
  });
});

describe('fueraDeRango', () => {
  it('a wish, not a goal: beyond 3× or under half the base', () => {
    assert.ok(fueraDeRango(310_000n, 100_000n));
    assert.ok(fueraDeRango(40_000n, 100_000n));
    assert.ok(!fueraDeRango(120_000n, 100_000n));
    assert.ok(!fueraDeRango(50_000n, 0n), 'no base yet — negocio nuevo, not out of range');
  });
});
