import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { loteDeCompra, semanas } from '../scripts/seed-finanzas-stock.js';

/**
 * The arithmetic that keeps the seeded ledger possible, proved without a
 * database so `pnpm test` catches a regression before `pnpm db:reset` does.
 *
 * `seed-contract.integration.test.ts` asserts the outcome — no producto nets
 * negative. This asserts the reason: a week's compra is never smaller than
 * the week's consumption, and every operating day belongs to exactly one
 * week, so nothing sells outside a week that restocked it.
 */
describe('loteDeCompra', () => {
  it('never buys less than the week sold', () => {
    for (let consumido = 0; consumido <= 200; consumido++) {
      assert.ok(
        loteDeCompra(consumido) >= consumido,
        `${consumido} sold but only ${loteDeCompra(consumido)} bought`,
      );
    }
  });

  it('rounds up to whole lots — nobody buys 17 refrescos', () => {
    assert.equal(loteDeCompra(1), 10);
    assert.equal(loteDeCompra(17), 20);
    assert.equal(loteDeCompra(20), 20);
    assert.equal(loteDeCompra(21), 30);
  });

  it('buys nothing for a producto the week never sold', () => {
    assert.equal(loteDeCompra(0), 0);
  });

  it('returns whole units — a movement cantidad is an integer column', () => {
    for (const consumido of [3, 7, 44, 199]) {
      assert.ok(Number.isInteger(loteDeCompra(consumido)));
    }
  });
});

describe('semanas', () => {
  it('splits operating days into six-day weeks — the taquería rests Sundays', () => {
    const days = Array.from({ length: 14 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
    const out = semanas(days);
    assert.deepEqual(
      out.map((w) => w.length),
      [6, 6, 2],
    );
  });

  it('loses no day and duplicates none — every venta sits in a restocked week', () => {
    const days = Array.from({ length: 27 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
    assert.deepEqual(semanas(days).flat(), days);
  });

  it('returns no weeks for no days', () => {
    assert.deepEqual(semanas([]), []);
  });

  it('gives a short month a single partial week', () => {
    assert.deepEqual(semanas(['2026-09-01', '2026-09-02']), [['2026-09-01', '2026-09-02']]);
  });
});
