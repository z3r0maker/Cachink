import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import {
  loginLookup,
  openSession,
  resolveSession,
  revokeSession,
  throttleClear,
  throttleFail,
  throttleKey,
  throttleTake,
  throttleWait,
} from '../src/security';
import { integrationSuite } from './support/db';

/**
 * B-17 and the security audit's SEC-AUTH-01/02, against the real functions.
 * Each test uses its own keys and its own throwaway member, so reruns and the
 * seeded tenants are unaffected.
 */
const { url, describe } = integrationSuite();
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0SECB1';

describe('security primitives', () => {
  let db: Db;
  const userId = randomUUID();
  const memberId = `01HZ8XQN9GZJXV8AKQ5X0M${Date.now().toString().slice(-4)}`.replace(
    /[ILOU]/g,
    'A',
  );

  beforeAll(async () => {
    db = createDb(url as string);
    await db.execute(sql`
      INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${`${userId}@test.mx`}, 'x')`);
    await withBusiness(db, BIZ, (tx) =>
      tx.execute(sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${memberId}, ${userId}, 'admin', ${BIZ}, now(), now())`),
    );
  });

  afterAll(async () => {
    // Cleanup runs as the owner: since 0036 the app role holds no DELETE
    // (DB-RLS-01), and that is the point, not an obstacle.
    const owner = createDb(process.env.DATABASE_SUPER_URL as string);
    await owner.execute(sql`DELETE FROM business_members WHERE id = ${memberId}`);
    await owner.$client.end({ timeout: 5 });
    await db?.$client.end({ timeout: 5 });
  });

  it('locks a key on the max-th failure, reports the wait, and clears', async () => {
    const key = throttleKey('test', randomUUID());
    const policy = { max: 3, window: 900, lockout: 600 };
    assert.equal(await throttleFail(db, key, policy), 0);
    assert.equal(await throttleFail(db, key, policy), 0);
    assert.equal(await throttleWait(db, key), 0, 'not locked before the max-th failure');
    assert.equal(await throttleFail(db, key, policy), 600);
    const wait = await throttleWait(db, key);
    assert.ok(wait > 590 && wait <= 600, `wait was ${wait}`);
    await throttleClear(db, key);
    assert.equal(await throttleWait(db, key), 0);
  });

  it('allows max takes per window, then says how long until the window ends', async () => {
    const key = throttleKey('test', randomUUID());
    for (let i = 0; i < 5; i += 1) assert.equal(await throttleTake(db, key, 5, 60), 0);
    const wait = await throttleTake(db, key, 5, 60);
    assert.ok(wait >= 1 && wait <= 60, `wait was ${wait}`);
  });

  it('never stores the subject, only its hash', async () => {
    assert.match(throttleKey('login', 'email', 'pedro@taqueria.mx'), /^[0-9a-f]{64}$/);
  });

  it('a session resolves to the member’s CURRENT role, and ends on revoke', async () => {
    const token = await openSession(db, userId, BIZ, 3600);
    assert.equal((await resolveSession(db, token, 600))?.role, 'admin');

    await withBusiness(db, BIZ, (tx) =>
      tx.execute(sql`UPDATE business_members SET role = 'viewer' WHERE id = ${memberId}`),
    );
    assert.equal(
      (await resolveSession(db, token, 600))?.role,
      'viewer',
      'a demotion applies at once',
    );

    await revokeSession(db, token);
    assert.equal(await resolveSession(db, token, 600), null, 'logout ends it server-side');
  });

  it('ends a session when the membership is removed, when expired, or when idle', async () => {
    const expired = await openSession(db, userId, BIZ, 0);
    assert.equal(await resolveSession(db, expired, 600), null);

    const idle = await openSession(db, userId, BIZ, 3600);
    await new Promise((r) => setTimeout(r, 1100));
    assert.equal(await resolveSession(db, idle, 1), null);

    const live = await openSession(db, userId, BIZ, 3600);
    // Removed by the owner: the app role cannot hard-delete a membership
    // (0036, DB-RLS-01); what matters here is that the session dies with it.
    const owner = createDb(process.env.DATABASE_SUPER_URL as string);
    await owner.execute(sql`DELETE FROM business_members WHERE id = ${memberId}`);
    await owner.$client.end({ timeout: 5 });
    assert.equal(await resolveSession(db, live, 600), null);
    assert.equal(await resolveSession(db, 'not-a-token', 600), null);
  });

  it('the app role reads one account’s hash through the lookup, and no hash directly', async () => {
    assert.equal((await loginLookup(db, `${userId}@test.mx`))?.hash, 'x');
    assert.equal(await loginLookup(db, 'nobody@test.mx'), null);
    await assert.rejects(
      db.execute(sql`SELECT encrypted_password FROM auth.users LIMIT 1`),
      (e: unknown) => (e as { cause?: { code?: string } }).cause?.code === '42501',
    );
  });
});
