/**
 * DB2-DEV-02: the engine at the evening peak — backoff after a failed run,
 * the server's Retry-After, pull throttled after captures, and a capture that
 * arrives mid-run is never folded into a run that already read the outbox.
 */

import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { Delta } from '@xangarro/contracts';
import { startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import { ApiClient, type ApiClientOptions } from '../src/api-client.js';
import { PULL_AFTER_CAPTURE_MS, SyncEngine } from '../src/sync-engine.js';
import { RUN_BACKOFF_BASE_MS } from '../src/backoff.js';
import { StatusStore } from '../src/status-store.js';
import { activatedDevice, ringSale, type Device } from './helpers/device.js';

let mock: RunningMock;
beforeAll(async () => {
  mock = await startMockServer(0);
});
afterAll(async () => {
  await mock.close();
});

/** Counts calls; answers `failWith` instead of reaching the mock while set. */
class Probe extends ApiClient {
  pushes = 0;
  pulls = 0;
  failWith: { status: number; code: string; retryAfter?: string } | null = null;
  gate: Promise<void> | null = null;
  constructor(opts: ApiClientOptions) {
    super(opts);
  }
  override async push(token: string, deltas: readonly Delta[]) {
    this.pushes += 1;
    return this.failWith ? this.#fail() : super.push(token, deltas);
  }
  override async pull(token: string, since: number) {
    this.pulls += 1;
    if (this.gate) await this.gate;
    return this.failWith ? this.#fail() : super.pull(token, since);
  }
  #fail() {
    const f = this.failWith!;
    const retryAfterMs = f.retryAfter ? Number(f.retryAfter) * 1000 : undefined;
    return { ok: false as const, status: f.status, code: f.code, message: 'x', retryAfterMs };
  }
}

function setup(d: Device) {
  const clock = { ms: Date.parse('2026-09-16T23:00:00.000Z') };
  const client = new Probe({ baseUrl: mock.url });
  const engine = new SyncEngine({
    db: d.db,
    client,
    getToken: async () => d.token,
    now: () => new Date(clock.ms),
    random: () => 1,
  });
  return { clock, client, engine };
}

describe('SyncEngine · backoff after a failed run', () => {
  it('defers automatic runs until the backoff ends, but not a manual one', async () => {
    const d = await activatedDevice(mock.url);
    await ringSale(d);
    const { clock, client, engine } = setup(d);
    client.failWith = { status: 503, code: 'INTERNAL' };
    const failed = await engine.pushOnly();
    assert.equal(failed.push?.error?.code, 'INTERNAL');
    assert.equal(failed.retryAt, new Date(clock.ms + RUN_BACKOFF_BASE_MS).toISOString());
    const deferred = await engine.pushOnly();
    assert.deepEqual(
      [deferred.deferred, deferred.push?.error?.code, client.pushes],
      [true, 'INTERNAL', 1],
    );
    await engine.pushOnly({ manual: true });
    assert.equal(client.pushes, 2, 'a person asking skips the engine backoff');
    client.failWith = null;
    clock.ms += RUN_BACKOFF_BASE_MS * 2 + 1; // the manual failure doubled it
    const ok = await engine.pushOnly();
    assert.deepEqual(
      [ok.deferred ?? false, ok.push?.accepted, ok.retryAt ?? null],
      [false, 2, null],
    );
  });

  it('honours Retry-After even when a person asks', async () => {
    const d = await activatedDevice(mock.url);
    await ringSale(d);
    const { clock, client, engine } = setup(d);
    client.failWith = { status: 429, code: 'RATE_LIMITED', retryAfter: '120' };
    const limited = await engine.syncNow();
    assert.ok(Date.parse(limited.retryAt ?? '') >= clock.ms + 120_000);
    client.failWith = null;
    clock.ms += 60_000;
    assert.equal((await engine.syncNow({ manual: true })).deferred, true);
    clock.ms += 90_000;
    const ok = await engine.syncNow({ manual: true });
    assert.deepEqual([ok.deferred ?? false, ok.push?.error, ok.pull?.error], [false, null, null]);
  });
});

describe('SyncEngine · capture', () => {
  it('pushes every capture but pulls at most once per interval', async () => {
    const d = await activatedDevice(mock.url);
    const { clock, client, engine } = setup(d);
    await ringSale(d);
    const first = await engine.capture();
    assert.deepEqual([first.push?.accepted, first.pull?.error], [2, null]);
    const pullsAfterFirst = client.pulls;
    await ringSale(d);
    clock.ms += 10_000;
    const second = await engine.capture();
    assert.deepEqual(
      [second.push?.accepted, second.pull, client.pulls],
      [2, null, pullsAfterFirst],
    );
    await ringSale(d);
    clock.ms += PULL_AFTER_CAPTURE_MS;
    const third = await engine.capture();
    assert.deepEqual([third.push?.accepted, third.pull?.error], [2, null]);
    assert.ok(client.pulls > pullsAfterFirst);
  });

  it('runs again after the in-flight run when a capture arrives mid-run', async () => {
    const d = await activatedDevice(mock.url);
    const { client, engine } = setup(d);
    await ringSale(d);
    let release = (): void => undefined;
    client.gate = new Promise<void>((r) => (release = r));
    const first = engine.capture(); // pushes the sale, then waits in its pull
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(client.pulls, 1, 'the first run has already read the outbox');
    await ringSale(d);
    const second = engine.capture();
    const third = engine.capture();
    client.gate = null;
    release();
    const [a, b, c] = await Promise.all([first, second, third]);
    assert.notEqual(a, b);
    assert.equal(b, c, 'captures queued behind one run share one trailing run');
    assert.deepEqual([a.push?.accepted, b.push?.accepted], [2, 2]);
    assert.deepEqual(await new StatusStore(d.db).countByStatus(), {
      pending: 0,
      rejected: 0,
      retrying: 0,
    });
  });
});
