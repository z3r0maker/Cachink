/**
 * A-07: sync trigger policy (fake timers) and the status pill mapping.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PULL_INTERVAL_MS, PUSH_DEBOUNCE_MS, SyncScheduler } from '../../src/sync/sync-scheduler';
import { INITIAL_CLOUD_SYNC_STATE, pillView } from '../../src/sync/cloud-sync-status';

describe('SyncScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function make() {
    const runPush = vi.fn();
    const runSync = vi.fn();
    return { runPush, runSync, s: new SyncScheduler({ runPush, runSync }) };
  }

  it('collapses a burst of writes into one push after the debounce', () => {
    const { runPush, s } = make();
    s.noteWrite();
    vi.advanceTimersByTime(PUSH_DEBOUNCE_MS - 1);
    s.noteWrite();
    s.noteWrite();
    expect(runPush).not.toHaveBeenCalled();
    vi.advanceTimersByTime(PUSH_DEBOUNCE_MS);
    expect(runPush).toHaveBeenCalledTimes(1);
  });

  it('syncs immediately on foreground and every 15 minutes while active', () => {
    const { runSync, s } = make();
    s.onForeground();
    expect(runSync).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(PULL_INTERVAL_MS * 2);
    expect(runSync).toHaveBeenCalledTimes(3);
  });

  it('stops the interval and drops a pending push on background', () => {
    const { runPush, runSync, s } = make();
    s.onForeground();
    s.noteWrite();
    s.onBackground();
    vi.advanceTimersByTime(PULL_INTERVAL_MS * 3);
    expect(runPush).not.toHaveBeenCalled();
    expect(runSync).toHaveBeenCalledTimes(1);
  });

  it('does not stack intervals when foregrounded repeatedly', () => {
    const { runSync, s } = make();
    s.onForeground();
    s.onForeground();
    vi.advanceTimersByTime(PULL_INTERVAL_MS);
    expect(runSync).toHaveBeenCalledTimes(3);
  });
});

describe('pillView', () => {
  const at = (over: Partial<typeof INITIAL_CLOUD_SYNC_STATE>) => ({
    ...INITIAL_CLOUD_SYNC_STATE,
    ...over,
  });
  const counts = (pending: number, rejected: number, retrying: number) => ({
    pending,
    rejected,
    retrying,
  });

  it('shows rejected rows above everything except an active sync', () => {
    expect(pillView(at({ counts: counts(3, 2, 1) })).labelKey).toBe('syncPill.rejected');
    expect(pillView(at({ phase: 'syncing', counts: counts(0, 2, 0) })).labelKey).toBe(
      'syncPill.syncing',
    );
  });

  it('counts pending plus retrying as waiting, and shows offline when the last attempt had no network', () => {
    expect(pillView(at({ counts: counts(2, 0, 1) }))).toEqual({
      labelKey: 'syncPill.pending',
      count: 3,
      tone: 'warn',
    });
    expect(pillView(at({ phase: 'offline', counts: counts(1, 0, 0) })).labelKey).toBe(
      'syncPill.offline',
    );
  });

  it('shows the last sync time when everything is up to date, and "never" before the first sync', () => {
    const view = pillView(at({ lastSyncAt: new Date(2026, 8, 16, 9, 5).toISOString() }));
    expect(view).toEqual({ labelKey: 'syncPill.synced', time: '09:05', tone: 'ok' });
    expect(pillView(INITIAL_CLOUD_SYNC_STATE).labelKey).toBe('syncPill.never');
  });
});
