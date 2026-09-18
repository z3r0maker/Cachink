import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';

import { createDb, type Db } from '../src/client';
import { accountEmailTaken, createAccount, loginLookup } from '../src/security';
import { integrationSuite } from './support/db';

/**
 * 0018: sign-up creates its identity through SECURITY DEFINER functions, so
 * the app role needs no grant on `auth.users` — hosted Supabase gives none.
 */
const { url, describe } = integrationSuite();

describe('account_create / account_email_taken', () => {
  let db: Db;
  const email = `alta-${randomUUID()}@test.mx`;

  beforeAll(() => {
    db = createDb(url as string);
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('a new address is free, then created with its hash', async () => {
    assert.equal(await accountEmailTaken(db, email), false);
    const id = randomUUID();
    const at = new Date().toISOString();
    assert.equal(await createAccount(db, { id, email, passwordHash: 'hash-1', at }), true);
    assert.deepEqual(await loginLookup(db, email), { id, email, hash: 'hash-1' });
  });

  it('the address is then taken, whatever its case', async () => {
    assert.equal(await accountEmailTaken(db, email.toUpperCase()), true);
  });

  it('a second account with the same address is refused, not an error', async () => {
    const at = new Date().toISOString();
    assert.equal(
      await createAccount(db, { id: randomUUID(), email, passwordHash: 'hash-2', at }),
      false,
    );
    assert.equal((await loginLookup(db, email))?.hash, 'hash-1');
  });

  it('a reused id is refused too', async () => {
    const id = randomUUID();
    const at = new Date().toISOString();
    const other = `otro-${randomUUID()}@test.mx`;
    assert.equal(await createAccount(db, { id, email: other, passwordHash: 'x', at }), true);
    assert.equal(
      await createAccount(db, {
        id,
        email: `tercero-${randomUUID()}@test.mx`,
        passwordHash: 'x',
        at,
      }),
      false,
    );
  });
});
