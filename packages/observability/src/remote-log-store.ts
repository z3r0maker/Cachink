/**
 * RemoteLogStore — pluggable interface for shipping logs off-device.
 *
 * Deferred to Phase E. The interface is here so `DualLogStore` can
 * code against it now and the team can plug any HTTP backend later.
 */

import type { ErrorLogEntry } from './error-log.js';

/** Minimal bug report payload for remote submission. */
export interface BugReport {
  readonly description: string;
  readonly deviceId: string;
  readonly businessId: string | null;
  readonly userId: string | null;
  readonly snapshot: {
    readonly auditEvents: readonly Record<string, unknown>[];
    readonly errors: readonly Record<string, unknown>[];
  };
  readonly submittedAt: string;
}

export interface RemoteLogStore {
  /** Ship a batch of errors to the remote backend. */
  sendErrorBatch(entries: readonly ErrorLogEntry[]): Promise<void>;

  /** Ship a user-initiated bug report. */
  sendBugReport(report: BugReport): Promise<void>;
}
