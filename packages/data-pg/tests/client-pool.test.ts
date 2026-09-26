import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { createDb, poolMax } from '../src/client';

/** DB2-CONN-01: small pools that let go, sized per process. */
describe('createDb pool', () => {
  it('defaults to 2 connections, and takes DATABASE_POOL_MAX when it is a positive integer', () => {
    assert.equal(poolMax(undefined), 2);
    assert.equal(poolMax('5'), 5);
    assert.equal(poolMax('1'), 1);
  });

  it('falls back to 2 on a value that is not a positive integer', () => {
    for (const bad of ['', ' ', '0', '-3', '2.5', 'many']) assert.equal(poolMax(bad), 2, bad);
  });

  it('opens a pool that times out idle and slow connections — without connecting', async () => {
    const db = createDb('postgres://nobody:x@127.0.0.1:1/none', { max: 1 });
    const options = db.$client.options as unknown as Record<string, unknown>;
    assert.equal(options['max'], 1);
    assert.equal(options['idle_timeout'], 20);
    assert.equal(options['connect_timeout'], 10);
    assert.equal(options['prepare'], false);
    await db.$client.end({ timeout: 0 });
  });
});
