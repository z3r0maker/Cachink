// @vitest-environment node
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { beforeAll, it } from 'vitest';

import { integrationSuite } from '../../src/integration.js';
import {
  addMember,
  asOwner,
  asTenant,
  FixtureDatabaseError,
  mintTenant,
  subscriptionIdOf,
  type Tenant,
} from '../../src/tenant/index.js';
import { UNREACHABLE, withEnv } from './env.js';

/**
 * The tenant factory against a real Postgres, through the app role, so every
 * insert passes the same RLS policy a request does. `test:db` runs it with
 * `REQUIRE_DB=1`; plain `pnpm test` skips it.
 */
const suite = integrationSuite();

suite.describe('@xangarro/testing/tenant: connections and the factory', () => {
  let a: Tenant;
  let b: Tenant;

  beforeAll(async () => {
    [a, b] = await Promise.all([mintTenant({ label: 'Uno' }), mintTenant({ label: 'Dos' })]);
  });

  const count = (biz: string, table: string) =>
    asTenant(biz, async (sql) =>
      Number((await sql`SELECT count(*) AS n FROM ${sql(table)}`)[0]?.n),
    );

  it('asTenant binds RLS to the tenant: each sees its own business and not the other', async () => {
    const seen = await asTenant(a.biz, (sql) => sql`SELECT id FROM businesses`);
    assert.deepEqual(
      seen.map((r) => r.id),
      [a.biz],
    );
    assert.equal(await count(b.biz, 'devices'), 1);
  });

  it('asTenant refuses a write for another business (the policy WITH CHECK)', async () => {
    const touched = await asTenant(
      a.biz,
      (sql) => sql`UPDATE devices SET nombre = 'x' WHERE business_id = ${b.biz} RETURNING id`,
    );
    assert.equal(touched.length, 0, 'the other tenant’s device is not even visible');
    await assert.rejects(
      asTenant(
        a.biz,
        (
          sql,
        ) => sql`INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
                     VALUES (${'01HZZZZZZZZZZZZZZZZZZZZZZZ'}, 'x', 'android', 'x', ${b.biz}, now(), now())`,
      ),
      /row-level security/,
    );
  });

  it('asTenant passes the callback’s error through and closes the connection anyway', async () => {
    await assert.rejects(
      asTenant(a.biz, async () => {
        throw new Error('callback failed');
      }),
      /callback failed/,
    );
    assert.equal(await count(a.biz, 'businesses'), 1, 'the next call still connects');
  });

  it('asTenant without DATABASE_URL fails with a typed error, before connecting', async () => {
    for (const url of [undefined, '']) {
      await withEnv({ DATABASE_URL: url }, () =>
        assert.rejects(
          asTenant(a.biz, async () => 1),
          (e: unknown) => {
            assert.ok(e instanceof FixtureDatabaseError);
            assert.equal(e.code, 'FIXTURE_DATABASE_UNSET');
            return true;
          },
        ),
      );
    }
  });

  it('asTenant and asOwner reject when the database is unreachable', async () => {
    await withEnv({ DATABASE_URL: UNREACHABLE }, () =>
      assert.rejects(
        asTenant(a.biz, async () => 1),
        /ECONNREFUSED/,
      ),
    );
    await withEnv({ DATABASE_SUPER_URL: UNREACHABLE }, () =>
      // postgres.js connects on the first query, so the callback has to run one.
      assert.rejects(
        asOwner((sql) => sql`SELECT 1`),
        /ECONNREFUSED/,
      ),
    );
  });

  it('asOwner reads across tenants, which is why only cleanups may use it', async () => {
    const rows = await asOwner(
      (sql) => sql`SELECT id FROM businesses WHERE id IN (${a.biz}, ${b.biz}) ORDER BY id`,
    );
    assert.equal(rows.length, 2);
  });

  it('mintTenant writes the owner, the business, the membership, one device and the plan', async () => {
    const rows = await asOwner(async (sql) => ({
      user: await sql`SELECT email FROM auth.users WHERE id = ${a.ownerId}::uuid`,
      member: await sql`SELECT role FROM business_members WHERE business_id = ${a.biz}`,
      sub: await sql`SELECT plan_id, status FROM subscriptions WHERE business_id = ${a.biz}`,
    }));
    assert.equal(rows.user[0]?.email, a.email);
    assert.deepEqual(
      rows.member.map((r) => r.role),
      ['owner'],
    );
    assert.deepEqual(
      rows.sub.map((r) => [r.plan_id, r.status]),
      [['xangarro', 'active']],
    );
  });

  it('mintTenant on the free plan writes no subscription at all (B-10)', async () => {
    const t = await mintTenant({ plan: 'free' });
    const subs = await asOwner(
      (sql) => sql`SELECT 1 FROM subscriptions WHERE business_id = ${t.biz}`,
    );
    assert.equal(subs.length, 0);
  });

  it('mintTenant moves the period for past_due and sets cancel_at when cancelling', async () => {
    const t = await mintTenant({ plan: 'xangarrito', status: 'past_due', cancelando: true });
    const [row] = await asOwner(
      (sql) => sql`SELECT status, cancel_at = current_period_end AS cancela,
                          current_period_end < now() + interval '3 days' AS pronto
                   FROM subscriptions WHERE stripe_subscription_id = ${subscriptionIdOf(t)}`,
    );
    assert.deepEqual({ ...row }, { status: 'past_due', cancela: true, pronto: true });
  });

  it('mintTenant with an existing owner adds a business to that account, not a new account', async () => {
    const second = await mintTenant({ owner: a, label: 'Sucursal', joinedAfter: 60 });
    assert.equal(second.ownerId, a.ownerId);
    const rows = await asOwner(
      (sql) => sql`SELECT count(*) AS n FROM auth.users WHERE email = ${a.email}`,
    );
    assert.equal(Number(rows[0]?.n), 1);
  });

  it('mintTenant rejects a value its columns refuse, instead of writing a wrong tenant', async () => {
    await assert.rejects(mintTenant({ joinedAfter: Number.NaN }), /interval/);
    await assert.rejects(mintTenant({ isrTasa: 1.5 }), /integer/);
  });

  it('a mint that fails halfway leaves nothing behind: no orphan owner account', async () => {
    const label = `Roto${randomUUID().replace(/-/g, '').slice(0, 10)}`;
    await assert.rejects(mintTenant({ label, isrTasa: 1.5 }), /integer/);
    const users = await asOwner((sql) => sql`SELECT 1 FROM auth.users WHERE nombre = ${label}`);
    assert.equal(users.length, 0);
  });

  it('mintTenant without DATABASE_URL fails before writing anything', async () => {
    await withEnv({ DATABASE_URL: undefined }, () =>
      assert.rejects(mintTenant(), FixtureDatabaseError),
    );
  });

  it('mintTenant whose billing database is unreachable rejects, and leaves the tenant without a plan', async () => {
    const label = `Sinplan${randomUUID().replace(/-/g, '').slice(0, 10)}`;
    await withEnv({ BILLING_DATABASE_URL: UNREACHABLE }, () =>
      assert.rejects(mintTenant({ label }), /ECONNREFUSED/),
    );
    const rows = await asOwner(
      (
        sql,
      ) => sql`SELECT b.id, (SELECT count(*) FROM subscriptions s WHERE s.business_id = b.id) AS subs
                   FROM businesses b WHERE b.nombre LIKE ${`${label} %`}`,
    );
    assert.equal(rows.length, 1, 'the tenant rows are written first');
    assert.equal(Number(rows[0]?.subs), 0, 'and the plan never arrives');
  });

  it('addMember adds a second account with its role, visible only in its business', async () => {
    const viewer = await addMember(a);
    const admin = await addMember(a, { role: 'admin', label: 'socia' });
    assert.notEqual(viewer.email, admin.email);
    assert.match(admin.email, /^socia-/);
    const roles = await asTenant(
      a.biz,
      (sql) =>
        sql`SELECT role FROM business_members WHERE user_id IN (${viewer.ownerId}, ${admin.ownerId}) ORDER BY role`,
    );
    assert.deepEqual(
      roles.map((r) => r.role),
      ['admin', 'viewer'],
    );
    const inB = await asTenant(
      b.biz,
      (sql) => sql`SELECT 1 FROM business_members WHERE user_id = ${viewer.ownerId}`,
    );
    assert.equal(inB.length, 0);
  });

  it('addMember rejects without a database, or with an unreachable one', async () => {
    await withEnv({ DATABASE_URL: undefined }, () =>
      assert.rejects(addMember(a), FixtureDatabaseError),
    );
    await withEnv({ DATABASE_URL: UNREACHABLE }, () =>
      assert.rejects(addMember(a), /ECONNREFUSED/),
    );
  });

  it('addMember twice never collides: each account gets its own stamped address', async () => {
    const many = await Promise.all(Array.from({ length: 5 }, () => addMember(b)));
    assert.equal(new Set(many.map((m) => m.email)).size, 5);
  });
});
