/**
 * DB3-L-02: the phone pulled on every return to the app. A resume within
 * 45 s of the last full sync only pushes — a sale still leaves at once — and
 * the pull waits, as it does after a capture.
 */

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import { PULL_AFTER_CAPTURE_MS } from '@xangarro/sync';
import { RESUME_PULL_MIN_MS, SyncScheduler } from '../../src/sync/sync-scheduler';

describe('SyncScheduler · resume throttle (DB3-L-02)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function make() {
    const runPush = vi.fn();
    const runSync = vi.fn();
    const s = new SyncScheduler({ runPush, runSync, random: () => 0.5 });
    return { runPush, runSync, s };
  }

  it('waits as long between pulls on resume as after a capture', () => {
    assert.equal(RESUME_PULL_MIN_MS, PULL_AFTER_CAPTURE_MS);
  });

  it('only pushes when the app comes back within 45 s of the last sync', () => {
    const { runPush, runSync, s } = make();
    s.onForeground();
    s.onBackground();
    vi.advanceTimersByTime(RESUME_PULL_MIN_MS - 1);
    s.onForeground();
    assert.equal(runSync.mock.calls.length, 1);
    assert.equal(runPush.mock.calls.length, 1, 'the outbox still leaves');
  });

  it('syncs in full once 45 s have passed', () => {
    const { runPush, runSync, s } = make();
    s.onForeground();
    s.onBackground();
    vi.advanceTimersByTime(RESUME_PULL_MIN_MS);
    s.onForeground();
    assert.deepEqual([runSync.mock.calls.length, runPush.mock.calls.length], [2, 0]);
  });

  it('counts the periodic tick and an engine retry as syncs', () => {
    const { runPush, runSync, s } = make();
    s.retryIn(1_000);
    vi.advanceTimersByTime(1_000);
    s.onForeground();
    assert.deepEqual([runSync.mock.calls.length, runPush.mock.calls.length], [1, 1]);
  });
});
