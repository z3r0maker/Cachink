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

  function make(random: () => number = () => 0.5) {
    const runPush = vi.fn();
    const runSync = vi.fn();
    return { runPush, runSync, s: new SyncScheduler({ runPush, runSync, random }) };
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
    const { runPush, runSync, s } = make();
    s.onForeground();
    s.onForeground(); // within 45 s of the first: push only (DB3-L-02)
    expect(runPush).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(PULL_INTERVAL_MS);
    expect(runSync).toHaveBeenCalledTimes(2);
  });
});

describe('SyncScheduler · the evening peak (DB2-DEV-02)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('spreads the foreground tick by ±20 % so devices do not sync in step', () => {
    for (const [random, factor] of [
      [0, 0.8],
      [1, 1.2],
    ] as const) {
      const runSync = vi.fn();
      const s = new SyncScheduler({ runPush: vi.fn(), runSync, random: () => random });
      s.onForeground();
      vi.advanceTimersByTime(PULL_INTERVAL_MS * factor - 1);
      expect(runSync).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(1);
      expect(runSync).toHaveBeenCalledTimes(2);
      s.dispose();
    }
  });

  it('retries once when the engine says, the latest request winning', () => {
    const runSync = vi.fn();
    const s = new SyncScheduler({ runPush: vi.fn(), runSync, random: () => 0.5 });
    s.retryIn(30_000);
    s.retryIn(10_000);
    vi.advanceTimersByTime(9_999);
    expect(runSync).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(runSync).toHaveBeenCalledTimes(1);
  });

  it('drops a scheduled retry on background', () => {
    const runSync = vi.fn();
    const s = new SyncScheduler({ runPush: vi.fn(), runSync });
    s.retryIn(5_000);
    s.onBackground();
    vi.advanceTimersByTime(60_000);
    expect(runSync).not.toHaveBeenCalled();
  });
});

describe('pillView', () => {
  const at = (over: Partial<typeof INITIAL_CLOUD_SYNC_STATE>) => ({
    ...INITIAL_CLOUD_SYNC_STATE,
    ...over,
  });
  const counts = (pending: number, rejected: number, retrying: number, unsent = 0) => ({
    pending,
    rejected,
    retrying,
    unsent,
  });

  it('shows rejected rows above everything except an active sync', () => {
    expect(pillView(at({ counts: counts(3, 2, 1) })).labelKey).toBe('syncPill.rejected');
    expect(pillView(at({ phase: 'syncing', counts: counts(0, 2, 0) })).labelKey).toBe(
      'syncPill.syncing',
    );
  });

  it('counts everything unsent as waiting, and shows offline when the last attempt had no network', () => {
    expect(pillView(at({ counts: counts(2, 0, 1, 3) }))).toEqual({
      labelKey: 'syncPill.pending',
      count: 3,
      tone: 'warn',
    });
    expect(pillView(at({ phase: 'offline', counts: counts(1, 0, 0, 1) })).labelKey).toBe(
      'syncPill.offline',
    );
  });

  it('counts sales captured offline and never tried, which have no pending row (DB3-CAJA-02)', () => {
    expect(pillView(at({ phase: 'offline', counts: counts(0, 0, 0, 6) }))).toEqual({
      labelKey: 'syncPill.offline',
      count: 6,
      tone: 'warn',
    });
  });

  it('shows the last sync time when everything is up to date, and "never" before the first sync', () => {
    const view = pillView(at({ lastSyncAt: new Date(2026, 8, 16, 9, 5).toISOString() }));
    expect(view).toEqual({ labelKey: 'syncPill.synced', time: '09:05', tone: 'ok' });
    expect(pillView(INITIAL_CLOUD_SYNC_STATE).labelKey).toBe('syncPill.never');
  });

  it('counts down to the engine’s retry in the warning tone (DS-05)', () => {
    const ahora = new Date(2026, 4, 14, 19, 30).getTime();
    const error = { phase: 'error' as const, counts: counts(0, 0, 3, 3) };
    expect(
      pillView(at({ ...error, reintento: { en: ahora + 50_000, causa: 'ocupado' } }), ahora),
    ).toEqual({ labelKey: 'syncPill.retrying', texto: 'Reintentando en 1 min', tone: 'retry' });
    const siete42 = new Date(2026, 4, 14, 19, 42).getTime();
    expect(
      pillView(at({ ...error, reintento: { en: siete42, causa: 'esperar' } }), ahora).texto,
    ).toBe('Reintento: 7:42 p. m.');
    // Its time passed, or nothing waits: back to the count.
    expect(
      pillView(at({ ...error, reintento: { en: ahora - 1, causa: 'ocupado' } }), ahora).labelKey,
    ).toBe('syncPill.pending');
    // Offline and refused rows outrank the retry.
    const r = { en: ahora + 60_000, causa: 'lenta' } as const;
    expect(pillView(at({ ...error, phase: 'offline', reintento: r }), ahora).labelKey).toBe(
      'syncPill.offline',
    );
    expect(
      pillView(at({ ...error, counts: counts(0, 1, 3, 3), reintento: r }), ahora).labelKey,
    ).toBe('syncPill.rejected');
  });
});
