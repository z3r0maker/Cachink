import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, type Db } from '../src/client';
import {
  assertRlsBoundRole,
  ensureRlsBoundRole,
  RlsBypassRoleError,
} from '../src/security/rls-role';
import { integrationSuite } from './support/db';

/**
 * The runtime guard on real roles (audit F-02). Tenant isolation is RLS alone,
 * and a superuser or BYPASSRLS role reads every tenant without an error — so
 * the portal asks Postgres who it is before its first tenant transaction.
 *
 * The four logins the apps use must pass; the superuser the migrations run as
 * must not. A role with BYPASSRLS and nothing else is made for the test and
 * dropped after it.
 */
const { url, describe } = integrationSuite();

const BYPASS_ROLE = 'xg_test_bypassrls';

const withRole = (base: string, role: string, password = role): string => {
  const u = new URL(base);
  u.username = role;
  u.password = password;
  return u.toString();
};

describe('the connected role may not bypass RLS', () => {
  const pools: Db[] = [];
  let su: postgres.Sql;
  const open = (connection: string): Db => {
    const db = createDb(connection, { max: 1 });
    pools.push(db);
    return db;
  };

  beforeAll(async () => {
    su = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => undefined });
    await su.unsafe(`DROP ROLE IF EXISTS ${BYPASS_ROLE}`);
    await su.unsafe(`CREATE ROLE ${BYPASS_ROLE} LOGIN PASSWORD '${BYPASS_ROLE}' BYPASSRLS`);
  });

  afterAll(async () => {
    await Promise.all(pools.map((db) => db.$client.end({ timeout: 5 })));
    await su?.unsafe(`DROP ROLE IF EXISTS ${BYPASS_ROLE}`);
    await su?.end({ timeout: 5 });
  });

  it('passes the app role the portal connects as', async () => {
    await assertRlsBoundRole(open(url as string));
  });

  it('passes the billing, metering and admin logins: they cross tenants by policy, not by bypass', async () => {
    for (const role of ['xangarro_billing', 'xangarro_metering', 'xangarro_admin']) {
      await assertRlsBoundRole(open(withRole(url as string, role)));
    }
  });

  it('refuses the superuser URL with a typed error that names the role, never the URL', async () => {
    const superUrl = process.env.DATABASE_SUPER_URL as string;
    await assert.rejects(assertRlsBoundRole(open(superUrl)), (e: unknown) => {
      assert.ok(e instanceof RlsBypassRoleError);
      assert.equal(e.code, 'RLS_BYPASS_ROLE');
      assert.equal(e.attribute, 'SUPERUSER');
      assert.equal(e.role, 'postgres');
      const { password, host } = new URL(superUrl);
      assert.ok(!e.message.includes('://') && !e.message.includes(host), 'no URL in the message');
      assert.ok(!e.message.includes(`:${password}@`), 'no credential in the message');
      return true;
    });
  });

  it('refuses a role whose only fault is BYPASSRLS', async () => {
    const db = open(withRole(url as string, BYPASS_ROLE));
    await assert.rejects(
      assertRlsBoundRole(db),
      (e: unknown) => e instanceof RlsBypassRoleError && e.attribute === 'BYPASSRLS',
    );
  });

  it('asks a real pool once and keeps the refusal', async () => {
    const db = open(process.env.DATABASE_SUPER_URL as string);
    await assert.rejects(ensureRlsBoundRole(db), RlsBypassRoleError);
    await db.$client.end({ timeout: 5 });
    // The pool is closed: a second question would fail differently.
    await assert.rejects(ensureRlsBoundRole(db), RlsBypassRoleError);
  });
});
