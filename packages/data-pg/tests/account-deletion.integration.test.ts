import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import {
  eraseAccount,
  markDeletionReminded,
  openAccountDeletions,
  openSession,
  peekAccountDeletion,
  requestAccountDeletion,
  resolveSession,
  undoAccountDeletion,
} from '../src/security';
import { integrationSuite } from './support/db';

/**
 * `0051_account_deletion.sql` (ADR-136) against real Postgres, as the app
 * role: an owner with two businesses and a membership in a third asks to be
 * deleted; everything closes at once; the link undoes it; asked again and
 * left 30 days, the erase removes every tenant row but the billing and CFDI
 * ones, the memberships elsewhere and the account. Rows the seed never has
 * (two businesses, a CFDI payment, a subscription) are built here.
 */
const { url, describe } = integrationSuite();
const stamp = Date.now().toString(36).toUpperCase().padStart(10, '0').slice(-10);
const id = (tag: string) => `01HZ8XQN9GZJX${tag}${stamp}`.slice(0, 26);
const A = id('DELA');
/** Drizzle wraps Postgres's error; the message that matters is on `cause`. */
const pg = (re: RegExp) => (e: unknown) =>
  re.test(String((e as { cause?: Error }).cause?.message ?? (e as Error).message));
const B = id('DELB');
const OTHER = id('DELO');

describe('account deletion', () => {
  let db: Db;
  let su: postgres.Sql;
  const owner = randomUUID();
  const neighbour = randomUUID();
  let session = '';
  let token = '';

  const memberships = async (user: string) =>
    [
      ...(await db.execute<{ business_id: string }>(
        sql`SELECT business_id FROM xangarro.memberships_for_user(${user})`,
      )),
    ].map((r) => r.business_id);

  async function business(biz: string, user: string, role: string) {
    await withBusiness(db, biz, async (tx) => {
      await tx.execute(sql`
        INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, rfc, created_at, updated_at)
        VALUES (${biz}, ${`Negocio ${biz.slice(-4)}`}, 'RESICO', 125, ${biz}, ${`${biz}D`}, 'XAXX010101000', now(), now())`);
      await tx.execute(sql`
        INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
        VALUES (${`${biz}D`}, 'Caja', 'android', 'x', ${biz}, now(), now())`);
      await tx.execute(sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${`${biz}M${user.slice(0, 4)}`}, ${user}, ${role}, ${biz}, now(), now())`);
    });
  }

  beforeAll(async () => {
    db = createDb(url as string);
    su = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => undefined });
    for (const [u, e] of [
      [owner, 'duena'],
      [neighbour, 'vecino'],
    ] as const) {
      await db.execute(sql`
        INSERT INTO auth.users (id, email, encrypted_password) VALUES (${u}::uuid, ${`${e}-${stamp}@del.mx`}, 'x')`);
    }
    await business(A, owner, 'owner');
    await business(B, owner, 'owner');
    await business(OTHER, neighbour, 'owner');
    await su`INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
             VALUES (${`${OTHER}V`}, ${owner}, 'viewer', ${OTHER}, now(), now())`;
    await su`INSERT INTO subscriptions (stripe_subscription_id, business_id, stripe_customer_id, plan_id,
               interval, status, stripe_status, collection_method)
             VALUES (${`sub_${stamp}`}, ${A}, ${`cus_${stamp}`}, 'xangarro', 'month', 'active', 'active',
               'charge_automatically')`;
    await su`INSERT INTO cfdi_payments (external_payment_id, business_id, route, status, total_centavos,
               paid_at, period, forma_pago, description)
             VALUES (${`in_${stamp}`}, ${A}, 'stripe', 'recorded', 23084, now(), '2026-10', '04', 'Plan')`;
    session = await openSession(db, owner, A, 3600);
  });

  afterAll(async () => {
    await su?.end({ timeout: 5 });
    await db?.$client.end({ timeout: 5 });
  });

  it('old → new: an account with no request signs in as before', async () => {
    assert.deepEqual((await memberships(owner)).sort(), [A, B, OTHER].sort());
    assert.ok(await resolveSession(db, session, 600));
  });

  it('a request closes every owned business, every device and session, and signs in nowhere', async () => {
    const r = await requestAccountDeletion(db, {
      userId: owner,
      email: 'duena@del.mx',
      stoppedRenewals: [`sub_${stamp}`],
      days: 30,
    });
    token = r.undoToken;
    assert.match(r.folio, /^EL-[0-9A-F]{6}$/);
    assert.deepEqual([...r.businessIds].sort(), [A, B].sort(), 'only the owned ones');
    const days = (Date.parse(r.eraseAt) - Date.now()) / 86_400_000;
    assert.ok(days > 29.9 && days <= 30, `erase in 30 days, got ${days}`);
    assert.deepEqual(await memberships(owner), [], 'no business to sign in to, not even OTHER');
    assert.equal(await resolveSession(db, session, 600), null);
    const [s] = await su<{ closed: number; live: number }[]>`
      SELECT (SELECT count(*)::int FROM businesses WHERE id IN (${A}, ${B}) AND deleted_at IS NOT NULL) AS closed,
             (SELECT count(*)::int FROM devices WHERE business_id IN (${A}, ${B}) AND revoked_at IS NULL) AS live`;
    assert.deepEqual({ ...s }, { closed: 2, live: 0 });
    assert.deepEqual(await memberships(neighbour), [OTHER], 'the neighbour is untouched');
  });

  it('a second request while one is open is refused', async () => {
    await assert.rejects(
      requestAccountDeletion(db, {
        userId: owner,
        email: 'x@del.mx',
        stoppedRenewals: [],
        days: 30,
      }),
    );
  });

  it('the link shows the request; spending it reopens the businesses, once', async () => {
    const view = await peekAccountDeletion(db, token);
    assert.equal(view?.estado, 'pendiente');
    assert.equal(view?.negocios.length, 2);
    const undone = await undoAccountDeletion(db, token);
    assert.deepEqual(undone?.stoppedRenewals, [`sub_${stamp}`]);
    assert.deepEqual((await memberships(owner)).sort(), [A, B, OTHER].sort());
    assert.equal(await undoAccountDeletion(db, token), null, 'single-use');
    assert.equal((await peekAccountDeletion(db, token))?.estado, 'vencido');
    assert.equal(await peekAccountDeletion(db, 'not-a-token'), null);
  });

  it('the erase refuses a request that is not due', async () => {
    const r = await requestAccountDeletion(db, {
      userId: owner,
      email: 'duena@del.mx',
      stoppedRenewals: [],
      days: 30,
    });
    token = r.undoToken;
    await assert.rejects(eraseAccount(db, r.folio), pg(/not due/));
    await assert.rejects(eraseAccount(db, 'EL-000000'), pg(/not due/));
  });

  it('a due request is listed, reminded once, and erased: billing and CFDI stay, the rest goes', async () => {
    await su`UPDATE xangarro.account_deletions SET erase_at = now() - interval '1 minute'
             WHERE user_id = ${owner}::uuid AND undone_at IS NULL`;
    const [due] = (await openAccountDeletions(db, new Date().toISOString())).filter((d) =>
      d.businessIds.includes(A),
    );
    assert.ok(due);
    assert.equal(due.reminded, false);
    const reminderToken = await markDeletionReminded(db, due.folio);
    assert.ok(reminderToken);
    assert.equal((await peekAccountDeletion(db, reminderToken))?.folio, due.folio, 'its own link');
    assert.equal(await markDeletionReminded(db, due.folio), null, 'once');
    // The owner's second factor (0057, N-83): a sealed seed and code hashes are theirs too.
    await su`INSERT INTO xangarro.portal_second_factor (user_id, secret_enc, enrolled_at, recovery_codes)
             VALUES (${owner}::uuid, 'sealed', now(), ARRAY['h1'])`;
    const until = await eraseAccount(db, due.folio);
    assert.ok(Date.parse(until) - Date.now() > 9.9 * 365 * 86_400_000, 'blocked 10 years');

    const [left] = await su<Record<string, number>[]>`
      SELECT (SELECT count(*)::int FROM businesses WHERE id IN (${A}, ${B})) AS businesses,
             (SELECT count(*)::int FROM devices WHERE business_id IN (${A}, ${B})) AS devices,
             (SELECT count(*)::int FROM business_members WHERE user_id = ${owner}) AS members,
             (SELECT count(*)::int FROM auth.users WHERE id = ${owner}::uuid) AS account,
             (SELECT count(*)::int FROM xangarro.portal_second_factor
               WHERE user_id = ${owner}::uuid) AS factor,
             (SELECT count(*)::int FROM subscriptions WHERE business_id = ${A}) AS subscriptions,
             (SELECT count(*)::int FROM cfdi_payments WHERE business_id = ${A}) AS cfdi,
             (SELECT count(*)::int FROM businesses WHERE id = ${OTHER}) AS other`;
    assert.deepEqual(
      { ...left },
      {
        businesses: 0,
        devices: 0,
        members: 0,
        account: 0,
        factor: 0,
        subscriptions: 1,
        cfdi: 1,
        other: 1,
      },
    );
    const [kept] = await su<{ rfc: string; erased: boolean }[]>`
      SELECT identidad->'negocios'->0->>'rfc' AS rfc, erased_at IS NOT NULL AS erased
        FROM xangarro.account_deletions WHERE folio = ${due.folio}`;
    assert.deepEqual({ ...kept }, { rfc: 'XAXX010101000', erased: true });
    await assert.rejects(eraseAccount(db, due.folio), pg(/not due/), 'never twice');
    assert.equal(await undoAccountDeletion(db, token), null, 'nothing to undo after the erase');
  });

  it('the app role cannot read the ledger', async () => {
    await assert.rejects(
      db.execute(sql`SELECT 1 FROM xangarro.account_deletions`),
      pg(/permission denied/),
    );
  });
});
