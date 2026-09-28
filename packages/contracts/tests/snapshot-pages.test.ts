import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  MAX_SNAPSHOT_PAGE_ROWS,
  SnapshotInfoSchema,
  snapshotPagesEstimate,
} from '../src/snapshot.js';

/** DS-10: the first snapshot page says roughly how many pages follow, for «3 de 7». */
describe('snapshot pages estimate (DS-10)', () => {
  it('is the rows over the row budget, rounded up', () => {
    assert.equal(snapshotPagesEstimate(MAX_SNAPSHOT_PAGE_ROWS), 1);
    assert.equal(snapshotPagesEstimate(MAX_SNAPSHOT_PAGE_ROWS + 1), 2);
    assert.equal(snapshotPagesEstimate(34_000), 7);
    assert.equal(snapshotPagesEstimate(15, 7), 3);
  });

  it('never says zero pages, even for an empty business or a zero budget', () => {
    assert.equal(snapshotPagesEstimate(0), 1);
    assert.equal(snapshotPagesEstimate(10, 0), 10);
  });

  it('is optional on the wire, and refuses zero, fractions and negatives', () => {
    const base = {
      cutoff: '2026-05-12T00:00:00.000Z',
      first: true,
      next: null,
      stockBaseline: [],
    };
    assert.equal(SnapshotInfoSchema.parse(base).pages, undefined, 'an older server');
    assert.equal(SnapshotInfoSchema.parse({ ...base, pages: 7 }).pages, 7);
    for (const pages of [0, 1.5, -2]) {
      assert.equal(SnapshotInfoSchema.safeParse({ ...base, pages }).success, false, String(pages));
    }
  });
});
