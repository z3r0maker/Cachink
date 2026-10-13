import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `server/db.ts` must hand out one pool per process.
 *
 * Under `next dev` each route bundle re-evaluates the module, so a cache that
 * lives only in module scope opens a fresh 5-connection pool per evaluation.
 * These tests stand in for that re-evaluation with `vi.resetModules()`.
 */

vi.mock('@xangarro/data-pg', () => ({
  createDb: vi.fn(() => ({ pool: Symbol('pool') })),
  withBusiness: vi.fn(),
}));

const GLOBAL_KEY = '__xangarroDb';
type DbGlobal = { [GLOBAL_KEY]?: unknown };

async function load() {
  const dataPg = await import('@xangarro/data-pg');
  const mod = await import('../src/server/db');
  return { createDb: vi.mocked(dataPg.createDb), db: mod.db, mod };
}

function clearGlobal(): void {
  delete (globalThis as DbGlobal)[GLOBAL_KEY];
}

describe('db() singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    clearGlobal();
    vi.stubEnv('DATABASE_URL', 'postgres://app:app@localhost:55432/xangarro');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearGlobal();
  });

  it('returns the same instance on repeated calls', async () => {
    const { createDb, db } = await load();
    const first = db();
    assert.equal(db(), first);
    assert.equal(createDb.mock.calls.length, 1);
  });

  it('reuses the global across a fresh module evaluation in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const first = (await load()).db();

    vi.resetModules();
    const { createDb, db } = await load();

    assert.equal(db(), first);
    assert.equal(createDb.mock.calls.length, 1);
    assert.equal((globalThis as DbGlobal)[GLOBAL_KEY], first);
  });

  it('keeps the cache in module scope in production and leaves the global alone', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const first = (await load()).db();
    assert.equal((globalThis as DbGlobal)[GLOBAL_KEY], undefined);

    vi.resetModules();
    const { createDb, db } = await load();

    assert.notEqual(db(), first);
    assert.equal(createDb.mock.calls.length, 2);
  });

  it('throws a pointed error when DATABASE_URL is missing', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const { createDb, db } = await load();
    assert.throws(() => db(), /DATABASE_URL is not set/);
    assert.equal(createDb.mock.calls.length, 0);
  });
});

describe('db() refusal and the export pool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    clearGlobal();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearGlobal();
  });

  it('refuses to guess without DATABASE_URL, telling you how to start one', async () => {
    delete process.env.DATABASE_URL;
    const { db } = await load();
    assert.throws(() => db(), /DATABASE_URL is not set/);
    assert.throws(() => db(), /db:up/);
  });

  it('the export pool is its own, of one connection, and memoised the same way', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://app:app@localhost/xangarro');
    const { createDb, mod } = await load();
    const a = mod.withExportTenant('biz-1', async () => 1);
    const b = mod.withExportTenant('biz-1', async () => 2);
    await Promise.all([a, b]);
    assert.equal(createDb.mock.calls.length, 1);
    assert.deepEqual(createDb.mock.calls[0]?.[1], { max: 1 }, 'one connection for exports');
    void mod;
  });

  it('withTenant runs through withBusiness on the shared pool', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://app:app@localhost/xangarro');
    const dataPg = await import('@xangarro/data-pg');
    vi.mocked(dataPg.withBusiness).mockImplementation(async (_db, _biz, fn) => fn({} as never));
    const { mod } = await load();
    const r = await mod.withTenant('biz-1', async () => 'hecho');
    assert.equal(r, 'hecho');
    expect(dataPg.withBusiness).toHaveBeenCalled();
  });
});
