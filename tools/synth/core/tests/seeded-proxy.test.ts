import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterEach, beforeEach, describe, it } from 'vitest';

import { startApiProxy, type ApiProxy } from '../src/seeded/api-proxy';

/**
 * The phone's seeded bugs go through a proxy in front of the stack's API
 * (S-12): the capture app talks to the proxy, which passes everything on
 * except the request its rule takes. No emulator: a fake upstream stands in.
 */
let upstream: Server;
let hits: { method: string; path: string; body: string }[];
let seen: { host?: string; encoding?: string }[];
let proxy: ApiProxy | null;

beforeEach(async () => {
  hits = [];
  seen = [];
  proxy = null;
  upstream = createServer((rq, rs) => {
    let body = '';
    rq.on('data', (c: Buffer) => (body += c.toString()));
    rq.on('end', () => {
      hits.push({ method: rq.method ?? '', path: rq.url ?? '', body });
      seen.push({ host: rq.headers.host, encoding: rq.headers['accept-encoding'] });
      rs.writeHead(200, { 'content-type': 'application/json' });
      const users = [{ id: 'u1', permissions: { canCancelSales: false } }];
      rs.end(JSON.stringify(rq.url === '/api/activate' ? { users } : { ok: true, path: rq.url }));
    });
  });
  await new Promise<void>((r) => upstream.listen(0, '127.0.0.1', r));
});

afterEach(async () => {
  await proxy?.close();
  await new Promise<void>((r) => upstream.close(() => r()));
});

const base = () => `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
const PUSH = { methods: ['POST'], path: '/api/sync/push' } as const;
const via = (path: string, init?: RequestInit) =>
  fetch(`http://127.0.0.1:${proxy?.port}${path}`, init);

describe('startApiProxy', () => {
  it('passes every request its rule does not take through, body and all', async () => {
    proxy = await startApiProxy({
      upstream: base(),
      rule: { match: PUSH, effect: { status: 500 } },
    });
    const r = await via('/api/sync/pull?cursor=3', { method: 'POST', body: '{"a":1}' });
    assert.equal(r.status, 200);
    assert.deepEqual(hits, [{ method: 'POST', path: '/api/sync/pull?cursor=3', body: '{"a":1}' }]);
  });

  it('answers 500 for the save its rule takes, and the server never sees it', async () => {
    proxy = await startApiProxy({
      upstream: base(),
      rule: { match: PUSH, effect: { status: 500 } },
    });
    const r = await via('/api/sync/push', { method: 'POST', body: '{}' });
    assert.equal(r.status, 500);
    assert.deepEqual(hits, []);
  });

  it('holds the save its rule takes for the delay, then passes it on', async () => {
    proxy = await startApiProxy({
      upstream: base(),
      rule: { match: PUSH, effect: { delayMs: 120 } },
    });
    const t0 = Date.now();
    const r = await via('/api/sync/push', { method: 'POST', body: '{"d":[]}' });
    assert.ok(Date.now() - t0 >= 120, `${Date.now() - t0} ms`);
    assert.equal(r.status, 200);
    assert.equal(hits[0]?.body, '{"d":[]}');
  });

  it('rewrites the response it takes, asking upstream for a body it can read', async () => {
    const activate = { methods: ['POST'], path: '/api/activate' };
    proxy = await startApiProxy({
      upstream: base(),
      rule: { match: activate, effect: { rewrite: 'grant-cancel' } },
    });
    const r = await via('/api/activate', {
      method: 'POST',
      body: '{}',
      headers: { 'accept-encoding': 'gzip, br' },
    });
    assert.deepEqual(await r.json(), {
      users: [{ id: 'u1', permissions: { canCancelSales: true } }],
    });
    assert.equal(seen[0]?.encoding, 'identity');
  });

  it('keeps the caller’s Host: the portal checks server actions’ Origin against it', async () => {
    proxy = await startApiProxy({
      upstream: base(),
      rule: { match: PUSH, effect: { status: 500 } },
    });
    await via('/bienvenida');
    assert.equal(seen[0]?.host, `127.0.0.1:${proxy.port}`);
  });

  it('refuses an upstream outside this machine', async () => {
    await assert.rejects(
      startApiProxy({
        upstream: 'http://api.xangarro.mx',
        rule: { match: PUSH, effect: { status: 500 } },
      }),
      /api\.xangarro\.mx/,
    );
  });
});
