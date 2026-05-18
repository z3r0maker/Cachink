/**
 * Sync event logging — writes sync lifecycle events to the LogStore.
 *
 * Used by LAN and Cloud bridge callbacks to record pair/sync/disconnect
 * events. Each event becomes an AuditEvent with entityType = 'sync'.
 */

import { ulid } from 'ulid';
import type { AuditOperation, AuditEvent, LogStore } from '@cachink/observability';

export type SyncEventType =
  | 'sync.lan.pair'
  | 'sync.lan.disconnect'
  | 'sync.cloud.connect'
  | 'sync.cloud.disconnect'
  | 'sync.conflict';

/**
 * Log a sync lifecycle event to the local LogStore.
 *
 * Fire-and-forget — callers should not await this.
 */
export function logSyncEvent(
  logStore: LogStore | null,
  event: SyncEventType,
  deviceId: string,
  metadata?: Record<string, unknown>,
): void {
  if (!logStore) return;

  const isError = event.includes('disconnect') || event.includes('conflict');

  const auditEvent: AuditEvent = {
    id: ulid(),
    timestamp: new Date().toISOString(),
    operation: event as AuditOperation,
    entityType: 'sync',
    entityId: '',
    userId: null,
    deviceId,
    businessId: '',
    metadata,
    status: isError ? 'error' : 'success',
  };

  void logStore.writeAudit(auditEvent).catch(() => {});
}
