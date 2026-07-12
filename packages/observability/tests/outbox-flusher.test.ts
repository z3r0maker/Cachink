/**
 * OutboxFlusher unit tests.
 *
 * Verifies consent gating, batch processing, mark-shipped, and
 * retry-on-next-flush behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutboxFlusher } from '../src/outbox-flusher.js';
import type { LogStore } from '../src/log-store.js';
import type { RemoteLogStore, BugReport } from '../src/remote-log-store.js';
import type { ErrorLogEntry } from '../src/error-log.js';
import type { DeviceContext } from '../src/device-context.js';

// ─── Test helpers ─────────────────────────────────────────────

function makeError(id: string): ErrorLogEntry {
  return {
    id,
    timestamp: '2026-07-08T12:00:00Z',
    source: 'ui',
    errorName: 'TestError',
    errorMessage: 'Something broke',
    deviceId: 'DEV_1',
    userId: null,
    businessId: null,
  };
}

const TEST_DEVICE_CONTEXT: DeviceContext = {
  model: 'iPad Pro',
  osName: 'iOS',
  osVersion: '18.0',
  appVersion: '1.2.3',
  buildNumber: '42',
  platform: 'ios',
};

function createMockLogStore(unshipped: ErrorLogEntry[] = []): LogStore & {
  queryUnshippedErrors: ReturnType<typeof vi.fn>;
  markShipped: ReturnType<typeof vi.fn>;
} {
  return {
    writeAudit: vi.fn().mockResolvedValue(undefined),
    writeError: vi.fn().mockResolvedValue(undefined),
    queryAudit: vi.fn().mockResolvedValue([]),
    queryErrors: vi.fn().mockResolvedValue([]),
    queryTimeline: vi.fn().mockResolvedValue([]),
    stats: vi.fn().mockResolvedValue({ totalAuditEvents: 0, totalErrors: 0, errorsBySource: {}, operationCounts: {}, lastErrorAt: null }),
    prune: vi.fn().mockResolvedValue(0),
    exportSnapshot: vi.fn().mockResolvedValue({ exportedAt: '', deviceId: '', auditEvents: [], errors: [] }),
    queryUnshippedErrors: vi.fn().mockResolvedValue(unshipped),
    markShipped: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockRemote(): RemoteLogStore & {
  sendErrorBatch: ReturnType<typeof vi.fn>;
  sendBugReport: ReturnType<typeof vi.fn>;
} {
  return {
    sendErrorBatch: vi.fn().mockResolvedValue(undefined),
    sendBugReport: vi.fn().mockResolvedValue(undefined),
  };
}

// ─── Tests ────────────────────────────────────────────────────

describe('OutboxFlusher', () => {
  let logStore: ReturnType<typeof createMockLogStore>;
  let remote: ReturnType<typeof createMockRemote>;
  let consent: boolean | null;

  beforeEach(() => {
    consent = true;
    logStore = createMockLogStore([makeError('e1'), makeError('e2')]);
    remote = createMockRemote();
  });

  function build(overrides?: { batchSize?: number }) {
    return new OutboxFlusher({
      logStore,
      remote,
      deviceContext: TEST_DEVICE_CONTEXT,
      getFeatureFlags: () => ({ stock: true, caja: false }),
      getConsent: () => consent,
      batchSize: overrides?.batchSize,
    });
  }

  it('ships unshipped errors and marks them shipped', async () => {
    const flusher = build();
    const count = await flusher.flush();

    expect(count).toBe(2);
    expect(remote.sendErrorBatch).toHaveBeenCalledTimes(1);
    expect(logStore.markShipped).toHaveBeenCalledWith(['e1', 'e2']);
  });

  it('enriches entries with device context', async () => {
    const flusher = build();
    await flusher.flush();

    const batchArg = remote.sendErrorBatch.mock.calls[0][0] as ErrorLogEntry[];
    expect(batchArg[0].context).toMatchObject({
      deviceModel: 'iPad Pro',
      osName: 'iOS',
      osVersion: '18.0',
      appVersion: '1.2.3',
      platform: 'ios',
      featureFlags: { stock: true, caja: false },
    });
  });

  it('never ships errorStack in enriched context', async () => {
    logStore = createMockLogStore([{
      ...makeError('e3'),
      context: { errorStack: 'Error: foo\n  at bar.ts:1' },
    }]);
    const flusher = build();
    await flusher.flush();

    const batchArg = remote.sendErrorBatch.mock.calls[0][0] as ErrorLogEntry[];
    expect(batchArg[0].context?.errorStack).toBeUndefined();
  });

  it('no-ops when consent is false', async () => {
    consent = false;
    const flusher = build();
    const count = await flusher.flush();

    expect(count).toBe(0);
    expect(remote.sendErrorBatch).not.toHaveBeenCalled();
    expect(logStore.queryUnshippedErrors).not.toHaveBeenCalled();
  });

  it('no-ops when consent is null', async () => {
    consent = null;
    const flusher = build();
    const count = await flusher.flush();

    expect(count).toBe(0);
    expect(remote.sendErrorBatch).not.toHaveBeenCalled();
  });

  it('returns 0 when no unshipped entries', async () => {
    logStore = createMockLogStore([]);
    const flusher = build();
    const count = await flusher.flush();

    expect(count).toBe(0);
    expect(remote.sendErrorBatch).not.toHaveBeenCalled();
    expect(logStore.markShipped).not.toHaveBeenCalled();
  });

  it('returns 0 and does not throw on remote failure', async () => {
    remote.sendErrorBatch.mockRejectedValue(new Error('network error'));
    const flusher = build();
    const count = await flusher.flush();

    expect(count).toBe(0);
    expect(logStore.markShipped).not.toHaveBeenCalled();
  });

  it('respects batchSize', async () => {
    const flusher = build({ batchSize: 10 });
    await flusher.flush();

    expect(logStore.queryUnshippedErrors).toHaveBeenCalledWith(10);
  });

  it('prevents re-entrant flushes', async () => {
    let resolveFirst: () => void;
    remote.sendErrorBatch.mockImplementation(() => new Promise<void>((r) => { resolveFirst = r; }));

    const flusher = build();
    const first = flusher.flush();
    const second = flusher.flush(); // Should be blocked

    const secondResult = await second;
    expect(secondResult).toBe(0); // Re-entrance blocked

    resolveFirst!();
    const firstResult = await first;
    expect(firstResult).toBe(2); // First one completed
  });
});
