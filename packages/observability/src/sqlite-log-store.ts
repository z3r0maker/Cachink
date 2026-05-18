/**
 * SqliteLogStore — local SQLite implementation of LogStore.
 *
 * Writes to `__cachink_observability_log` table. This table is local-only
 * (never synced) and uses a ring-buffer strategy: entries older than the
 * configured retention period are pruned on app startup.
 */

import { ulid } from 'ulid';
import type { AuditEvent } from './audit-event.js';
import type { ErrorLogEntry } from './error-log.js';
import type { LogStats } from './log-stats.js';
import type { LogStore, LogQueryOptions, LogSnapshot, TimelineEntry } from './log-store.js';
import { rowToAuditEvent, rowToErrorEntry, rowToTimelineEntry, type RawRow } from './row-mappers.js';

/** Minimal SQLite database interface (expo-sqlite + better-sqlite3 compatible). */
export interface SqliteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: unknown[]): Promise<void>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

/** Optional callback to archive pruned entries before deletion. */
export type ArchiveFn = (jsonData: string, filename: string) => Promise<void>;

/** Config for SqliteLogStore. */
export interface SqliteLogStoreConfig {
  readonly deviceId: string;
  readonly retentionDays?: number;
  /** Optional archive function — called before prune deletes entries. */
  readonly archiveFn?: ArchiveFn;
  /** Dedup window in milliseconds (default 5000). Identical errors within this window are suppressed. */
  readonly dedupWindowMs?: number;
}

const TABLE = '__cachink_observability_log';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${TABLE} (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('audit', 'error')),
  timestamp TEXT NOT NULL,
  operation TEXT,
  entity_type TEXT,
  entity_id TEXT,
  user_id TEXT,
  device_id TEXT NOT NULL,
  business_id TEXT,
  status TEXT CHECK (status IN ('success', 'error', NULL)),
  error_name TEXT,
  error_message TEXT,
  error_stack TEXT,
  source TEXT,
  metadata TEXT,
  context TEXT,
  duration_ms INTEGER
);`;

/** Idempotent ALTER TABLE for the duration_ms column added in Phase 4. */
const ADD_DURATION_MS_SQL = `
ALTER TABLE ${TABLE} ADD COLUMN duration_ms INTEGER;
`;

const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_obs_log_type_ts ON ${TABLE}(type, timestamp);
CREATE INDEX IF NOT EXISTS idx_obs_log_operation ON ${TABLE}(operation);`;

/** In-memory dedup tracking entry. */
interface DedupEntry {
  count: number;
  firstAt: number;
}

const DEFAULT_DEDUP_WINDOW_MS = 5_000;

export class SqliteLogStore implements LogStore {
  readonly #db: SqliteDatabase;
  readonly #deviceId: string;
  readonly #retentionDays: number;
  readonly #archiveFn: ArchiveFn | undefined;
  readonly #dedupWindowMs: number;
  readonly #recentErrors = new Map<string, DedupEntry>();

  constructor(db: SqliteDatabase, config: SqliteLogStoreConfig) {
    this.#db = db;
    this.#deviceId = config.deviceId;
    this.#retentionDays = config.retentionDays ?? 30;
    this.#archiveFn = config.archiveFn;
    this.#dedupWindowMs = config.dedupWindowMs ?? DEFAULT_DEDUP_WINDOW_MS;
  }

  /** Initialize the table and indexes. Call once at app startup. */
  async initialize(): Promise<void> {
    await this.#db.execAsync(CREATE_TABLE_SQL);
    await this.#db.execAsync(CREATE_INDEXES_SQL);

    // Phase 4: Add duration_ms column if table already existed
    try {
      await this.#db.execAsync(ADD_DURATION_MS_SQL);
    } catch {
      // Column already exists — safe to ignore
    }
  }

  async writeAudit(event: AuditEvent): Promise<void> {
    const id = event.id || ulid();
    await this.#db.runAsync(
      `INSERT OR REPLACE INTO ${TABLE}
       (id, type, timestamp, operation, entity_type, entity_id,
        user_id, device_id, business_id, status, error_name,
        error_message, metadata, duration_ms)
       VALUES (?, 'audit', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, event.timestamp, event.operation, event.entityType,
        event.entityId, event.userId, event.deviceId, event.businessId,
        event.status, event.errorCode ?? null, event.errorMessage ?? null,
        event.metadata ? JSON.stringify(event.metadata) : null,
        event.durationMs ?? null,
      ],
    );
  }

  async writeError(entry: ErrorLogEntry): Promise<void> {
    // Phase 14: Dedup window — suppress duplicate errors within the window
    const dedupKey = `${entry.source}:${entry.errorName}:${entry.errorMessage}`;
    const now = Date.now();
    const recent = this.#recentErrors.get(dedupKey);

    if (recent && now - recent.firstAt < this.#dedupWindowMs) {
      recent.count++;
      return; // Suppress duplicate
    }

    // Clean stale entries from the dedup map
    for (const [key, val] of this.#recentErrors) {
      if (now - val.firstAt >= this.#dedupWindowMs) {
        this.#recentErrors.delete(key);
      }
    }

    this.#recentErrors.set(dedupKey, { count: 1, firstAt: now });

    const id = entry.id || ulid();
    const contextWithDedup = recent?.count && recent.count > 1
      ? { ...entry.context, suppressedCount: recent.count }
      : entry.context;

    await this.#db.runAsync(
      `INSERT OR REPLACE INTO ${TABLE}
       (id, type, timestamp, operation, source, error_name,
        error_message, error_stack, user_id, device_id,
        business_id, context)
       VALUES (?, 'error', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, entry.timestamp, entry.operation ?? null, entry.source,
        entry.errorName, entry.errorMessage, entry.errorStack ?? null,
        entry.userId, entry.deviceId, entry.businessId,
        contextWithDedup ? JSON.stringify(contextWithDedup) : null,
      ],
    );
  }

  async queryAudit(opts: LogQueryOptions): Promise<readonly AuditEvent[]> {
    const { sql, params } = buildQuery('audit', opts);
    const rows = await this.#db.getAllAsync<RawRow>(sql, params);
    return rows.map(rowToAuditEvent);
  }

  async queryErrors(opts: LogQueryOptions): Promise<readonly ErrorLogEntry[]> {
    const { sql, params } = buildQuery('error', opts);
    const rows = await this.#db.getAllAsync<RawRow>(sql, params);
    return rows.map(rowToErrorEntry);
  }

  async queryTimeline(opts: LogQueryOptions): Promise<readonly TimelineEntry[]> {
    const { sql, params } = buildQuery(null, opts);
    const rows = await this.#db.getAllAsync<RawRow>(sql, params);
    return rows.map(rowToTimelineEntry);
  }

  async stats(since: string): Promise<LogStats> {
    const [auditCount, errorCount, lastError, errorsBySourceRows, operationRows] =
      await Promise.all([
        this.#db.getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM ${TABLE} WHERE type = 'audit' AND timestamp >= ?`,
          [since],
        ),
        this.#db.getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM ${TABLE} WHERE type = 'error' AND timestamp >= ?`,
          [since],
        ),
        this.#db.getFirstAsync<{ timestamp: string }>(
          `SELECT timestamp FROM ${TABLE} WHERE type = 'error' AND timestamp >= ? ORDER BY timestamp DESC LIMIT 1`,
          [since],
        ),
        this.#db.getAllAsync<{ source: string; cnt: number }>(
          `SELECT source, COUNT(*) as cnt FROM ${TABLE} WHERE type = 'error' AND timestamp >= ? GROUP BY source`,
          [since],
        ),
        this.#db.getAllAsync<{ operation: string; cnt: number }>(
          `SELECT operation, COUNT(*) as cnt FROM ${TABLE} WHERE type = 'audit' AND timestamp >= ? GROUP BY operation`,
          [since],
        ),
      ]);

    const errorsBySource: Record<string, number> = {};
    for (const row of errorsBySourceRows) {
      if (row.source) errorsBySource[row.source] = row.cnt;
    }
    const operationCounts: Record<string, number> = {};
    for (const row of operationRows) {
      if (row.operation) operationCounts[row.operation] = row.cnt;
    }

    return {
      totalAuditEvents: auditCount?.cnt ?? 0,
      totalErrors: errorCount?.cnt ?? 0,
      errorsBySource,
      operationCounts,
      lastErrorAt: lastError?.timestamp ?? null,
    };
  }

  async prune(olderThanDays?: number): Promise<number> {
    const days = olderThanDays ?? this.#retentionDays;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const result = await this.#db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM ${TABLE} WHERE timestamp < ?`,
      [cutoff],
    );
    const count = result?.cnt ?? 0;

    // Phase 11: Archive entries before deletion (if archive function provided)
    if (count > 0 && this.#archiveFn) {
      try {
        const entries = await this.queryTimeline({ since: '1970-01-01', limit: 10_000 });
        const toArchive = entries.filter((e) => e.timestamp < cutoff);
        if (toArchive.length > 0) {
          const archive = JSON.stringify(toArchive);
          const filename = `obs-archive-${Date.now()}.json`;
          await this.#archiveFn(archive, filename);
        }
      } catch {
        // Archive failure must not block pruning
      }
    }

    await this.#db.runAsync(`DELETE FROM ${TABLE} WHERE timestamp < ?`, [cutoff]);
    return count;
  }

  async exportSnapshot(opts: {
    readonly auditLimit?: number;
    readonly errorLimit?: number;
  }): Promise<LogSnapshot> {
    const [auditEvents, errors] = await Promise.all([
      this.queryAudit({ limit: opts.auditLimit ?? 50 }),
      this.queryErrors({ limit: opts.errorLimit ?? 20 }),
    ]);
    return { exportedAt: new Date().toISOString(), deviceId: this.#deviceId, auditEvents, errors };
  }
}

// ─── Query builder helper ───────────────────────────────────────────

function buildQuery(
  type: 'audit' | 'error' | null,
  opts: LogQueryOptions,
): { sql: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (opts.since) {
    conditions.push('timestamp >= ?');
    params.push(opts.since);
  }
  if (opts.operation) {
    conditions.push('operation = ?');
    params.push(opts.operation);
  }
  if (opts.source) {
    conditions.push('source = ?');
    params.push(opts.source);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = opts.limit ?? 200;
  params.push(limit);

  return { sql: `SELECT * FROM ${TABLE} ${where} ORDER BY timestamp DESC LIMIT ?`, params };
}
