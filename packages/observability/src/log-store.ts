/**
 * LogStore — abstract interface for reading/writing observability entries.
 *
 * One implementation ships: `SqliteLogStore`, which writes to the
 * `__xangarro_observability_log` table on the device. The log is local; the
 * remote copy was retired with the `bug-report` edge function (N-81, ADR-141).
 *
 * The interface is kept small: write + query + prune + export. Consumers
 * (UI, error handlers, AuditedUseCase) code against this interface only.
 */

import type { AuditEvent } from './audit-event.js';
import type { ErrorLogEntry } from './error-log.js';
import type { LogStats } from './log-stats.js';

/** Query options shared across audit + error queries. */
export interface LogQueryOptions {
  readonly since?: string;
  readonly limit?: number;
  readonly operation?: string;
  readonly source?: string;
}

/** Combined timeline entry — discriminated by `type` field. */
export type TimelineEntry =
  | (AuditEvent & { readonly type: 'audit' })
  | (ErrorLogEntry & { readonly type: 'error' });

/** Snapshot for bug report export. */
export interface LogSnapshot {
  readonly exportedAt: string;
  readonly deviceId: string;
  readonly auditEvents: readonly AuditEvent[];
  readonly errors: readonly ErrorLogEntry[];
}

export interface LogStore {
  /** Persist an audit event (success or error). */
  writeAudit(event: AuditEvent): Promise<void>;

  /** Persist a structured error entry. */
  writeError(entry: ErrorLogEntry): Promise<void>;

  /** Query audit events with optional filters. */
  queryAudit(opts: LogQueryOptions): Promise<readonly AuditEvent[]>;

  /** Query error entries with optional filters. */
  queryErrors(opts: LogQueryOptions): Promise<readonly ErrorLogEntry[]>;

  /** Combined timeline for the Telemetría screen. */
  queryTimeline(opts: LogQueryOptions): Promise<readonly TimelineEntry[]>;

  /** Aggregate stats for the dashboard header. */
  stats(since: string): Promise<LogStats>;

  /** Remove entries older than `olderThanDays`. Returns rows deleted. */
  prune(olderThanDays: number): Promise<number>;

  /** Export a snapshot for bug reports. */
  exportSnapshot(opts: {
    readonly auditLimit?: number;
    readonly errorLimit?: number;
  }): Promise<LogSnapshot>;

  /** Error entries not yet marked shipped. Nothing ships them since N-81; kept with the column. */
  queryUnshippedErrors?(limit?: number): Promise<readonly ErrorLogEntry[]>;

  /** Mark error entries as shipped (by IDs). */
  markShipped?(ids: readonly string[]): Promise<void>;
}
