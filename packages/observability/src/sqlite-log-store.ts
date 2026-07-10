import { ulid } from 'ulid';
import type { AuditEvent } from './audit-event.js';
import type { ErrorLogEntry } from './error-log.js';
import type { LogStats } from './log-stats.js';
import type { LogStore, LogQueryOptions, LogSnapshot, TimelineEntry } from './log-store.js';
import {
  rowToAuditEvent,
  rowToErrorEntry,
  rowToTimelineEntry,
  type RawRow,
} from './row-mappers.js';
import {
  TABLE,
  CREATE_TABLE_SQL,
  ADD_DURATION_MS_SQL,
  ADD_SHIPPED_AT_SQL,
  CREATE_INDEXES_SQL,
  buildQuery,
  countByType,
  lastErrorTimestamp,
  groupBy,
  type SqliteDatabase,
  type ArchiveFn,
  type SqliteLogStoreConfig,
} from './sqlite-log-store-sql.js';
export type { SqliteDatabase, ArchiveFn, SqliteLogStoreConfig } from './sqlite-log-store-sql.js';
interface DedupEntry {
  count: number;
  firstAt: number;
}
const DEFAULT_DEDUP_WINDOW_MS = 5_000;

function buildDedupContext(
  entry: ErrorLogEntry,
  recent: DedupEntry | undefined,
): Record<string, unknown> | undefined {
  if (recent?.count && recent.count > 1) return { ...entry.context, suppressedCount: recent.count };
  return entry.context;
}

function cleanStaleDedups(map: Map<string, DedupEntry>, windowMs: number, now: number): void {
  for (const [key, val] of map) {
    if (now - val.firstAt >= windowMs) map.delete(key);
  }
}

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

  async initialize(): Promise<void> {
    await this.#db.execAsync(CREATE_TABLE_SQL);
    await this.#db.execAsync(CREATE_INDEXES_SQL);
    try {
      await this.#db.execAsync(ADD_DURATION_MS_SQL);
    } catch {
      /* column exists */
    }
    try {
      await this.#db.execAsync(ADD_SHIPPED_AT_SQL);
    } catch {
      /* column exists */
    }
  }

  /**
   * Query unshipped error entries for the outbox flusher.
   * Returns errors that haven't been shipped to the remote backend yet.
   */
  async queryUnshippedErrors(limit: number = 50): Promise<readonly ErrorLogEntry[]> {
    const sql = `SELECT * FROM ${TABLE} WHERE type = 'error' AND shipped_at IS NULL ORDER BY timestamp ASC LIMIT ?`;
    const rows = await this.#db.getAllAsync<RawRow>(sql, [limit]);
    return rows.map(rowToErrorEntry);
  }

  /**
   * Mark error entries as shipped (by IDs).
   */
  async markShipped(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');
    await this.#db.runAsync(
      `UPDATE ${TABLE} SET shipped_at = ? WHERE id IN (${placeholders})`,
      [now, ...ids],
    );
  }

  async writeAudit(event: AuditEvent): Promise<void> {
    const id = event.id || ulid();
    const sql = `INSERT OR REPLACE INTO ${TABLE}
       (id, type, timestamp, operation, entity_type, entity_id,
        user_id, device_id, business_id, status, error_name,
        error_message, metadata, duration_ms)
       VALUES (?, 'audit', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const meta = event.metadata ? JSON.stringify(event.metadata) : null;
    await this.#db.runAsync(sql, [
      id,
      event.timestamp,
      event.operation,
      event.entityType,
      event.entityId,
      event.userId,
      event.deviceId,
      event.businessId,
      event.status,
      event.errorCode ?? null,
      event.errorMessage ?? null,
      meta,
      event.durationMs ?? null,
    ]);
  }

  async writeError(entry: ErrorLogEntry): Promise<void> {
    const dedupKey = `${entry.source}:${entry.errorName}:${entry.errorMessage}`;
    const now = Date.now();
    const recent = this.#recentErrors.get(dedupKey);
    if (recent && now - recent.firstAt < this.#dedupWindowMs) {
      recent.count++;
      return;
    }
    cleanStaleDedups(this.#recentErrors, this.#dedupWindowMs, now);
    this.#recentErrors.set(dedupKey, { count: 1, firstAt: now });

    const id = entry.id || ulid();
    const ctx = buildDedupContext(entry, recent);
    const sql = `INSERT OR REPLACE INTO ${TABLE}
       (id, type, timestamp, operation, source, error_name,
        error_message, error_stack, user_id, device_id, business_id, context)
       VALUES (?, 'error', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await this.#db.runAsync(sql, [
      id,
      entry.timestamp,
      entry.operation ?? null,
      entry.source,
      entry.errorName,
      entry.errorMessage,
      entry.errorStack ?? null,
      entry.userId,
      entry.deviceId,
      entry.businessId,
      ctx ? JSON.stringify(ctx) : null,
    ]);
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
    const [auditCount, errorCount, lastError, errBySrc, opRows] = await Promise.all([
      countByType(this.#db, 'audit', since),
      countByType(this.#db, 'error', since),
      lastErrorTimestamp(this.#db, since),
      groupBy(this.#db, 'source', 'error', since),
      groupBy(this.#db, 'operation', 'audit', since),
    ]);
    return {
      totalAuditEvents: auditCount,
      totalErrors: errorCount,
      errorsBySource: errBySrc,
      operationCounts: opRows,
      lastErrorAt: lastError,
    };
  }

  async prune(olderThanDays?: number): Promise<number> {
    const days = olderThanDays ?? this.#retentionDays;
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const result = await this.#db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM ${TABLE} WHERE timestamp < ?`,
      [cutoff],
    );
    const count = result?.cnt ?? 0;
    if (count > 0 && this.#archiveFn) await this.#archivePruned(cutoff);
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

  async #archivePruned(cutoff: string): Promise<void> {
    try {
      const entries = await this.queryTimeline({ since: '1970-01-01', limit: 10_000 });
      const toArchive = entries.filter((e) => e.timestamp < cutoff);
      if (toArchive.length > 0) {
        await this.#archiveFn!(JSON.stringify(toArchive), `obs-archive-${Date.now()}.json`);
      }
    } catch {
      /* archive failure must not block pruning */
    }
  }
}
