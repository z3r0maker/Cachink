import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { llenadoStock, margenPromedio } from '../src/app/(portal)/productos/derive';
import type { Producto } from '../src/app/(portal)/productos/parts';

const p = (precio: number, costo: number): Producto =>
  ({ precio: BigInt(precio), costo: BigInt(costo) }) as Producto;

describe('margenPromedio (B-6)', () => {
  it('weights by price, so the combo outvotes the refresco', () => {
    // 60% on a $600 line and 0% on a $12 one is not a 30% catalogue.
    const m = margenPromedio([p(60_000, 24_000), p(1_200, 1_200)]);
    assert.ok(m !== null);
    // (61_200 - 25_200) / 61_200
    assert.ok(Math.abs(m - 36_000 / 61_200) < 1e-9, `got ${m}`);
  });

  it('leaves an unpriced product out of both halves', () => {
    // Counting its cost against nothing would drag the margin below zero.
    const conCero = margenPromedio([p(10_000, 4_000), p(0, 3_000)]);
    const sinEl = margenPromedio([p(10_000, 4_000)]);
    assert.equal(conCero, sinEl);
    assert.equal(conCero, 0.6);
  });

  it('answers null rather than NaN when nothing is priced', () => {
    assert.equal(margenPromedio([p(0, 500)]), null);
    assert.equal(margenPromedio([]), null);
  });

  it('goes negative when the catalogue sells below cost, rather than clamping', () => {
    // An owner pricing under cost must see it, not a floor of zero.
    const m = margenPromedio([p(1_000, 1_500)]);
    assert.equal(m, -0.5);
  });
});

describe('llenadoStock (B-5)', () => {
  it('puts the threshold at the halfway mark', () => {
    // The whole point of the bar: below the threshold reads as under half.
    assert.equal(llenadoStock(40, 40), 50);
    assert.equal(llenadoStock(20, 40), 25);
  });

  it('clamps a full shelf at 100 instead of overflowing the bar', () => {
    assert.equal(llenadoStock(183, 40), 100);
  });

  it('draws empty at zero, and never negative', () => {
    assert.equal(llenadoStock(0, 3), 0);
    // Stock can go negative in the data; the bar may not.
    assert.equal(llenadoStock(-5, 3), 0);
  });

  it('a product with no threshold has nothing to be below, so it draws full', () => {
    assert.equal(llenadoStock(24, 0), 100);
    // …including at zero stock, where there is still no threshold to miss.
    assert.equal(llenadoStock(0, 0), 0);
  });
});
