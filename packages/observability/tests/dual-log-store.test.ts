/**
 * DualLogStore tests.
 *
 * Verifies that:
 *   - Local writes always succeed
 *   - Remote is called for errors
 *   - Remote failures don't crash local writes
 *   - Queries delegate to local store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DualLogStore } from '../src/dual-log-store.js';
import type { LogStore } from '../src/log-store.js';
import type { RemoteLogStore } from '../src/remote-log-store.js';
import type { AuditEvent } from '../src/audit-event.js';
import type { ErrorLogEntry } from '../src/error-log.js';

// ─── Mocks ──────────────────────────────────────────────────────────

function createMockLocal(): LogStore & { auditEvents: AuditEvent[]; errorEntries: ErrorLogEntry[] } {
  const auditEvents: AuditEvent[] = [];
  const errorEntries: ErrorLogEntry[] = [];
  return {
    auditEvents,
    errorEntries,
    async writeAudit(event) { auditEvents.push(event); },
    async writeError(entry) { errorEntries.push(entry); },
    async queryAudit() { return auditEvents; },
    async queryErrors() { return errorEntries; },
    async queryTimeline() { return []; },
    async stats() { return { totalAuditEvents: 0, totalErrors: 0, errorsBySource: {}, operationCounts: {}, lastErrorAt: null }; },
    async prune() { return 0; },
    async exportSnapshot() { return { exportedAt: '', deviceId: '', auditEvents: [], errors: [] }; },
  };
}

function createMockRemote(): RemoteLogStore & { calls: unknown[][] } {
  const calls: unknown[][] = [];
  return {
    calls,
    async sendErrorBatch(entries) { calls.push(['sendErrorBatch', entries]); },
    async sendBugReport(report) { calls.push(['sendBugReport', report]); },
  };
}

describe('DualLogStore', () => {
  let local: ReturnType<typeof createMockLocal>;
  let remote: ReturnType<typeof createMockRemote>;
  let dual: DualLogStore;

  beforeEach(() => {
    local = createMockLocal();
    remote = createMockRemote();
    dual = new DualLogStore(local, remote);
  });

  it('writeAudit success: writes to local only (no remote call)', async () => {
    const event: AuditEvent = {
      id: 'e1',
      timestamp: '2026-05-16T10:00:00.000Z',
      operation: 'venta.registrar',
      entityType: 'sale',
      entityId: 's1',
      userId: null,
      deviceId: 'dev-1',
      businessId: 'biz-1',
      status: 'success',
    };
    await dual.writeAudit(event);

    expect(local.auditEvents).toHaveLength(1);
    // Remote is only called for errors
    await new Promise((r) => setTimeout(r, 10));
    expect(remote.calls).toHaveLength(0);
  });

  it('writeAudit error: writes to local AND ships to remote', async () => {
    const event: AuditEvent = {
      id: 'e2',
      timestamp: '2026-05-16T10:00:00.000Z',
      operation: 'egreso.registrar',
      entityType: 'expense',
      entityId: '',
      userId: 'u1',
      deviceId: 'dev-1',
      businessId: 'biz-1',
      status: 'error',
      errorCode: 'ZodError',
      errorMessage: 'monto must be > 0',
    };
    await dual.writeAudit(event);
    await new Promise((r) => setTimeout(r, 10));

    expect(local.auditEvents).toHaveLength(1);
    expect(remote.calls).toHaveLength(1);
    expect(remote.calls[0]![0]).toBe('sendErrorBatch');
  });

  it('writeError: writes to local AND ships to remote', async () => {
    const entry: ErrorLogEntry = {
      id: 'err-1',
      timestamp: '2026-05-16T10:00:00.000Z',
      source: 'ui',
      errorName: 'CrashError',
      errorMessage: 'something broke',
      userId: null,
      deviceId: 'dev-1',
      businessId: 'biz-1',
    };
    await dual.writeError(entry);
    await new Promise((r) => setTimeout(r, 10));

    expect(local.errorEntries).toHaveLength(1);
    expect(remote.calls).toHaveLength(1);
  });

  it('remote failure does not crash local write', async () => {
    const failingRemote: RemoteLogStore = {
      async sendErrorBatch() { throw new Error('Network timeout'); },
      async sendBugReport() { throw new Error('Network timeout'); },
    };
    const dualWithFailing = new DualLogStore(local, failingRemote);

    const entry: ErrorLogEntry = {
      id: 'err-2',
      timestamp: '2026-05-16T10:00:00.000Z',
      source: 'sync',
      errorName: 'SyncError',
      errorMessage: 'conflict',
      userId: null,
      deviceId: 'dev-1',
      businessId: null,
    };

    // Should not throw
    await dualWithFailing.writeError(entry);
    await new Promise((r) => setTimeout(r, 10));

    expect(local.errorEntries).toHaveLength(1);
  });

  it('queryAudit delegates to local', async () => {
    await dual.writeAudit({
      id: 'e3',
      timestamp: '2026-05-16T10:00:00.000Z',
      operation: 'caja.abrir',
      entityType: 'caja_turno',
      entityId: 'turno-1',
      userId: null,
      deviceId: 'dev-1',
      businessId: 'biz-1',
      status: 'success',
    });

    const results = await dual.queryAudit({});
    expect(results).toHaveLength(1);
  });
});
