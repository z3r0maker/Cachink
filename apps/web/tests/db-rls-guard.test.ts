import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * `server/db.ts` asks who it is connected as before it hands out a tenant
 * transaction (audit F-02): `withTenant`, `withExportTenant` and `withSession`
 * all wait for `ensureRlsBoundRole` on their own pool, and a refusal means no
 * transaction is opened at all. The guard itself — the query, the once-per-pool
 * cache — is `@xangarro/data-pg`'s, tested there against real roles.
 */
const order: string[] = [];
const passes = async (_pool: unknown) => {
  order.push('guard');
};
const guard = vi.fn(passes);
const transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
  order.push('transaction');
  return fn({ execute: async () => [] });
});

vi.mock('@xangarro/data-pg', () => ({
  createDb: vi.fn((_url: string, options?: { max?: number }) => ({
    pool: options?.max === 1 ? 'export' : 'app',
    transaction,
  })),
  withBusiness: vi.fn(async (_db: unknown, _biz: string, fn: (tx: unknown) => unknown) => {
    order.push('withBusiness');
    return fn({});
  }),
  ensureRlsBoundRole: (pool: unknown) => guard(pool),
}));
vi.mock('../src/server/auth', () => ({
  requireSession: async () => ({ sub: 'u1', business_id: 'biz-1', role: 'owner' }),
}));

const GLOBAL_KEYS = ['__xangarroDb', '__xangarroExportDb'] as const;
const clearGlobals = () => {
  for (const key of GLOBAL_KEYS) delete (globalThis as Record<string, unknown>)[key];
};

class Refused extends Error {
  readonly code = 'RLS_BYPASS_ROLE';
}

describe('the portal’s tenant path checks its role first', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard.mockImplementation(passes);
    vi.resetModules();
    clearGlobals();
    order.length = 0;
    vi.stubEnv('DATABASE_URL', 'postgres://app:app@localhost/xangarro');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearGlobals();
  });

  it('withTenant waits for the guard on the shared pool, then opens the transaction', async () => {
    const { withTenant, db } = await import('../src/server/db');
    assert.equal(await withTenant('biz-1', async () => 'hecho'), 'hecho');
    assert.deepEqual(order, ['guard', 'withBusiness']);
    assert.equal(guard.mock.calls[0]?.[0], db());
  });

  it('withExportTenant asks for the export pool, which is another pool', async () => {
    const { withExportTenant, db } = await import('../src/server/db');
    await withExportTenant('biz-1', async () => 1);
    assert.deepEqual(order, ['guard', 'withBusiness']);
    assert.deepEqual(guard.mock.calls[0]?.[0], { pool: 'export', transaction });
    assert.notEqual(guard.mock.calls[0]?.[0], db());
  });

  it('withSession waits for the guard before its transaction', async () => {
    const { withSession } = await import('../src/server/db');
    assert.equal(await withSession(async () => 7), 7);
    assert.deepEqual(order, ['guard', 'transaction']);
  });

  it('rlsBoundDb hands the shared pool over only after the guard (activation sets its own claim)', async () => {
    const { rlsBoundDb, db } = await import('../src/server/db');
    assert.equal(await rlsBoundDb(), db());
    assert.deepEqual(order, ['guard']);
    guard.mockRejectedValue(new Refused('postgres has SUPERUSER'));
    await assert.rejects(rlsBoundDb(), (e: unknown) => e instanceof Refused);
  });

  it('a refused role opens no transaction and runs no tenant code, on any of the three', async () => {
    guard.mockRejectedValue(new Refused('postgres has SUPERUSER'));
    const { withTenant, withExportTenant, withSession } = await import('../src/server/db');
    const body = vi.fn(async () => 'rows of every tenant');
    for (const run of [
      () => withTenant('biz-1', body),
      () => withExportTenant('biz-1', body),
      () => withSession(body),
    ]) {
      await assert.rejects(run(), (e: unknown) => e instanceof Refused);
    }
    assert.equal(body.mock.calls.length, 0);
    assert.deepEqual(order, []);
  });
});
