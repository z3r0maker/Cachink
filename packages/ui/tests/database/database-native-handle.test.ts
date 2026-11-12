/**
 * The phone opens its SQLite file once per process (X-05).
 *
 * expo-sqlite 55 on Android hands a second `openDatabaseSync` of the same
 * file the same native connection, and when either JS wrapper is collected
 * it closes that connection under the other one: the survivor's next call
 * rejects with «NativeDatabase.prepareSync … NullPointerException». React's
 * StrictMode ran the provider's open twice on every dev launch, so the
 * opener must hand the second caller the first open, not a second one.
 */

import { afterEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  closeNativeHandle,
  openNativeOnce,
  registerNativeHandle,
} from '../../src/database/database-native-handle';

afterEach(() => closeNativeHandle());

/** An opener that counts its calls and resolves to a fresh token each time. */
function countingOpener(): { open: () => Promise<{ n: number }>; calls: () => number } {
  let calls = 0;
  return {
    open: async () => ({ n: ++calls }),
    calls: () => calls,
  };
}

function fakeHandle(): { handle: SQLiteDatabase; closed: () => number } {
  let closed = 0;
  const handle = { closeSync: () => void closed++ } as unknown as SQLiteDatabase;
  return { handle, closed: () => closed };
}

describe('openNativeOnce', () => {
  it('opens once for a mount, unmount and remount (StrictMode) and hands both the same db', async () => {
    const opener = countingOpener();
    const first = openNativeOnce(opener.open);
    const second = openNativeOnce(opener.open);
    assert.equal(first, second);
    assert.deepEqual(await second, { n: 1 });
    assert.equal(opener.calls(), 1);
  });

  it('still answers with the first open after it has resolved', async () => {
    const opener = countingOpener();
    await openNativeOnce(opener.open);
    assert.deepEqual(await openNativeOnce(opener.open), { n: 1 });
    assert.equal(opener.calls(), 1);
  });

  it('a failed open is not remembered: «Reintentar» opens again', async () => {
    let calls = 0;
    const flaky = async (): Promise<string> => {
      calls++;
      if (calls === 1) throw new Error('disk I/O error');
      return 'abierta';
    };
    await assert.rejects(openNativeOnce(flaky), /disk I\/O error/);
    assert.equal(await openNativeOnce(flaky), 'abierta');
    assert.equal(calls, 2);
  });

  it('a reset closes the handle and forgets the open, so the next one opens a new file', async () => {
    const opener = countingOpener();
    const { handle, closed } = fakeHandle();
    await openNativeOnce(opener.open);
    registerNativeHandle(handle);
    closeNativeHandle();
    assert.equal(closed(), 1);
    assert.deepEqual(await openNativeOnce(opener.open), { n: 2 });
  });

  it('a reset with nothing open is harmless and closes nothing twice', () => {
    const { handle, closed } = fakeHandle();
    registerNativeHandle(handle);
    closeNativeHandle();
    closeNativeHandle();
    assert.equal(closed(), 1);
  });
});
