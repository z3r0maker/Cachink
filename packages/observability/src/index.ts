/**
 * @cachink/observability — audit logging, error telemetry, and observability.
 *
 * This package provides:
 *   - `AuditEvent` / `ErrorLogEntry` types for structured logging
 *   - `LogStore` interface with `SqliteLogStore` (local) and `DualLogStore` impls
 *   - `AuditedUseCase` decorator for instrumenting use cases
 *   - `createLogStore` factory for environment-aware initialization
 *   - `scrubRecord` / `scrubLogMetadata` for PII removal before export
 *
 * No React, no UI — pure TypeScript. The UI integration lives in
 * `@cachink/ui` (`observability-provider.tsx`).
 */

// Types
export type { AuditOperation, AuditEvent } from './audit-event.js';
export type { ErrorLogEntry, ErrorSource } from './error-log.js';
export type { LogStats } from './log-stats.js';
export type {
  LogStore,
  LogQueryOptions,
  TimelineEntry,
  LogSnapshot,
} from './log-store.js';
export type { RemoteLogStore, BugReport } from './remote-log-store.js';

// Implementations
export { SqliteLogStore, type SqliteDatabase, type SqliteLogStoreConfig } from './sqlite-log-store.js';
export { DualLogStore } from './dual-log-store.js';
export { HttpRemoteLogStore, type HttpRemoteLogStoreConfig } from './http-remote-log-store.js';

// Decorator
export { AuditedUseCase, type AuditContext, type AuditedUseCaseConfig } from './audited-use-case.js';

// Factory
export { createLogStore, type CreateLogStoreOptions } from './create-log-store.js';

// PII scrubbing
export { scrubRecord, scrubLogMetadata } from './pii-scrubber.js';

// Migration event logging (pre-LogStore init)
export { logMigrationEvent, type MigrationEventMetadata } from './log-migration-event.js';

// Timeline formatting
export { formatTimelineAsText } from './format-timeline.js';

// Health checks
export { checkObservabilityHealth, type ObservabilityHealth } from './health-check.js';

// Integrity verification
export { verifyAuditChain, type AuditChainResult } from './verify-audit-chain.js';

// Device context
export type { DeviceContext } from './device-context.js';

// Outbox flusher
export { OutboxFlusher, type OutboxFlusherConfig } from './outbox-flusher.js';
