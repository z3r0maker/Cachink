import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { PARAM_BUDGET, chunkByParams } from '../src/sync/push-rows';

/**
 * DB3-L-07: Postgres takes at most 65,535 bind parameters a statement. The
 * widest push today is 14,000 (caja_turnos × 500); nothing chunked it if the
 * push limit ever rose. Rows now go `floor(budget / columns)` a statement.
 */
describe('chunkByParams', () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `R${i}` }));

  it('keeps every row, in order, within the budget per statement', () => {
    const chunks = chunkByParams(rows(7), 3, 10);
    assert.deepEqual(
      chunks.map((c) => c.length),
      [3, 3, 1],
    );
    assert.deepEqual(
      chunks.flat().map((r) => r.id),
      rows(7).map((r) => r.id),
    );
  });

  it('sends one row a statement when a row alone is past the budget', () => {
    assert.deepEqual(
      chunkByParams(rows(3), 50, 10).map((c) => c.length),
      [1, 1, 1],
    );
  });

  it('is one statement for a full push under the real budget', () => {
    assert.equal(PARAM_BUDGET, 65_000);
    assert.equal(chunkByParams(rows(500), 28, PARAM_BUDGET).length, 1);
    assert.equal(chunkByParams(rows(3_000), 28, PARAM_BUDGET).length, 2);
    assert.deepEqual(chunkByParams([], 28, PARAM_BUDGET), []);
  });
});
