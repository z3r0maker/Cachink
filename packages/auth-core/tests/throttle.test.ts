import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'vitest';

import {
  guardAttempt,
  LOGIN_PER_EMAIL,
  LOGIN_PER_IP,
  throttleKey,
  type FailurePolicy,
  type ThrottleStore,
  type ThrottleSubject,
} from '../src/index.js';

/** A store with the same semantics as `xangarro.throttle_*`, on a fake clock. */
function memoryStore(): ThrottleStore & { readonly now: { t: number } } {
  const now = { t: 0 };
  const rows = new Map<string, { start: number; hits: number; locked: number }>();
  return {
    now,
    wait: async (key) => Math.max(0, (rows.get(key)?.locked ?? 0) - now.t),
    fail: async (key, p: FailurePolicy) => {
      const r = rows.get(key);
      const fresh = !r || r.start < now.t - p.window;
      const row = fresh ? { start: now.t, hits: 1, locked: 0 } : { ...r, hits: r.hits + 1 };
      if (row.hits >= p.max) {
        rows.set(key, { start: now.t, hits: 0, locked: now.t + p.lockout });
        return p.lockout;
      }
      rows.set(key, row);
      return 0;
    },
    clear: async (key) => void rows.delete(key),
  };
}

const subjects = (email: string, ip: string): ThrottleSubject[] => [
  { key: throttleKey('login', 'email', email), policy: LOGIN_PER_EMAIL, clearOnSuccess: true },
  { key: throttleKey('login', 'ip', ip), policy: LOGIN_PER_IP, clearOnSuccess: false },
];

const wrong = async () => null;
const right = async () => 'ana';

describe('throttleKey', () => {
  it('is the SHA-256 of the parts joined by ":" — the portal’s exact keys', () => {
    const expected = createHash('sha256').update('login:email:ana@x.mx').digest('hex');
    assert.equal(throttleKey('login', 'email', 'ana@x.mx'), expected);
  });

  it('never contains the subject itself', () => {
    assert.doesNotMatch(throttleKey('login', 'ip', '10.0.0.1'), /10\.0\.0\.1/);
  });

  it('separates apps by prefix', () => {
    assert.notEqual(throttleKey('admin', 'login', 'a'), throttleKey('login', 'email', 'a'));
  });
});

describe('guardAttempt', () => {
  it('returns the value of a successful attempt', async () => {
    const r = await guardAttempt(memoryStore(), subjects('a', '1'), right);
    assert.deepEqual(r, { kind: 'ok', value: 'ana' });
  });

  it('reports a wrong credential as failed until the account locks on the 5th', async () => {
    const store = memoryStore();
    for (let i = 0; i < 4; i++) {
      assert.deepEqual(await guardAttempt(store, subjects('a', '1'), wrong), { kind: 'failed' });
    }
    const fifth = await guardAttempt(store, subjects('a', '1'), wrong);
    assert.deepEqual(fifth, { kind: 'locked', wait: LOGIN_PER_EMAIL.lockout });
  });

  it('refuses while locked without even running the attempt', async () => {
    const store = memoryStore();
    for (let i = 0; i < 5; i++) await guardAttempt(store, subjects('a', '1'), wrong);
    let ran = false;
    const r = await guardAttempt(store, subjects('a', '1'), async () => ((ran = true), 'ana'));
    assert.equal(r.kind, 'locked');
    assert.equal(ran, false);
  });

  it('locks an IP spraying many accounts, across accounts', async () => {
    const store = memoryStore();
    for (let i = 0; i < 19; i++) await guardAttempt(store, subjects(`u${i}`, 'ip'), wrong);
    const r = await guardAttempt(store, subjects('u19', 'ip'), wrong);
    assert.deepEqual(r, { kind: 'locked', wait: LOGIN_PER_IP.lockout });
    assert.equal((await guardAttempt(store, subjects('fresh', 'ip'), right)).kind, 'locked');
  });

  it('clears the account’s counter on success but not the IP’s', async () => {
    const store = memoryStore();
    for (let i = 0; i < 4; i++) await guardAttempt(store, subjects('a', 'ip'), wrong);
    await guardAttempt(store, subjects('a', 'ip'), right);
    for (let i = 0; i < 4; i++) {
      assert.deepEqual(await guardAttempt(store, subjects('a', 'ip'), wrong), { kind: 'failed' });
    }
  });

  it('lets the account try again once the lockout has passed', async () => {
    const store = memoryStore();
    for (let i = 0; i < 5; i++) await guardAttempt(store, subjects('a', '1'), wrong);
    store.now.t += LOGIN_PER_EMAIL.lockout;
    assert.equal((await guardAttempt(store, subjects('a', '1'), right)).kind, 'ok');
  });

  it('propagates a store failure instead of letting the attempt through', async () => {
    const broken: ThrottleStore = {
      wait: async () => Promise.reject(new Error('db down')),
      fail: async () => 0,
      clear: async () => undefined,
    };
    await assert.rejects(guardAttempt(broken, subjects('a', '1'), right), /db down/);
  });
});
