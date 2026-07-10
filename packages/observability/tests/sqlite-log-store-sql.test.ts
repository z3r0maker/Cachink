/**
 * sqlite-log-store-sql tests — SQL builder helpers and query functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildQuery,
  countByType,
  lastErrorTimestamp,
  groupBy,
  TABLE,
  CREATE_TABLE_SQL,
  ADD_DURATION_MS_SQL,
  CREATE_INDEXES_SQL,
  type SqliteDatabase,
} from '../src/sqlite-log-store-sql.js';

// ─── In-memory mock ────────────────────────────────────────────────

type Row = Record<string, unknown>;

class MockDb implements SqliteDatabase {
  rows: Row[] = [];

  async execAsync(): Promise<void> {}

  async runAsync(): Promise<void> {}

  async getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]> {
    // Simple groupBy simulation
    if (sql.includes('GROUP BY')) {
      const colMatch = sql.match(/SELECT (\w+),\s*COUNT/);
      const col = colMatch?.[1] ?? '';
      const typeMatch = sql.match(/type = '(\w+)'/);
      const type = typeMatch?.[1];
      let filtered = this.rows;
      if (type) filtered = filtered.filter((r) => r.type === type);
      if (params?.[0]) {
        filtered = filtered.filter((r) => (r.timestamp as string) >= (params[0] as string));
      }
      const groups: Record<string, number> = {};
      for (const row of filtered) {
        const key = row[col] as string;
        if (key) groups[key] = (groups[key] ?? 0) + 1;
      }
      return Object.entries(groups).map(([k, v]) => ({
        [col]: k,
        cnt: v,
      })) as T[];
    }
    return [] as T[];
  }

  async getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null> {
    if (sql.includes('COUNT')) {
      const typeMatch = sql.match(/type = '(\w+)'/);
      const type = typeMatch?.[1];
      let filtered = this.rows;
      if (type) filtered = filtered.filter((r) => r.type === type);
      if (params?.[0]) {
        filtered = filtered.filter((r) => (r.timestamp as string) >= (params[0] as string));
      }
      return { cnt: filtered.length } as T;
    }
    if (sql.includes('ORDER BY timestamp DESC LIMIT 1')) {
      const filtered = this.rows
        .filter((r) => r.type === 'error')
        .filter((r) => !params?.[0] || (r.timestamp as string) >= (params[0] as string))
        .sort((a, b) => (b.timestamp as string).localeCompare(a.timestamp as string));
      if (filtered.length === 0) return null;
      return { timestamp: filtered[0]!.timestamp } as T;
    }
    return null;
  }
}

// ─── buildQuery Tests ──────────────────────────────────────────────

describe('buildQuery', () => {
  it('builds query for audit type', () => {
    const { sql, params } = buildQuery('audit', {});
    expect(sql).toContain('type = ?');
    expect(sql).toContain('ORDER BY timestamp DESC');
    expect(params).toContain('audit');
  });

  it('builds query for error type', () => {
    const { sql, params } = buildQuery('error', { limit: 10 });
    expect(params).toContain('error');
    expect(params).toContain(10);
  });

  it('builds query for null type (timeline)', () => {
    const { sql, params } = buildQuery(null, {});
    expect(sql).not.toContain('type = ?');
    // Should still have a limit param
    expect(params).toContain(200); // default limit
  });

  it('adds since filter', () => {
    const { sql, params } = buildQuery('audit', { since: '2026-01-01T00:00:00Z' });
    expect(sql).toContain('timestamp >= ?');
    expect(params).toContain('2026-01-01T00:00:00Z');
  });

  it('adds operation filter', () => {
    const { sql, params } = buildQuery('audit', { operation: 'venta.registrar' });
    expect(sql).toContain('operation = ?');
    expect(params).toContain('venta.registrar');
  });

  it('adds source filter', () => {
    const { sql, params } = buildQuery('error', { source: 'ui' });
    expect(sql).toContain('source = ?');
    expect(params).toContain('ui');
  });

  it('combines multiple filters', () => {
    const { sql, params } = buildQuery('audit', {
      since: '2026-01-01',
      operation: 'caja.abrir',
      limit: 5,
    });
    expect(sql).toContain('type = ?');
    expect(sql).toContain('timestamp >= ?');
    expect(sql).toContain('operation = ?');
    expect(params).toHaveLength(4); // type, since, operation, limit
  });

  it('uses default limit of 200', () => {
    const { params } = buildQuery('audit', {});
    expect(params[params.length - 1]).toBe(200);
  });
});

// ─── SQL constant exports ──────────────────────────────────────────

describe('SQL constants', () => {
  it('TABLE is __cachink_observability_log', () => {
    expect(TABLE).toBe('__cachink_observability_log');
  });

  it('CREATE_TABLE_SQL creates the table', () => {
    expect(CREATE_TABLE_SQL).toContain('CREATE TABLE IF NOT EXISTS');
    expect(CREATE_TABLE_SQL).toContain(TABLE);
  });

  it('ADD_DURATION_MS_SQL alters the table', () => {
    expect(ADD_DURATION_MS_SQL).toContain('ALTER TABLE');
    expect(ADD_DURATION_MS_SQL).toContain('duration_ms');
  });

  it('CREATE_INDEXES_SQL creates indexes', () => {
    expect(CREATE_INDEXES_SQL).toContain('CREATE INDEX IF NOT EXISTS');
  });
});

// ─── countByType, lastErrorTimestamp, groupBy ──────────────────────

describe('countByType', () => {
  let db: MockDb;

  beforeEach(() => {
    db = new MockDb();
  });

  it('counts audit rows since timestamp', async () => {
    db.rows = [
      { type: 'audit', timestamp: '2026-05-16T14:00:00.000Z' },
      { type: 'error', timestamp: '2026-05-16T14:01:00.000Z' },
      { type: 'audit', timestamp: '2026-05-16T14:02:00.000Z' },
    ];
    const count = await countByType(db, 'audit', '2026-01-01T00:00:00.000Z');
    expect(count).toBe(2);
  });

  it('returns 0 for empty results', async () => {
    db.rows = [];
    const count = await countByType(db, 'audit', '2026-01-01T00:00:00.000Z');
    expect(count).toBe(0);
  });
});

describe('lastErrorTimestamp', () => {
  let db: MockDb;

  beforeEach(() => {
    db = new MockDb();
  });

  it('returns the most recent error timestamp', async () => {
    db.rows = [
      { type: 'error', timestamp: '2026-05-16T14:00:00.000Z' },
      { type: 'error', timestamp: '2026-05-16T14:05:00.000Z' },
    ];
    const ts = await lastErrorTimestamp(db, '2026-01-01T00:00:00.000Z');
    expect(ts).toBe('2026-05-16T14:05:00.000Z');
  });

  it('returns null when no errors', async () => {
    db.rows = [];
    const ts = await lastErrorTimestamp(db, '2026-01-01T00:00:00.000Z');
    expect(ts).toBeNull();
  });
});

describe('groupBy', () => {
  let db: MockDb;

  beforeEach(() => {
    db = new MockDb();
  });

  it('groups error counts by source', async () => {
    db.rows = [
      { type: 'error', source: 'ui', timestamp: '2026-05-16T14:00:00.000Z' },
      { type: 'error', source: 'ui', timestamp: '2026-05-16T14:01:00.000Z' },
      { type: 'error', source: 'sync', timestamp: '2026-05-16T14:02:00.000Z' },
    ];
    const result = await groupBy(db, 'source', 'error', '2026-01-01T00:00:00.000Z');
    expect(result).toEqual({ ui: 2, sync: 1 });
  });

  it('groups audit counts by operation', async () => {
    db.rows = [
      { type: 'audit', operation: 'venta.registrar', timestamp: '2026-05-16T14:00:00.000Z' },
      { type: 'audit', operation: 'venta.registrar', timestamp: '2026-05-16T14:01:00.000Z' },
      { type: 'audit', operation: 'caja.abrir', timestamp: '2026-05-16T14:02:00.000Z' },
    ];
    const result = await groupBy(db, 'operation', 'audit', '2026-01-01T00:00:00.000Z');
    expect(result).toEqual({ 'venta.registrar': 2, 'caja.abrir': 1 });
  });
});
