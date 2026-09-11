/**
 * Sync Stream descriptor tests — role-aware filtering (ADR-035).
 */

import { describe, expect, it } from 'vitest';
import { STREAMS, streamsForRole } from '../src/streams/index.js';

describe('Sync Streams', () => {
  it('Operativo receives the 90-day window on transactional tables', () => {
    const streams = streamsForRole('Operativo');
    const sales = streams.find((s) => s.id === 'stream_sales_recent');
    expect(sales?.filter).toMatch(/fecha >= /);
    expect(streams.find((s) => s.id === 'stream_sales_all')).toBeUndefined();
  });

  it('Director receives the full-row streams', () => {
    const streams = streamsForRole('Director');
    expect(streams.some((s) => s.id === 'stream_sales_all' && s.filter === null)).toBe(true);
    expect(streams.some((s) => s.id === 'stream_employees' && s.filter === null)).toBe(true);
  });

  it('Director does NOT receive the _recent variants (to avoid double-sync)', () => {
    const streams = streamsForRole('Director');
    expect(streams.find((s) => s.id === 'stream_sales_recent')).toBeUndefined();
  });

  it('every stream has a non-empty id and references a synced table', () => {
    for (const s of STREAMS) {
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.table).toBe('string');
    }
  });
});
