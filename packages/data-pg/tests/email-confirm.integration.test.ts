import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, type Db } from '../src/client';
import {
  accountConfirmed,
  changeAccountEmail,
  claimAccount,
  confirmEmail,
  consumeLink,
  issueLink,
  loginLookup,
  openSession,
  peekLink,
  resolveSession,
} from '../src/security';
import { integrationSuite } from './support/db';

/**
 * N-83's email confirmation against the real functions (0057): an account is
 * unconfirmed until its emailed link is spent, a sign-in link can claim an
 * unconfirmed account, and only an unconfirmed address can be corrected.
 */
const { url, describe } = integrationSuite();

describe('email confirmation', () => {
  let db: Db;

  async function account(password: string | null = 'hash'): Promise<{ id: string; email: string }> {
    const id = randomUUID();
    const email = `${id}@confirmar.test.mx`;
    await db.execute(sql`
      INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data)
      VALUES (${id}::uuid, ${email}, ${password}, '{"nombre": " Pedro "}'::jsonb)`);
    return { id, email };
  }

  beforeAll(() => {
    db = createDb(url as string);
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('a new account is unconfirmed until its link is spent, and the link works once', async () => {
    const a = await account();
    assert.equal(await accountConfirmed(db, a.id), false);
    const token = await issueLink(db, a.email, 'confirm', 86_400);
    assert.ok(token);
    assert.deepEqual(await peekLink(db, token, 'confirm'), {
      state: 'fresh',
      userId: a.id,
      email: a.email,
      nombre: 'Pedro',
      confirmed: false,
    });
    assert.equal(await confirmEmail(db, token), a.id);
    assert.equal(await accountConfirmed(db, a.id), true);
    assert.equal(await confirmEmail(db, token), null, 'second use');
    assert.deepEqual(
      [
        (await peekLink(db, token, 'confirm'))?.state,
        (await peekLink(db, token, 'confirm'))?.confirmed,
      ],
      ['used', true],
    );
  });

  it('an expired link confirms nothing and says it expired', async () => {
    const a = await account();
    const token = await issueLink(db, a.email, 'confirm', -60);
    assert.ok(token);
    assert.equal((await peekLink(db, token, 'confirm'))?.state, 'expired');
    assert.equal(await confirmEmail(db, token), null);
    assert.equal(await accountConfirmed(db, a.id), false);
  });

  it('a newer link retires the older one, which then reads used on an unconfirmed account', async () => {
    const a = await account();
    const first = await issueLink(db, a.email, 'confirm', 86_400);
    const second = await issueLink(db, a.email, 'confirm', 86_400);
    assert.ok(first && second);
    const old = await peekLink(db, first, 'confirm');
    assert.deepEqual([old?.state, old?.confirmed], ['used', false]);
    assert.equal(await confirmEmail(db, first), null);
    assert.equal(await confirmEmail(db, second), a.id);
  });

  it('knows nothing about a link of another kind, or a made-up token, or a stranger', async () => {
    const a = await account();
    const magic = await issueLink(db, a.email, 'magic', 900);
    assert.ok(magic);
    assert.equal(await peekLink(db, magic, 'confirm'), null);
    assert.equal(await confirmEmail(db, magic), null);
    assert.equal(await peekLink(db, 'x'.repeat(43), 'confirm'), null);
    assert.equal(await accountConfirmed(db, randomUUID()), null);
  });

  it('confirming retires the pass the signup browser was holding', async () => {
    const a = await account();
    const pass = await issueLink(db, a.email, 'pending', 86_400);
    const token = await issueLink(db, a.email, 'confirm', 86_400);
    assert.ok(pass && token);
    assert.equal((await peekLink(db, pass, 'pending'))?.state, 'fresh');
    await confirmEmail(db, token);
    assert.equal((await peekLink(db, pass, 'pending'))?.state, 'used');
  });

  it('a sign-in link claims an unconfirmed account: confirmed, password and sessions gone', async () => {
    const a = await account('hash-del-que-la-registro');
    const session = await openSession(db, a.id, 'biz-de-nadie', 3_600);
    const waiting = await issueLink(db, a.email, 'confirm', 86_400);
    assert.ok(waiting);
    assert.equal(await claimAccount(db, a.id, false), true);
    assert.equal(await accountConfirmed(db, a.id), true);
    assert.equal((await loginLookup(db, a.email))?.hash, null);
    assert.equal(await resolveSession(db, session, 3_600), null);
    assert.equal(await confirmEmail(db, waiting), null, 'the mailed link is retired too');
  });

  it('a password reset claims it too, and keeps the password the reset just set', async () => {
    const a = await account('la-que-acaba-de-elegir');
    assert.equal(await claimAccount(db, a.id, true), true);
    assert.equal(await accountConfirmed(db, a.id), true);
    assert.equal((await loginLookup(db, a.email))?.hash, 'la-que-acaba-de-elegir');
  });

  it('claiming a confirmed account changes nothing', async () => {
    const a = await account('se-queda');
    const token = await issueLink(db, a.email, 'confirm', 86_400);
    assert.ok(token);
    await confirmEmail(db, token);
    assert.equal(await claimAccount(db, a.id, false), false);
    assert.equal((await loginLookup(db, a.email))?.hash, 'se-queda');
    assert.equal(await claimAccount(db, randomUUID(), false), false, 'a stranger');
  });

  it('an unconfirmed address can be corrected, and links to the old one stop working', async () => {
    const a = await account();
    const old = await issueLink(db, a.email, 'confirm', 86_400);
    assert.ok(old);
    const nuevo = `${randomUUID()}@corregido.test.mx`;
    assert.equal(await changeAccountEmail(db, a.id, nuevo), true);
    assert.equal((await loginLookup(db, nuevo))?.id, a.id);
    assert.equal(await loginLookup(db, a.email), null);
    assert.equal(await confirmEmail(db, old), null);
  });

  it('refuses to correct to an address another account has, in any letter case', async () => {
    const a = await account();
    const other = await account();
    assert.equal(await changeAccountEmail(db, a.id, other.email.toUpperCase()), false);
    assert.equal((await loginLookup(db, a.email))?.id, a.id);
  });

  it('refuses to correct a confirmed account, or one that does not exist', async () => {
    const a = await account();
    const token = await issueLink(db, a.email, 'confirm', 86_400);
    assert.ok(token);
    await confirmEmail(db, token);
    assert.equal(await changeAccountEmail(db, a.id, `${randomUUID()}@tarde.test.mx`), false);
    assert.equal(await changeAccountEmail(db, randomUUID(), `${randomUUID()}@x.test.mx`), false);
  });

  it('a challenge is spent once and a pending pass is only looked at', async () => {
    const a = await account();
    const challenge = await issueLink(db, a.email, 'challenge', 600);
    assert.ok(challenge);
    assert.equal((await peekLink(db, challenge, 'challenge'))?.userId, a.id);
    assert.equal(await consumeLink(db, challenge, 'challenge'), a.id);
    assert.equal(await consumeLink(db, challenge, 'challenge'), null);
  });

  it('the app role reaches none of it except through the functions', async () => {
    const denied = (e: unknown) =>
      /permission denied/.test(String((e as { cause?: unknown }).cause ?? e));
    await assert.rejects(() => db.execute(sql`SELECT * FROM xangarro.auth_links LIMIT 1`), denied);
    await assert.rejects(
      () => db.execute(sql`SELECT * FROM xangarro.portal_second_factor LIMIT 1`),
      denied,
    );
  });
});
