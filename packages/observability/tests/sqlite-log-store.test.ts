/**
 * SqliteLogStore unit tests.
 *
 * Uses an in-memory implementation of SqliteDatabase to test all
 * LogStore operations without a real SQLite binary.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SqliteLogStore, type SqliteDatabase } from '../src/sqlite-log-store.js';
import type { AuditEvent } from '../src/audit-event.js';
import type { ErrorLogEntry } from '../src/error-log.js';

// ─── In-memory SQLite mock helpers ─────────────────────────────────

type Row = Record<string, unknown>;

function applyTypeFilter(rows: Row[], sql: string, params?: unknown[]): Row[] {
  if (!sql.includes("type = ?")) return rows;
  const typeParam = params?.find((p) => p === 'audit' || p === 'error');
  return typeParam ? rows.filter((r) => r.type === typeParam) : rows;
}

function applyTimestampFilter(rows: Row[], sql: string, params?: unknown[]): Row[] {
  if (!sql.includes('timestamp >= ?') || !params) return rows;
  const tsParam = params.find((p) => typeof p === 'string' && p.includes('T') && p.includes(':'));
  return tsParam ? rows.filter((r) => (r.timestamp as string) >= (tsParam as string)) : rows;
}

function applyOperationFilter(rows: Row[], sql: string, params?: unknown[]): Row[] {
  if (!sql.includes('operation = ?') || !params) return rows;
  const opParam = params.find((p) => typeof p === 'string' && p.includes('.') && !p.includes('T'));
  return opParam ? rows.filter((r) => r.operation === opParam) : rows;
}

function applyLimit(rows: Row[], params?: unknown[]): Row[] {
  if (!params) return rows;
  const numParams = params.filter((p) => typeof p === 'number');
  const limit = numParams[numParams.length - 1] as number | undefined;
  return (limit && limit > 0) ? rows.slice(0, limit) : rows;
}

// ─── In-memory SQLite mock ──────────────────────────────────────────

class InMemorySqliteDatabase implements SqliteDatabase {
  private rows: Record<string, unknown>[] = [];
  private initialized = false;

  async execAsync(_sql: string): Promise<void> {
    this.initialized = true;
  }

  async runAsync(sql: string, params: unknown[]): Promise<void> {
    if (!this.initialized) return;
    if (sql.includes('INSERT') || sql.includes('REPLACE')) {
      const row = this.#buildRow(sql, params);
      const existing = this.rows.findIndex((r) => r.id === row.id);
      if (existing >= 0) {
        this.rows[existing] = row;
      } else {
        this.rows.push(row);
      }
    }
    if (sql.includes('DELETE')) {
      const cutoff = params[0] as string;
      this.rows = this.rows.filter((r) => (r.timestamp as string) >= cutoff);
    }
  }

  async getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]> {
    let filtered = [...this.rows];
    filtered = applyTypeFilter(filtered, sql, params);
    filtered = applyTimestampFilter(filtered, sql, params);
    filtered = applyOperationFilter(filtered, sql, params);
    filtered.sort((a, b) => (b.timestamp as string).localeCompare(a.timestamp as string));
    filtered = applyLimit(filtered, params);
    return filtered as T[];
  }

  async getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null> {
    if (sql.includes('COUNT')) {
      let filtered = [...this.rows];
      if (sql.includes("type = 'audit'")) {
        filtered = filtered.filter((r) => r.type === 'audit');
      } else if (sql.includes("type = 'error'")) {
        filtered = filtered.filter((r) => r.type === 'error');
      }
      if (params) {
        const ts = params.find((p) => typeof p === 'string' && p.includes('T'));
        if (ts) {
          if (sql.includes('timestamp <')) {
            filtered = filtered.filter((r) => (r.timestamp as string) < (ts as string));
          } else {
            filtered = filtered.filter((r) => (r.timestamp as string) >= (ts as string));
          }
        }
      }
      return { cnt: filtered.length } as T;
    }
    if (sql.includes('ORDER BY timestamp DESC LIMIT 1')) {
      const errorRows = this.rows.filter((r) => r.type === 'error');
      if (errorRows.length === 0) return null;
      errorRows.sort((a, b) => (b.timestamp as string).localeCompare(a.timestamp as string));
      return { timestamp: errorRows[0]!.timestamp } as T;
    }
    return null;
  }

  #buildRow(sql: string, params: unknown[]): Record<string, unknown> {
    // Detect type from the SQL VALUES clause: "'audit'" or "'error'"
    const isAudit = sql.includes("'audit'");
    if (isAudit) {
      // params: id, timestamp, operation, entityType, entityId, userId, deviceId, businessId, status, errorCode, errorMessage, metadata
      return {
        id: params[0],
        type: 'audit',
        timestamp: params[1],
        operation: params[2],
        entity_type: params[3],
        entity_id: params[4],
        user_id: params[5],
        device_id: params[6],
        business_id: params[7],
        status: params[8],
        error_name: params[9],
        error_message: params[10],
        metadata: params[11],
        source: null,
        error_stack: null,
        context: null,
      };
    }
    // params: id, timestamp, operation, source, errorName, errorMessage, errorStack, userId, deviceId, businessId, context
    return {
      id: params[0],
      type: 'error',
      timestamp: params[1],
      operation: params[2],
      source: params[3],
      error_name: params[4],
      error_message: params[5],
      error_stack: params[6],
      user_id: params[7],
      device_id: params[8],
      business_id: params[9],
      context: params[10],
      entity_type: null,
      entity_id: null,
      status: null,
      metadata: null,
    };
  }
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('SqliteLogStore', () => {
  let db: InMemorySqliteDatabase;
  let store: SqliteLogStore;

  beforeEach(async () => {
    db = new InMemorySqliteDatabase();
    store = new SqliteLogStore(db, { deviceId: 'dev-001', retentionDays: 7 });
    await store.initialize();
  });

  it('writeAudit persists and queryAudit retrieves', async () => {
    const event: AuditEvent = {
      id: 'evt-1',
      timestamp: '2026-05-16T14:00:00.000Z',
      operation: 'venta.registrar',
      entityType: 'sale',
      entityId: 'sale-abc',
      userId: 'usr-01',
      deviceId: 'dev-001',
      businessId: 'biz-01',
      status: 'success',
      metadata: { montoCentavos: 15000 },
    };
    await store.writeAudit(event);

    const results = await store.queryAudit({ limit: 10 });
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe('evt-1');
    expect(results[0]!.operation).toBe('venta.registrar');
    expect(results[0]!.entityType).toBe('sale');
    expect(results[0]!.status).toBe('success');
  });

  it('writeError persists and queryErrors retrieves', async () => {
    const entry: ErrorLogEntry = {
      id: 'err-1',
      timestamp: '2026-05-16T14:05:00.000Z',
      source: 'use-case',
      operation: 'egreso.registrar',
      errorName: 'ZodError',
      errorMessage: 'monto must be > 0',
      errorStack: 'at validate (zod.js:123)',
      userId: 'usr-01',
      deviceId: 'dev-001',
      businessId: 'biz-01',
      context: { inputMonto: -100 },
    };
    await store.writeError(entry);

    const results = await store.queryErrors({ limit: 10 });
    expect(results).toHaveLength(1);
    expect(results[0]!.errorName).toBe('ZodError');
    expect(results[0]!.source).toBe('use-case');
  });

  it('queryTimeline returns both audit and error entries', async () => {
    await store.writeAudit({
      id: 'evt-1',
      timestamp: '2026-05-16T14:00:00.000Z',
      operation: 'venta.registrar',
      entityType: 'sale',
      entityId: 'sale-1',
      userId: null,
      deviceId: 'dev-001',
      businessId: 'biz-01',
      status: 'success',
    });
    await store.writeError({
      id: 'err-1',
      timestamp: '2026-05-16T14:01:00.000Z',
      source: 'ui',
      errorName: 'RenderError',
      errorMessage: 'crash',
      userId: null,
      deviceId: 'dev-001',
      businessId: 'biz-01',
    });

    const timeline = await store.queryTimeline({ limit: 10 });
    expect(timeline).toHaveLength(2);
    expect(timeline[0]!.type).toBe('error'); // newer first
    expect(timeline[1]!.type).toBe('audit');
  });

  it('exportSnapshot returns capped results', async () => {
    await store.writeAudit({
      id: 'evt-1',
      timestamp: '2026-05-16T14:00:00.000Z',
      operation: 'caja.abrir',
      entityType: 'caja_turno',
      entityId: 'turno-1',
      userId: null,
      deviceId: 'dev-001',
      businessId: 'biz-01',
      status: 'success',
    });

    const snapshot = await store.exportSnapshot({ auditLimit: 5, errorLimit: 5 });
    expect(snapshot.deviceId).toBe('dev-001');
    expect(snapshot.auditEvents).toHaveLength(1);
    expect(snapshot.errors).toHaveLength(0);
    expect(snapshot.exportedAt).toBeTruthy();
  });

  it('prune removes old entries', async () => {
    const oldTimestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    await store.writeAudit({
      id: 'old-1',
      timestamp: oldTimestamp,
      operation: 'venta.registrar',
      entityType: 'sale',
      entityId: 's-old',
      userId: null,
      deviceId: 'dev-001',
      businessId: 'biz-01',
      status: 'success',
    });

    const deleted = await store.prune(7);
    expect(deleted).toBe(1);

    const remaining = await store.queryAudit({ limit: 100 });
    expect(remaining).toHaveLength(0);
  });
});
