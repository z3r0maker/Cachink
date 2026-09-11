/**
 * sync-observer tests — logSyncEvent utility.
 *
 * Covers null logStore guard, event type classification,
 * and audit event shape.
 */

import { describe, expect, it, vi } from 'vitest';
import type { LogStore } from '@xangarro/observability';
import { logSyncEvent } from '../../src/observability/sync-observer';

type MockLogStore = ReturnType<typeof makeLogStore>;
/** The mock only implements what `logSyncEvent` touches; widen it once, here. */
const asStore = (s: MockLogStore): LogStore => s as unknown as LogStore;

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
    logSyncEvent(asStore(store), 'sync.lan.pair', 'DEV001');
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
    logSyncEvent(asStore(store), 'sync.lan.disconnect', 'DEV001');
    expect(store.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
      }),
    );
  });

  it('writes audit event with error status for conflict events', () => {
    const store = makeLogStore();
    logSyncEvent(asStore(store), 'sync.conflict', 'DEV001');
    expect(store.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
      }),
    );
  });

  it('writes audit event with success status for connect events', () => {
    const store = makeLogStore();
    logSyncEvent(asStore(store), 'sync.cloud.connect', 'DEV001');
    expect(store.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
      }),
    );
  });

  it('passes metadata when provided', () => {
    const store = makeLogStore();
    logSyncEvent(asStore(store), 'sync.lan.pair', 'DEV001', { peerName: 'iPad' });
    expect(store.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { peerName: 'iPad' },
      }),
    );
  });

  it('generates a unique id for each event', () => {
    const store = makeLogStore();
    logSyncEvent(asStore(store), 'sync.lan.pair', 'DEV001');
    logSyncEvent(asStore(store), 'sync.lan.pair', 'DEV001');
    const [first, second] = store.writeAudit.mock.calls as unknown as [
      [{ id: string }],
      [{ id: string }],
    ];
    const id1 = first[0].id;
    const id2 = second[0].id;
    expect(id1).not.toBe(id2);
  });
});
