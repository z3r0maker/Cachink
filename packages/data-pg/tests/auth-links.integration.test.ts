import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import {
  consumeMagicLink,
  issueLink,
  loginLookup,
  openSession,
  resetPassword,
  resolveSession,
} from '../src/security';
import { integrationSuite } from './support/db';

/**
 * ADR-080's emailed links against the real functions: single use, expiry, the
 * newest link wins, and a reset sets the password and ends every session.
 */
const { url, describe } = integrationSuite();
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0SECB1';

describe('emailed links', () => {
  let db: Db;
  const userId = randomUUID();
  const email = `${userId}@links.test.mx`;

  const memberId = `01HZ8XQN9GZJXV8AKQ5X0L${Date.now().toString().slice(-4)}`;

  beforeAll(async () => {
    db = createDb(url as string);
    await db.execute(sql`
      INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, 'old')`);
    await withBusiness(db, BIZ, (tx) =>
      tx.execute(sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${memberId}, ${userId}, 'viewer', ${BIZ}, now(), now())`),
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

  it('issues nothing for an unknown address', async () => {
    assert.equal(await issueLink(db, `${randomUUID()}@nadie.mx`, 'magic', 900), null);
  });

  it('a sign-in link works once', async () => {
    const token = await issueLink(db, email, 'magic', 900);
    assert.ok(token);
    assert.equal(await consumeMagicLink(db, token), userId);
    assert.equal(await consumeMagicLink(db, token), null, 'second use');
  });

  it('an expired link is refused', async () => {
    const token = await issueLink(db, email, 'magic', 0);
    assert.ok(token);
    assert.equal(await consumeMagicLink(db, token), null);
  });

  it('a new link retires the earlier unused one; kinds do not mix', async () => {
    const first = await issueLink(db, email, 'magic', 900);
    const second = await issueLink(db, email, 'magic', 900);
    const reset = await issueLink(db, email, 'reset', 900);
    assert.ok(first && second && reset);
    assert.equal(await consumeMagicLink(db, first), null, 'retired');
    assert.equal(await consumeMagicLink(db, reset), null, 'a reset link is not a sign-in link');
    assert.equal(await consumeMagicLink(db, second), userId);
  });

  it('a reset sets the hash, ends every session, and works once', async () => {
    const session = await openSession(db, userId, BIZ, 3600);
    assert.ok(await resolveSession(db, session, 600));
    const token = await issueLink(db, email, 'reset', 900);
    assert.ok(token);
    assert.equal(await resetPassword(db, token, 'new-hash'), userId);
    assert.equal((await loginLookup(db, email))?.hash, 'new-hash');
    assert.equal(await resolveSession(db, session, 600), null, 'the old session ended');
    assert.equal(await resetPassword(db, token, 'again'), null, 'second use');
  });
});
