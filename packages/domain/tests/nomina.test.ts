import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { salarioSemanal } from '../src/index.js';

describe('salarioSemanal', () => {
  it('a weekly salary is itself', () => {
    assert.equal(salarioSemanal(210_000n, 'semanal'), 210_000n);
  });

  it('a quincena is 15 days: 7/15 of it, rounded to the centavo', () => {
    assert.equal(salarioSemanal(450_000n, 'quincenal'), 210_000n);
    assert.equal(salarioSemanal(100n, 'quincenal'), 47n);
  });

  it('a month is 12/52 weeks of a year', () => {
    assert.equal(salarioSemanal(1_300_000n, 'mensual'), 300_000n);
  });
});
