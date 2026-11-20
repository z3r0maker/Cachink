import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { marketWeights } from '../src/aggregate/weights';

/**
 * A finding's priority sums its personas' market weights (S-09). A chaos or
 * device persona is not a segment: what it breaks, it breaks for every human
 * segment, so it counts at the humans' summed weight (owner decision, S-10).
 */
const human = (id: string, value: number) => ({ id, kind: 'human' as const, weight: value });

describe('marketWeights', () => {
  it('keeps each human’s own weight and gives a non-human the humans’ sum', () => {
    const w = marketWeights([
      human('lupita-abarrotes', 0.3),
      human('taquero', 0.25),
      { id: 'chaos', kind: 'chaos', weight: 0 },
    ]);
    assert.equal(w.get('lupita-abarrotes'), 0.3);
    assert.equal(w.get('taquero'), 0.25);
    assert.equal(w.get('chaos'), 0.55);
  });

  it('rounds the sum to hundredths, so 0.3 + 0.25 + 0.1 is not 0.6499999', () => {
    const w = marketWeights([
      human('a', 0.3),
      human('b', 0.25),
      human('c', 0.1),
      { id: 'device', kind: 'device', weight: 0 },
    ]);
    assert.equal(w.get('device'), 0.65);
  });

  it('gives a non-human 0 when the catalogue has no humans', () => {
    assert.equal(marketWeights([{ id: 'chaos', kind: 'chaos', weight: 0 }]).get('chaos'), 0);
  });

  it('refuses a non-human that declares a weight of its own', () => {
    assert.throws(
      () => marketWeights([human('a', 0.3), { id: 'chaos', kind: 'chaos', weight: 0.2 }]),
      /chaos: a chaos persona inherits its weight/,
    );
  });

  it('refuses one id twice', () => {
    assert.throws(() => marketWeights([human('a', 0.3), human('a', 0.2)]), /«a» twice/);
  });
});
