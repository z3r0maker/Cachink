/**
 * AuditedUseCase decorator tests.
 *
 * Verifies that:
 *   - Success: audit event is written with status='success'
 *   - Error: audit event + error entry are written, error is re-thrown
 *   - LogStore failures don't crash the use case
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditedUseCase, type AuditContext, type AuditedUseCaseConfig } from '../src/audited-use-case.js';
import type { LogStore } from '../src/log-store.js';
import type { AuditEvent } from '../src/audit-event.js';
import type { ErrorLogEntry } from '../src/error-log.js';

// ─── Mock use case ──────────────────────────────────────────────────

class FakeUseCase {
  shouldThrow = false;
  lastInput: unknown = null;

  async execute(input: { id: string; amount: number }): Promise<{ id: string; result: string }> {
    this.lastInput = input;
    if (this.shouldThrow) throw new TypeError('Validation failed');
    return { id: input.id, result: 'ok' };
  }
}

// ─── Mock LogStore ──────────────────────────────────────────────────

function createMockLogStore(): LogStore & {
  auditEvents: AuditEvent[];
  errorEntries: ErrorLogEntry[];
} {
  const auditEvents: AuditEvent[] = [];
  const errorEntries: ErrorLogEntry[] = [];

  return {
    auditEvents,
    errorEntries,
    async writeAudit(event: AuditEvent) { auditEvents.push(event); },
    async writeError(entry: ErrorLogEntry) { errorEntries.push(entry); },
    async queryAudit() { return []; },
    async queryErrors() { return []; },
    async queryTimeline() { return []; },
    async stats() { return { totalAuditEvents: 0, totalErrors: 0, errorsBySource: {}, operationCounts: {}, lastErrorAt: null }; },
    async prune() { return 0; },
    async exportSnapshot() { return { exportedAt: '', deviceId: '', auditEvents: [], errors: [] }; },
  };
}

// ─── Config ─────────────────────────────────────────────────────────

const config: AuditedUseCaseConfig<{ id: string; amount: number }, { id: string; result: string }> = {
  operation: 'venta.registrar',
  entityType: 'sale',
  extractEntityId: (result) => result.id,
  extractMetadata: (input) => ({ amount: input.amount }),
};

const context: AuditContext = {
  deviceId: 'dev-test-001',
  userId: 'usr-test-001',
  businessId: 'biz-test-001',
};

describe('AuditedUseCase', () => {
  let inner: FakeUseCase;
  let logStore: ReturnType<typeof createMockLogStore>;
  let audited: AuditedUseCase<{ id: string; amount: number }, { id: string; result: string }>;

  beforeEach(() => {
    inner = new FakeUseCase();
    logStore = createMockLogStore();
    audited = new AuditedUseCase(inner, logStore, config, context);
  });

  it('on success: returns result and writes audit event', async () => {
    const result = await audited.execute({ id: 'sale-1', amount: 5000 });
    expect(result).toEqual({ id: 'sale-1', result: 'ok' });

    // Wait for fire-and-forget promises
    await new Promise((r) => setTimeout(r, 10));

    expect(logStore.auditEvents).toHaveLength(1);
    const evt = logStore.auditEvents[0]!;
    expect(evt.operation).toBe('venta.registrar');
    expect(evt.entityType).toBe('sale');
    expect(evt.entityId).toBe('sale-1');
    expect(evt.status).toBe('success');
    expect(evt.userId).toBe('usr-test-001');
    expect(evt.deviceId).toBe('dev-test-001');
    expect(evt.businessId).toBe('biz-test-001');
    expect(evt.metadata).toEqual({ amount: 5000 });
  });

  it('on error: re-throws and writes audit event + error entry', async () => {
    inner.shouldThrow = true;

    await expect(audited.execute({ id: 'sale-2', amount: 0 })).rejects.toThrow('Validation failed');

    // Wait for fire-and-forget promises
    await new Promise((r) => setTimeout(r, 10));

    expect(logStore.auditEvents).toHaveLength(1);
    const evt = logStore.auditEvents[0]!;
    expect(evt.status).toBe('error');
    expect(evt.errorCode).toBe('TypeError');
    expect(evt.errorMessage).toBe('Validation failed');
    expect(evt.entityId).toBe(''); // No result available

    expect(logStore.errorEntries).toHaveLength(1);
    const err = logStore.errorEntries[0]!;
    expect(err.source).toBe('use-case');
    expect(err.operation).toBe('venta.registrar');
    expect(err.errorName).toBe('TypeError');
  });

  it('LogStore failure does not crash the use case', async () => {
    const failingStore: LogStore = {
      async writeAudit() { throw new Error('DB full'); },
      async writeError() { throw new Error('DB full'); },
      async queryAudit() { return []; },
      async queryErrors() { return []; },
      async queryTimeline() { return []; },
      async stats() { return { totalAuditEvents: 0, totalErrors: 0, errorsBySource: {}, operationCounts: {}, lastErrorAt: null }; },
      async prune() { return 0; },
      async exportSnapshot() { return { exportedAt: '', deviceId: '', auditEvents: [], errors: [] }; },
    };

    const auditedWithFailingStore = new AuditedUseCase(inner, failingStore, config, context);
    const result = await auditedWithFailingStore.execute({ id: 'sale-3', amount: 1000 });
    expect(result).toEqual({ id: 'sale-3', result: 'ok' });
  });

  it('passes input through to inner use case unchanged', async () => {
    const input = { id: 'sale-4', amount: 9999 };
    await audited.execute(input);
    expect(inner.lastInput).toEqual(input);
  });
});
