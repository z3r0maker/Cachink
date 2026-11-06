import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { productImageStamp } from '../../src/entities/index.js';
import type { IsoTimestamp } from '../../src/dates/index.js';

const T = (s: string) => s as IsoTimestamp;

describe('productImageStamp — a new row always wins locally (ADR-134 §3)', () => {
  it('is the clock when the product has no row yet', () => {
    assert.equal(
      productImageStamp(T('2026-11-06T12:00:00.000Z'), null),
      '2026-11-06T12:00:00.000Z',
    );
  });

  it('is the clock when the clock is already past the previous row', () => {
    assert.equal(
      productImageStamp(T('2026-11-06T12:00:00.005Z'), T('2026-11-06T12:00:00.004Z')),
      '2026-11-06T12:00:00.005Z',
    );
  });

  it('steps one millisecond past a row written in the same millisecond', () => {
    assert.equal(
      productImageStamp(T('2026-11-06T12:00:00.004Z'), T('2026-11-06T12:00:00.004Z')),
      '2026-11-06T12:00:00.005Z',
    );
  });

  it('steps past a row stamped ahead of this phone’s clock (another device, a skewed clock)', () => {
    assert.equal(
      productImageStamp(T('2026-11-06T12:00:00.000Z'), T('2026-11-06T12:00:59.999Z')),
      '2026-11-06T12:01:00.000Z',
    );
  });
});
