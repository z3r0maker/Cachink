import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  formatDate,
  formatDateLong,
  formatDateSlash,
  formatMonth,
  formatPeriodoLabel,
} from '../../src/index.js';

/**
 * Date formatters: ISO in, es-MX out, rendered at noon UTC so a timezone
 * shift can never move the day. `formatMonth` refuses anything that is not
 * `YYYY-MM` in its own words rather than formatting garbage.
 */
describe('date formatters', () => {
  it('short and long forms render the stored day, in es-MX', () => {
    assert.equal(formatDate('2026-04-23'), '23 abr 2026');
    assert.ok(formatDateLong('2026-04-22').endsWith('22 de abril de 2026'));
    assert.ok(
      /^(lunes|martes|miércoles|jueves|viernes|sábado|domingo),/.test(formatDateLong('2026-04-22')),
    );
  });

  it('formatMonth takes YYYY-MM and names the month', () => {
    assert.equal(formatMonth('2026-04'), 'abril de 2026');
    assert.equal(formatMonth('2025-01'), 'enero de 2025');
  });

  it('formatMonth refuses what is not YYYY-MM with 01..12', () => {
    assert.throws(() => formatMonth('2026-13'), /Invalid yearMonth/);
    assert.throws(() => formatMonth('2026-4'), /Invalid yearMonth/);
    assert.throws(() => formatMonth('abril'), /Invalid yearMonth/);
  });

  it('the slash form uppercases its three-letter month', () => {
    assert.equal(formatDateSlash('2026-05-01'), '01/MAY/2026');
    assert.equal(formatPeriodoLabel('2026-05-01', '2026-05-31'), '01/MAY/2026 - 31/MAY/2026');
  });
});
