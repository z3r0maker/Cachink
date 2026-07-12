/**
 * verifyAuditChain tests.
 */

import { describe, it, expect } from 'vitest';
import { verifyAuditChain } from '../src/verify-audit-chain.js';
import type { SqliteDatabase } from '../src/sqlite-log-store-sql.js';

function createMockDb(
  rows: Array<{ id: string; prev_hash: string | null; timestamp: string }>,
): SqliteDatabase {
  return {
    async execAsync(): Promise<void> {},
    async runAsync(): Promise<void> {},
    async getAllAsync<T>(): Promise<T[]> {
      return rows as T[];
    },
    async getFirstAsync<T>(): Promise<T | null> {
      return null;
    },
  };
}

describe('verifyAuditChain', () => {
  it('returns valid=true and totalRows count for unchained entries', async () => {
    const db = createMockDb([
      { id: 'a1', prev_hash: null, timestamp: '2026-05-16T14:00:00.000Z' },
      { id: 'a2', prev_hash: null, timestamp: '2026-05-16T14:01:00.000Z' },
    ]);

    const result = await verifyAuditChain(db);
    expect(result.valid).toBe(true);
    expect(result.totalRows).toBe(2);
    expect(result.chainedRows).toBe(0);
  });

  it('returns valid=true for empty audit log', async () => {
    const db = createMockDb([]);
    const result = await verifyAuditChain(db);
    expect(result.valid).toBe(true);
    expect(result.totalRows).toBe(0);
    expect(result.chainedRows).toBe(0);
  });

  it('returns valid=true with chained rows when prev_hash is present', async () => {
    const db = createMockDb([
      { id: 'a1', prev_hash: null, timestamp: '2026-05-16T14:00:00.000Z' },
      { id: 'a2', prev_hash: 'hash_a1', timestamp: '2026-05-16T14:01:00.000Z' },
      { id: 'a3', prev_hash: 'hash_a2', timestamp: '2026-05-16T14:02:00.000Z' },
    ]);

    const result = await verifyAuditChain(db);
    expect(result.valid).toBe(true);
    expect(result.totalRows).toBe(3);
    expect(result.chainedRows).toBe(2);
  });
});
