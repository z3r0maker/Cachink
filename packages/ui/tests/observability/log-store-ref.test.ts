/**
 * log-store-ref tests — module-level LogStore singleton.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setLogStoreRef, getLogStoreRef } from '../../src/observability/log-store-ref';
import type { LogStore } from '@cachink/observability';

const fakeStore = {
  writeAudit: async () => {},
  writeError: async () => {},
  queryAudit: async () => [],
  queryErrors: async () => [],
  queryTimeline: async () => [],
  stats: async () => ({ totalAuditEvents: 0, totalErrors: 0, errorsBySource: {}, operationCounts: {}, lastErrorAt: null }),
  prune: async () => 0,
  exportSnapshot: async () => ({ exportedAt: '', deviceId: '', auditEvents: [], errors: [] }),
} as LogStore;

describe('logStoreRef', () => {
  beforeEach(() => {
    setLogStoreRef(null);
  });

  it('starts as null', () => {
    expect(getLogStoreRef()).toBeNull();
  });

  it('stores and retrieves a LogStore reference', () => {
    setLogStoreRef(fakeStore);
    expect(getLogStoreRef()).toBe(fakeStore);
  });

  it('can be set back to null', () => {
    setLogStoreRef(fakeStore);
    setLogStoreRef(null);
    expect(getLogStoreRef()).toBeNull();
  });
});
