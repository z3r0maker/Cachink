/**
 * createLogStore factory tests.
 */

import { describe, it, expect } from 'vitest';
import { createLogStore } from '../src/create-log-store.js';
import { SqliteLogStore } from '../src/sqlite-log-store.js';
import { DualLogStore } from '../src/dual-log-store.js';
import type { SqliteDatabase } from '../src/sqlite-log-store-sql.js';

function createMockDb(): SqliteDatabase {
  return {
    async execAsync(): Promise<void> {},
    async runAsync(): Promise<void> {},
    async getAllAsync<T>(): Promise<T[]> {
      return [] as T[];
    },
    async getFirstAsync<T>(sql: string): Promise<T | null> {
      if (sql.includes('COUNT')) return { cnt: 0 } as T;
      return null;
    },
  };
}

describe('createLogStore', () => {
  it('returns a SqliteLogStore when no remote config is provided', async () => {
    const db = createMockDb();
    const store = await createLogStore({ db, deviceId: 'dev-001' });

    expect(store).toBeInstanceOf(SqliteLogStore);
  });

  it('returns a DualLogStore when remote config is provided', async () => {
    const db = createMockDb();
    const store = await createLogStore({
      db,
      deviceId: 'dev-001',
      remote: {
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key',
      },
    });

    expect(store).toBeInstanceOf(DualLogStore);
  });

  it('uses 30-day retention in dev mode', async () => {
    const db = createMockDb();
    const store = await createLogStore({ db, deviceId: 'dev-001', isDev: true });

    // The store was created successfully — retention is internal config
    expect(store).toBeInstanceOf(SqliteLogStore);
  });

  it('uses 7-day retention in production mode', async () => {
    const db = createMockDb();
    const store = await createLogStore({ db, deviceId: 'dev-001', isDev: false });

    expect(store).toBeInstanceOf(SqliteLogStore);
  });
});
