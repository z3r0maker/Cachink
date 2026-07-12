/**
 * logMigrationEvent tests.
 */

import { describe, it, expect } from 'vitest';
import { logMigrationEvent } from '../src/log-migration-event.js';
import type { SqliteDatabase } from '../src/sqlite-log-store-sql.js';

function createMockDb(opts: {
  shouldThrowOnExec?: boolean;
  shouldThrowOnRun?: boolean;
} = {}): SqliteDatabase & { inserts: unknown[][] } {
  const inserts: unknown[][] = [];
  return {
    inserts,
    async execAsync(): Promise<void> {
      if (opts.shouldThrowOnExec) throw new Error('Exec failed');
    },
    async runAsync(_sql: string, params: unknown[]): Promise<void> {
      if (opts.shouldThrowOnRun) throw new Error('Run failed');
      inserts.push(params);
    },
    async getAllAsync<T>(): Promise<T[]> {
      return [] as T[];
    },
    async getFirstAsync<T>(): Promise<T | null> {
      return null;
    },
  };
}

describe('logMigrationEvent', () => {
  it('creates table and inserts a success event', async () => {
    const db = createMockDb();
    await logMigrationEvent(db, 'success', 'dev-001', {
      fromVersion: 5,
      toVersion: 8,
      migrationCount: 3,
    });

    expect(db.inserts).toHaveLength(1);
    const params = db.inserts[0]!;
    // params: id, timestamp, deviceId, status, metadata
    expect(params[2]).toBe('dev-001');
    expect(params[3]).toBe('success');
    const meta = JSON.parse(params[4] as string);
    expect(meta.fromVersion).toBe(5);
    expect(meta.toVersion).toBe(8);
    expect(meta.migrationCount).toBe(3);
  });

  it('inserts an error event with error metadata', async () => {
    const db = createMockDb();
    await logMigrationEvent(db, 'error', 'dev-002', {
      error: 'Column already exists',
    });

    expect(db.inserts).toHaveLength(1);
    const params = db.inserts[0]!;
    expect(params[3]).toBe('error');
    const meta = JSON.parse(params[4] as string);
    expect(meta.error).toBe('Column already exists');
  });

  it('silently swallows exec errors', async () => {
    const db = createMockDb({ shouldThrowOnExec: true });
    // Should NOT throw
    await logMigrationEvent(db, 'success', 'dev-001', {});
    expect(db.inserts).toHaveLength(0);
  });

  it('silently swallows run errors', async () => {
    const db = createMockDb({ shouldThrowOnRun: true });
    // Should NOT throw
    await logMigrationEvent(db, 'success', 'dev-001', {});
    expect(db.inserts).toHaveLength(0);
  });
});
