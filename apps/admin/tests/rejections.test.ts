import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  REJECTION_CODE_CAP,
  REJECTIONS_UNAVAILABLE,
  RejectionInputError,
  rejectionSection,
  rejectionWindowStart,
  summarizeRejections,
} from '@/server/alerts/rejections';

describe('summarizeRejections', () => {
  it('orders by count then code, totals, and drops zero rows', () => {
    const s = summarizeRejections([
      { code: 'HYBRID_UPDATE_FORBIDDEN', n: 2 },
      { code: 'FK_PRODUCT_MISSING', n: 5 },
      { code: 'CLOCK_SKEW', n: 2 },
      { code: 'EMPTY', n: 0 },
    ]);
    assert.deepEqual(s, {
      status: 'ok',
      total: 9,
      byCode: [
        { code: 'FK_PRODUCT_MISSING', n: 5 },
        { code: 'CLOCK_SKEW', n: 2 },
        { code: 'HYBRID_UPDATE_FORBIDDEN', n: 2 },
      ],
    });
  });

  it('is an explicit zero with no rows', () => {
    assert.deepEqual(summarizeRejections([]), { status: 'ok', total: 0, byCode: [] });
  });

  it('refuses a negative count', () => {
    assert.throws(() => summarizeRejections([{ code: 'X', n: -1 }]), RejectionInputError);
  });

  it('refuses a fractional or non-finite count', () => {
    assert.throws(() => summarizeRejections([{ code: 'X', n: 1.5 }]), RejectionInputError);
    assert.throws(() => summarizeRejections([{ code: 'X', n: Number.NaN }]), RejectionInputError);
  });

  it('refuses a blank code, with a typed code', () => {
    assert.throws(
      () => summarizeRejections([{ code: '  ', n: 1 }]),
      (e: unknown) => e instanceof RejectionInputError && e.code === 'INVALID_REJECTION_COUNT',
    );
  });
});

describe('rejectionWindowStart', () => {
  it('opens exactly 24 hours before the run', () => {
    const run = new Date('2026-09-17T14:00:00.000Z');
    assert.equal(rejectionWindowStart(run), '2026-09-16T14:00:00.000Z');
  });
});

describe('rejectionSection', () => {
  it('lists codes with counts and points at the per-tenant query', () => {
    const s = rejectionSection(summarizeRejections([{ code: 'FK_PRODUCT_MISSING', n: 3 }]));
    assert.equal(s.title, 'Rechazos de sincronización (24 h): 3');
    assert.deepEqual(s.lines, ['FK_PRODUCT_MISSING: 3']);
    assert.match(s.note ?? '', /unresolved-rejections\.sql/);
  });

  it('says so when there are none, without a note', () => {
    const s = rejectionSection(summarizeRejections([]));
    assert.equal(s.title, 'Rechazos de sincronización (24 h): 0');
    assert.deepEqual(s.lines, []);
    assert.equal(s.note, undefined);
    assert.match(s.empty, /Ningún rechazo/);
  });

  it('caps the list and counts the rest', () => {
    const rows = Array.from({ length: REJECTION_CODE_CAP + 3 }, (_, i) => ({
      code: `C${String(i).padStart(2, '0')}`,
      n: 1,
    }));
    const s = rejectionSection(summarizeRejections(rows));
    assert.equal(s.lines.length, REJECTION_CODE_CAP + 1);
    assert.equal(s.lines.at(-1), 'y 3 códigos más');
  });

  it('marks an unreadable source as unavailable, not as zero', () => {
    const s = rejectionSection(REJECTIONS_UNAVAILABLE);
    assert.equal(s.title, 'Rechazos de sincronización (24 h)');
    assert.match(s.empty, /No disponible/);
  });
});
