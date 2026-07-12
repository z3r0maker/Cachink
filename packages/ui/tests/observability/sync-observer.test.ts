/**
 * sync-observer tests — logSyncEvent utility.
 *
 * Covers null logStore guard, event type classification,
 * and audit event shape.
 */

import { describe, expect, it, vi } from 'vitest';
import { logSyncEvent } from '../../src/observability/sync-observer';

function makeLogStore() {
  return {
    writeAudit: vi.fn().mockResolvedValue(undefined),
    writeError: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({ total: 0, errors: 0, lastError: null, coverage: 0 }),
    clear: vi.fn().mockResolvedValue(undefined),
  };
}

describe('logSyncEvent', () => {
  it('does nothing when logStore is null', () => {
    // Should not throw
    logSyncEvent(null, 'sync.lan.pair', 'DEV001');
  });

  it('writes audit event for a pair event with success status', () => {
    const store = makeLogStore();
    logSyncEvent(store as any, 'sync.lan.pair', 'DEV001');
    expect(store.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'sync.lan.pair',
        entityType: 'sync',
        deviceId: 'DEV001',
        status: 'success',
      }),
    );
  });

  it('writes audit event with error status for disconnect events', () => {
    const store = makeLogStore();
    logSyncEvent(store as any, 'sync.lan.disconnect', 'DEV001');
    expect(store.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
      }),
    );
  });

  it('writes audit event with error status for conflict events', () => {
    const store = makeLogStore();
    logSyncEvent(store as any, 'sync.conflict', 'DEV001');
    expect(store.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
      }),
    );
  });

  it('writes audit event with success status for connect events', () => {
    const store = makeLogStore();
    logSyncEvent(store as any, 'sync.cloud.connect', 'DEV001');
    expect(store.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
      }),
    );
  });

  it('passes metadata when provided', () => {
    const store = makeLogStore();
    logSyncEvent(store as any, 'sync.lan.pair', 'DEV001', { peerName: 'iPad' });
    expect(store.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { peerName: 'iPad' },
      }),
    );
  });

  it('generates a unique id for each event', () => {
    const store = makeLogStore();
    logSyncEvent(store as any, 'sync.lan.pair', 'DEV001');
    logSyncEvent(store as any, 'sync.lan.pair', 'DEV001');
    const id1 = (store.writeAudit.mock.calls[0] as any)[0].id;
    const id2 = (store.writeAudit.mock.calls[1] as any)[0].id;
    expect(id1).not.toBe(id2);
  });
});
