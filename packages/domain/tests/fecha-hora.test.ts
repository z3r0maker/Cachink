import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { formatFechaHora } from '../src/index.js';

describe('formatFechaHora', () => {
  it("reads a UTC timestamp on Mexico City's clock", () => {
    assert.equal(formatFechaHora('2026-05-13T03:05:00Z'), '12 may 2026, 21:05');
  });

  it('keeps the minutes and a 24-hour clock', () => {
    assert.equal(formatFechaHora('2026-09-18T19:30:00Z'), '18 sep 2026, 13:30');
  });

  it('renders a missing or broken value as a dash', () => {
    assert.equal(formatFechaHora(null), '—');
    assert.equal(formatFechaHora(''), '—');
    assert.equal(formatFechaHora('ayer'), '—');
  });
});
