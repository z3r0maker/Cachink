import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  AuthCoreError,
  endSession,
  hashToken,
  issueSession,
  lookupSession,
  mintToken,
  type SessionStore,
} from '../src/index.js';

interface Row {
  subject: string;
  revoked: boolean;
}

function memoryStore(): SessionStore<string, string> & { rows: Map<string, Row> } {
  const rows = new Map<string, Row>();
  return {
    rows,
    open: async (h, subject) => void rows.set(h, { subject, revoked: false }),
    resolve: async (h) => {
      const r = rows.get(h);
      return r && !r.revoked ? r.subject : null;
    },
    revoke: async (h) => {
      const r = rows.get(h);
      if (r) r.revoked = true;
    },
  };
}

describe('issueSession', () => {
  it('stores only the hash and returns the raw token', async () => {
    const store = memoryStore();
    const token = await issueSession(store, 'staff-1', 3600);
    assert.deepEqual([...store.rows.keys()], [hashToken(token)]);
    assert.equal(store.rows.has(token), false);
  });

  it('passes the ttl through', async () => {
    let ttl = 0;
    const store = {
      ...memoryStore(),
      open: async (_h: string, _s: string, t: number) => void (ttl = t),
    };
    await issueSession(store, 's', 600);
    assert.equal(ttl, 600);
  });

  it('refuses a non-positive or fractional ttl', async () => {
    await assert.rejects(issueSession(memoryStore(), 's', 0), AuthCoreError);
    await assert.rejects(issueSession(memoryStore(), 's', -5), AuthCoreError);
    await assert.rejects(issueSession(memoryStore(), 's', 1.5), AuthCoreError);
  });

  it('propagates a store failure', async () => {
    const store = { ...memoryStore(), open: async () => Promise.reject(new Error('down')) };
    await assert.rejects(issueSession(store, 's', 60), /down/);
  });
});

describe('lookupSession', () => {
  it('finds a live session by its cookie value', async () => {
    const store = memoryStore();
    const token = await issueSession(store, 'staff-1', 3600);
    assert.equal(await lookupSession(store, token, 600), 'staff-1');
  });

  it('returns null for an unknown token', async () => {
    assert.equal(await lookupSession(memoryStore(), mintToken(), 600), null);
  });

  it('never asks the store about junk or missing cookies', async () => {
    let asked = false;
    const store = { ...memoryStore(), resolve: async () => ((asked = true), 'x') };
    for (const v of [undefined, null, '', 'short', `${mintToken()}!`]) {
      assert.equal(await lookupSession(store, v, 600), null);
    }
    assert.equal(asked, false);
  });

  it('refuses a bad idle time', async () => {
    await assert.rejects(lookupSession(memoryStore(), mintToken(), 0), AuthCoreError);
  });
});

describe('endSession', () => {
  it('revokes, so the same cookie no longer resolves', async () => {
    const store = memoryStore();
    const token = await issueSession(store, 'staff-1', 3600);
    await endSession(store, token);
    assert.equal(await lookupSession(store, token, 600), null);
  });

  it('is a no-op for a missing or junk cookie', async () => {
    let asked = false;
    const store = { ...memoryStore(), revoke: async () => void (asked = true) };
    await endSession(store, undefined);
    await endSession(store, 'junk');
    assert.equal(asked, false);
  });

  it('propagates a store failure, so logout never pretends to succeed', async () => {
    const store = { ...memoryStore(), revoke: async () => Promise.reject(new Error('down')) };
    await assert.rejects(endSession(store, mintToken()), /down/);
  });
});
