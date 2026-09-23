import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

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
  return { createDb: vi.mocked(dataPg.createDb), db: mod.db };
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
