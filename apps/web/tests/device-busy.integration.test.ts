import assert from 'node:assert/strict';
import { afterAll, beforeAll, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { integrationSuite } from '@xangarro/testing/integration';

import type * as DbModule from '../src/server/db';
import type * as RouteModule from '../src/server/api/device-route';

/**
 * A saturated pool answers a device 503 + Retry-After, not a hang (audit
 * DB3-SYNC-05, ADR-122). The real `db.ts` pool on real Postgres, cut to one
 * connection, held by a slow transaction; the device route's `withTenant`
 * must give up at the acquire deadline and say so in the contract's terms.
 *
 * Device authentication is stubbed — it is not what is under test, and a
 * signed device token would drag in the whole activation path.
 */
const { url, describe: suite } = integrationSuite();
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

vi.mock('../src/server/device/authenticate', () => ({
  authenticateDevice: async () => ({ businessId: BIZ, deviceId: 'dev-busy', userId: null }),
  DeviceAuthError: class extends Error {},
  RateLimitedError: class extends Error {},
}));
vi.mock('../src/server/observability/latency', () => ({ countApiLatency: () => undefined }));

suite('a device request when the pool is saturated', () => {
  const env = { ...process.env };
  let mod: typeof DbModule;
  let route: typeof RouteModule;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.DATABASE_POOL_MAX = '1';
    process.env.DEVICE_DB_DEADLINE_MS = '8000';
    mod = await import('../src/server/db');
    route = await import('../src/server/api/device-route');
    // Importing the route's graph fresh overran the 10 s hook default on a loaded machine.
  }, 30_000);

  afterAll(async () => {
    await mod?.db().$client.end({ timeout: 5 });
    process.env = env;
  });

  const request = () =>
    new Request('http://x/api/v1/sync/pull', { headers: { 'X-Xangarro-Protocol': '1' } });
  const handler = () =>
    route.deviceRoute(
      'test/busy',
      request(),
      async ({ businessId }) => {
        await mod.withTenant(businessId, (tx) => tx.execute(sql`SELECT 1`));
        return { response: new Response('{}', { status: 200 }) };
      },
      'no',
    );

  it('sheds at the acquire deadline with 503 and Retry-After', async () => {
    // The one connection, busy for longer than the acquire deadline (3 s).
    // Waits until it really holds it: on a loaded machine a fixed pause let
    // the device request win the connection first.
    let holding: () => void = () => undefined;
    const held = new Promise<void>((r) => {
      holding = r;
    });
    const holder = mod.withTenant(BIZ, async (tx) => {
      holding();
      await tx.execute(sql`SELECT pg_sleep(4.5)`);
    });
    await held;

    const started = performance.now();
    const res = await handler();
    const ms = performance.now() - started;

    assert.equal(res.status, 503);
    assert.equal(res.headers.get('Retry-After'), '15');
    assert.equal(((await res.json()) as { error: { code: string } }).error.code, 'INTERNAL');
    assert.ok(ms < 4_000, `answered in ${Math.round(ms)} ms, not after the holder`);
    await holder;
  }, 15_000);

  it('serves normally once the connection is free again', async () => {
    const res = await handler();
    assert.equal(res.status, 200);
  });
});
