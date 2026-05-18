/**
 * Row-mapping helpers for SQLite ↔ domain type conversion.
 *
 * Used by `SqliteLogStore` to convert raw database rows into
 * typed `AuditEvent`, `ErrorLogEntry`, and `TimelineEntry` objects.
 */

import type { AuditEvent } from './audit-event.js';
import type { ErrorLogEntry } from './error-log.js';
import type { TimelineEntry } from './log-store.js';

export interface RawRow {
  id: string;
  type: 'audit' | 'error';
  timestamp: string;
  operation: string | null;
  entity_type: string | null;
  entity_id: string | null;
  user_id: string | null;
  device_id: string;
  business_id: string | null;
  status: 'success' | 'error' | null;
  error_name: string | null;
  error_message: string | null;
  error_stack: string | null;
  source: string | null;
  metadata: string | null;
  context: string | null;
  duration_ms: number | null;
}

function parseJson(raw: string | null): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export function rowToAuditEvent(row: RawRow): AuditEvent {
  return {
    id: row.id,
    timestamp: row.timestamp,
    operation: row.operation as AuditEvent['operation'],
    entityType: row.entity_type ?? '',
    entityId: row.entity_id ?? '',
    userId: row.user_id,
    deviceId: row.device_id,
    businessId: row.business_id ?? '',
    metadata: parseJson(row.metadata),
    status: row.status ?? 'success',
    errorCode: row.error_name ?? undefined,
    errorMessage: row.error_message ?? undefined,
    durationMs: row.duration_ms ?? undefined,
  };
}

export function rowToErrorEntry(row: RawRow): ErrorLogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    source: (row.source as ErrorLogEntry['source']) ?? 'system',
    operation: row.operation ?? undefined,
    errorName: row.error_name ?? 'UnknownError',
    errorMessage: row.error_message ?? '',
    errorStack: row.error_stack ?? undefined,
    userId: row.user_id,
    deviceId: row.device_id,
    businessId: row.business_id,
    context: parseJson(row.context),
  };
}

export function rowToTimelineEntry(row: RawRow): TimelineEntry {
  if (row.type === 'audit') {
    return { type: 'audit', ...rowToAuditEvent(row) };
  }
  return { type: 'error', ...rowToErrorEntry(row) };
}
