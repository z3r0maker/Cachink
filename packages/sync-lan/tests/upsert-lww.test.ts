/**
 * buildUpsertLww + rowsAffectedFrom edge-case tests.
 */

import { describe, expect, it } from 'vitest';
import { buildUpsertLww, rowsAffectedFrom } from '../src/client/upsert-lww.js';

describe('buildUpsertLww', () => {
  it('throws on empty row', () => {
    expect(() => buildUpsertLww('sales', {})).toThrow('empty row');
  });

  it('produces SQL for a valid row', () => {
    const result = buildUpsertLww('sales', {
      id: 'abc',
      concepto: 'Taco',
      updated_at: '2026-05-09T00:00:00Z',
      device_id: 'dev1',
    });
    expect(result).toBeDefined();
  });
});

describe('rowsAffectedFrom', () => {
  it('returns 0 for null/undefined', () => {
    expect(rowsAffectedFrom(null)).toBe(0);
    expect(rowsAffectedFrom(undefined)).toBe(0);
  });

  it('returns 0 for non-object', () => {
    expect(rowsAffectedFrom('string')).toBe(0);
    expect(rowsAffectedFrom(42)).toBe(0);
  });

  it('reads the "changes" property', () => {
    expect(rowsAffectedFrom({ changes: 3 })).toBe(3);
  });

  it('reads the "rowsAffected" property', () => {
    expect(rowsAffectedFrom({ rowsAffected: 1 })).toBe(1);
  });

  it('reads the "changed" property', () => {
    expect(rowsAffectedFrom({ changed: 2 })).toBe(2);
  });

  it('returns 0 when all candidates are non-numeric', () => {
    expect(rowsAffectedFrom({ changes: 'yes', rowsAffected: true })).toBe(0);
  });

  it('returns 0 for empty object', () => {
    expect(rowsAffectedFrom({})).toBe(0);
  });
});
