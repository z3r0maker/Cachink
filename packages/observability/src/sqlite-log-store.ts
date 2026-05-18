import { ulid } from 'ulid';
import type { AuditEvent } from './audit-event.js';
import type { ErrorLogEntry } from './error-log.js';
import type { LogStats } from './log-stats.js';
import type { LogStore, LogQueryOptions, LogSnapshot, TimelineEntry } from './log-store.js';
import { rowToAuditEvent, rowToErrorEntry, rowToTimelineEntry, type RawRow } from './row-mappers.js';
import {
  TABLE, CREATE_TABLE_SQL, ADD_DURATION_MS_SQL, CREATE_INDEXES_SQL, buildQuery,
  type SqliteDatabase, type ArchiveFn, type SqliteLogStoreConfig,
} from './sqlite-log-store-sql.js';
export type { SqliteDatabase, ArchiveFn, SqliteLogStoreConfig } from './sqlite-log-store-sql.js';
interface DedupEntry { count: number; firstAt: number }
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

  async initialize(): Promise<void> {
    await this.#db.execAsync(CREATE_TABLE_SQL);
    await this.#db.execAsync(CREATE_INDEXES_SQL);
    try { await this.#db.execAsync(ADD_DURATION_MS_SQL); } catch { /* exists */ }
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
    const dedupKey = `${entry.source}:${entry.errorName}:${entry.errorMessage}`;
    const now = Date.now();
    const recent = this.#recentErrors.get(dedupKey);

    if (recent && now - recent.firstAt < this.#dedupWindowMs) {
      recent.count++;
      return;
    }

    this.#cleanStaleDedups(now);
    this.#recentErrors.set(dedupKey, { count: 1, firstAt: now });

    const id = entry.id || ulid();
    const ctx = this.#buildDedupContext(entry, recent);
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
        ctx ? JSON.stringify(ctx) : null,
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
    const [auditCount, errorCount, lastError, errBySrc, opRows] =
      await Promise.all([
        this.#countByType('audit', since),
        this.#countByType('error', since),
        this.#lastErrorTimestamp(since),
        this.#groupBy('source', 'error', since),
        this.#groupBy('operation', 'audit', since),
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
      `SELECT COUNT(*) as cnt FROM ${TABLE} WHERE timestamp < ?`, [cutoff],
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

  #cleanStaleDedups(now: number): void {
    for (const [key, val] of this.#recentErrors) {
      if (now - val.firstAt >= this.#dedupWindowMs) this.#recentErrors.delete(key);
    }
  }

  #buildDedupContext(
    entry: ErrorLogEntry, recent: DedupEntry | undefined,
  ): Record<string, unknown> | undefined {
    if (recent?.count && recent.count > 1) {
      return { ...entry.context, suppressedCount: recent.count };
    }
    return entry.context;
  }

  async #countByType(type: string, since: string): Promise<number> {
    const r = await this.#db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM ${TABLE} WHERE type = '${type}' AND timestamp >= ?`,
      [since],
    );
    return r?.cnt ?? 0;
  }

  async #lastErrorTimestamp(since: string): Promise<string | null> {
    const r = await this.#db.getFirstAsync<{ timestamp: string }>(
      `SELECT timestamp FROM ${TABLE} WHERE type = 'error' AND timestamp >= ? ORDER BY timestamp DESC LIMIT 1`,
      [since],
    );
    return r?.timestamp ?? null;
  }

  async #groupBy(
    col: string, type: string, since: string,
  ): Promise<Record<string, number>> {
    const rows = await this.#db.getAllAsync<Record<string, unknown>>(
      `SELECT ${col}, COUNT(*) as cnt FROM ${TABLE} WHERE type = '${type}' AND timestamp >= ? GROUP BY ${col}`,
      [since],
    );
    const result: Record<string, number> = {};
    for (const row of rows) {
      const key = row[col] as string | null;
      if (key) result[key] = row.cnt as number;
    }
    return result;
  }

  async #archivePruned(cutoff: string): Promise<void> {
    try {
      const entries = await this.queryTimeline({ since: '1970-01-01', limit: 10_000 });
      const toArchive = entries.filter((e) => e.timestamp < cutoff);
      if (toArchive.length > 0) {
        await this.#archiveFn!(JSON.stringify(toArchive), `obs-archive-${Date.now()}.json`);
      }
    } catch { /* archive failure must not block pruning */ }
  }
}
