/**
 * checkObservabilityHealth tests.
 */

import { describe, it, expect } from 'vitest';
import { checkObservabilityHealth } from '../src/health-check.js';
import type { SqliteDatabase } from '../src/sqlite-log-store-sql.js';

function createMockDb(
  overrides: Partial<{
    tableExists: boolean;
    rowCount: number;
    oldest: string | null;
    newest: string | null;
    writeSucceeds: boolean;
    sizeBytes: number | null;
    throwOnTableCheck: boolean;
  }> = {},
): SqliteDatabase {
  const opts = {
    tableExists: true,
    rowCount: 10,
    oldest: '2026-05-01T00:00:00.000Z',
    newest: '2026-05-16T14:00:00.000Z',
    writeSucceeds: true,
    sizeBytes: 4096,
    throwOnTableCheck: false,
    ...overrides,
  };

  return {
    async execAsync(): Promise<void> {},
    async runAsync(sql: string): Promise<void> {
      if (sql.includes('INSERT') && !opts.writeSucceeds) {
        throw new Error('DB write failed');
      }
    },
    async getAllAsync<T>(): Promise<T[]> {
      return [] as T[];
    },
    async getFirstAsync<T>(sql: string): Promise<T | null> {
      if (opts.throwOnTableCheck && sql.includes('sqlite_master')) {
        throw new Error('DB error');
      }
      const hit = FIRST_ROW_RESOLVERS.find(([needle]) => sql.includes(needle));
      return hit ? (hit[1](opts) as T | null) : null;
    },
  };
}

/** `getFirstAsync` mock: first matching SQL fragment wins (order matters). */
const FIRST_ROW_RESOLVERS: ReadonlyArray<[string, (o: MockOpts) => unknown]> = [
  ['sqlite_master', (o) => ({ cnt: o.tableExists ? 1 : 0 })],
  ['COUNT(*)', (o) => ({ cnt: o.rowCount })],
  ['ORDER BY timestamp ASC', (o) => (o.oldest ? { timestamp: o.oldest } : null)],
  ['ORDER BY timestamp DESC', (o) => (o.newest ? { timestamp: o.newest } : null)],
  ['page_count', (o) => (o.sizeBytes ? { page_count: o.sizeBytes / 4096 } : null)],
  ['page_size', (o) => (o.sizeBytes ? { page_size: 4096 } : null)],
];

describe('checkObservabilityHealth', () => {
  it('returns healthy when table exists and write succeeds', async () => {
    const db = createMockDb();
    const result = await checkObservabilityHealth(db);

    expect(result.status).toBe('healthy');
    expect(result.tableExists).toBe(true);
    expect(result.rowCount).toBe(10);
    expect(result.oldestEntry).toBe('2026-05-01T00:00:00.000Z');
    expect(result.newestEntry).toBe('2026-05-16T14:00:00.000Z');
    expect(result.lastWriteSucceeded).toBe(true);
  });

  it('returns broken when table does not exist', async () => {
    const db = createMockDb({ tableExists: false });
    const result = await checkObservabilityHealth(db);

    expect(result.status).toBe('broken');
    expect(result.tableExists).toBe(false);
    expect(result.rowCount).toBe(0);
  });

  it('returns broken when sqlite_master query throws', async () => {
    const db = createMockDb({ throwOnTableCheck: true });
    const result = await checkObservabilityHealth(db);

    expect(result.status).toBe('broken');
    expect(result.tableExists).toBe(false);
  });

  it('returns degraded when write fails', async () => {
    const db = createMockDb({ writeSucceeds: false });
    const result = await checkObservabilityHealth(db);

    expect(result.status).toBe('degraded');
    expect(result.lastWriteSucceeded).toBe(false);
  });

  it('reports dbSizeBytes from PRAGMA page_count × page_size', async () => {
    const db = createMockDb({ sizeBytes: 8192 });
    const result = await checkObservabilityHealth(db);

    expect(result.dbSizeBytes).toBe(8192);
  });

  it('reports null dbSizeBytes when PRAGMA fails', async () => {
    const db = createMockDb({ sizeBytes: null });
    const result = await checkObservabilityHealth(db);

    expect(result.dbSizeBytes).toBeNull();
  });
});
