/**
 * The device's anchored clock (Q9): `max(device clock, last server time)`,
 * read from app_config each time, so whoever decides by time (the plan, the
 * NIP lockout) cannot be moved back by setting the phone's date back.
 */

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { anchoredClock } from '../src/anchored-clock.js';
import { SYNC_CONFIG_KEYS } from '../src/sync-keys.js';

const SERVER = '2026-09-16T12:00:00.000Z';

function config(lastServerTime: string | null) {
  const asked: string[] = [];
  return {
    asked,
    get: async (key: string): Promise<string | null> => {
      asked.push(key);
      return lastServerTime;
    },
  };
}

describe('anchoredClock', () => {
  it('answers the server time when the device clock was set back', async () => {
    const clock = anchoredClock(config(SERVER), () => new Date('2026-09-15T12:00:00.000Z'));
    assert.equal((await clock()).toISOString(), SERVER);
  });

  it('answers the device clock when it is ahead of the last server time', async () => {
    const device = new Date('2026-09-16T12:05:00.000Z');
    const clock = anchoredClock(config(SERVER), () => device);
    assert.equal((await clock()).toISOString(), device.toISOString());
  });

  it('answers the device clock when no server time is stored, or it is unreadable', async () => {
    const device = new Date('2026-09-10T00:00:00.000Z');
    assert.equal(await anchoredClock(config(null), () => device)(), device);
    assert.equal(await anchoredClock(config('ayer'), () => device)(), device);
  });

  it('reads the stored server time on every call, under the sync key', async () => {
    const c = config(SERVER);
    const clock = anchoredClock(c, () => new Date(0));
    await clock();
    await clock();
    assert.deepEqual(c.asked, [SYNC_CONFIG_KEYS.lastServerTime, SYNC_CONFIG_KEYS.lastServerTime]);
  });

  it('uses the real clock when none is injected', async () => {
    const before = Date.now();
    const now = (await anchoredClock(config(null))()).getTime();
    assert.ok(now >= before && now <= Date.now());
  });
});
