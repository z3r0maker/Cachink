/**
 * ErrorLogEntry — structured error record persisted locally.
 *
 * Captures errors from use-cases, repositories, UI, sync, and system
 * sources. PII is scrubbed before export (see `pii-scrubber.ts`).
 */

export type ErrorSource = 'use-case' | 'repository' | 'ui' | 'sync' | 'system';

export interface ErrorLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly source: ErrorSource;
  readonly operation?: string;
  readonly errorName: string;
  readonly errorMessage: string;
  readonly errorStack?: string;
  readonly userId: string | null;
  readonly deviceId: string;
  readonly businessId: string | null;
  readonly context?: Record<string, unknown>;
}
