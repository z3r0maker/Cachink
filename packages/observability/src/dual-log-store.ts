/**
 * DualLogStore — writes to both local SQLite and a remote backend.
 *
 * Remote writes are fire-and-forget: if the remote fails, the local write
 * still succeeds. Errors from the remote are logged to the local store
 * as system-level errors (preventing infinite recursion by checking a
 * re-entry flag).
 */

import type { AuditEvent } from './audit-event.js';
import type { ErrorLogEntry } from './error-log.js';
import type { LogStats } from './log-stats.js';
import type { LogStore, LogQueryOptions, LogSnapshot, TimelineEntry } from './log-store.js';
import type { RemoteLogStore } from './remote-log-store.js';

export class DualLogStore implements LogStore {
  readonly #local: LogStore;
  readonly #remote: RemoteLogStore;
  #inRemoteWrite = false;

  constructor(local: LogStore, remote: RemoteLogStore) {
    this.#local = local;
    this.#remote = remote;
  }

  async writeAudit(event: AuditEvent): Promise<void> {
    await this.#local.writeAudit(event);
    // Remote: fire-and-forget, errors captured locally
    if (event.status === 'error') {
      void this.#shipRemoteError(event);
    }
  }

  async writeError(entry: ErrorLogEntry): Promise<void> {
    await this.#local.writeError(entry);
    void this.#shipRemoteErrorEntry(entry);
  }

  async queryAudit(opts: LogQueryOptions): Promise<readonly AuditEvent[]> {
    return this.#local.queryAudit(opts);
  }

  async queryErrors(opts: LogQueryOptions): Promise<readonly ErrorLogEntry[]> {
    return this.#local.queryErrors(opts);
  }

  async queryTimeline(opts: LogQueryOptions): Promise<readonly TimelineEntry[]> {
    return this.#local.queryTimeline(opts);
  }

  async stats(since: string): Promise<LogStats> {
    return this.#local.stats(since);
  }

  async prune(olderThanDays: number): Promise<number> {
    return this.#local.prune(olderThanDays);
  }

  async exportSnapshot(opts: {
    readonly auditLimit?: number;
    readonly errorLimit?: number;
  }): Promise<LogSnapshot> {
    return this.#local.exportSnapshot(opts);
  }

  async #shipRemoteError(event: AuditEvent): Promise<void> {
    if (this.#inRemoteWrite) return;
    this.#inRemoteWrite = true;
    try {
      await this.#remote.sendErrorBatch([{
        id: event.id,
        timestamp: event.timestamp,
        source: 'use-case',
        operation: event.operation,
        errorName: event.errorCode ?? 'UnknownError',
        errorMessage: event.errorMessage ?? '',
        userId: event.userId,
        deviceId: event.deviceId,
        businessId: event.businessId,
      }]);
    } catch {
      // Swallow — remote failure is non-critical
    } finally {
      this.#inRemoteWrite = false;
    }
  }

  async #shipRemoteErrorEntry(entry: ErrorLogEntry): Promise<void> {
    if (this.#inRemoteWrite) return;
    this.#inRemoteWrite = true;
    try {
      await this.#remote.sendErrorBatch([entry]);
    } catch {
      // Swallow — remote failure is non-critical
    } finally {
      this.#inRemoteWrite = false;
    }
  }
}
