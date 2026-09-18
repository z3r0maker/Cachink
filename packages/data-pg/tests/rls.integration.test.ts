import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import postgres from 'postgres';

/**
 * RLS integration test (B-03).
 *
 * Runs as the non-superuser `xangarro_app` role.
 *
 * An RLS policy that does not isolate is worse than no policy, because it looks
 * like protection. These assertions run against a **real Postgres** — the
 * planner, the policy expressions and the claim plumbing all have to agree, and
 * none of that can be checked by reading SQL.
 *
 *   docker run -d --name xangarro-pg -e POSTGRES_PASSWORD=xangarro \
 *     -e POSTGRES_DB=xangarro -p 55432:5432 postgres:17-alpine
 *   psql … -f drizzle/0000_*.sql -f drizzle/0001_rls.sql
 *   DATABASE_URL=postgres://postgres:xangarro@localhost:55432/xangarro pnpm test
 *
 * Skipped when `DATABASE_URL` is unset so the unit suite stays hermetic.
 */
const URL = process.env.DATABASE_URL;
const describeDb = URL ? describe : describe.skip;

const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7AAA';
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7BBB';
const NOW = '2026-09-17T12:00:00.000Z';

describeDb('row-level security isolates tenants', () => {
  let sql: postgres.Sql;

  beforeAll(async () => {
    // Connects as `xangarro_app`, **not** as a superuser: superusers bypass RLS
    // entirely and `FORCE` does not apply to them, so a test run as `postgres`
    // would pass every assertion while protecting nothing.
    sql = postgres(URL as string, { max: 1, onnotice: () => undefined });
    for (const biz of [BIZ_A, BIZ_B]) {
      await sql`SELECT set_config('xangarro.business_id', ${biz}, false)`;
      await sql`
        INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
        VALUES (${biz}, ${'Negocio ' + biz.slice(-3)}, 'RESICO', 125, ${biz}, 'dev', ${NOW}, ${NOW})
        ON CONFLICT (id) DO NOTHING`;
      await sql`
        INSERT INTO notices (id, source, severity, title, body, business_id, created_at, updated_at)
        VALUES (${'n-' + biz.slice(-3)}, 'operacion', 'info', 'Aviso', 'Cuerpo', ${biz}, ${NOW}, ${NOW})
        ON CONFLICT (id) DO NOTHING`;
    }
  });

  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  it('shows a tenant only its own rows', async () => {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ_A}, false)`;
    const rows = await sql<{ id: string }[]>`SELECT id FROM businesses`;
    assert.deepEqual(
      rows.map((r) => r.id),
      [BIZ_A],
      'business A must not see business B',
    );
  });

  it('shows the other tenant its own rows, and only those', async () => {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ_B}, false)`;
    const rows = await sql<{ id: string }[]>`SELECT id FROM businesses`;
    assert.deepEqual(
      rows.map((r) => r.id),
      [BIZ_B],
    );
  });

  it('isolates a portal-only table the same way', async () => {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ_A}, false)`;
    const rows = await sql<{ business_id: string }[]>`SELECT business_id FROM notices`;
    assert.ok(rows.length > 0, 'the tenant should see its own notices');
    assert.ok(rows.every((r) => r.business_id === BIZ_A));
  });

  it('refuses a write that claims another tenant', async () => {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ_A}, false)`;
    await assert.rejects(
      () => sql`
        INSERT INTO notices (id, source, severity, title, body, business_id, created_at, updated_at)
        VALUES ('n-cross', 'sistema', 'info', 'x', 'y', ${BIZ_B}, ${NOW}, ${NOW})`,
      /row-level security/i,
      'writing a row for another business must be rejected, not silently dropped',
    );
  });

  it('shows nothing at all when the claim is absent', async () => {
    await sql`SELECT set_config('xangarro.business_id', '', false)`;
    const rows = await sql`SELECT id FROM businesses`;
    assert.equal(rows.length, 0, 'no claim must mean no rows, never all rows');
  });

  it('runs as a role that cannot bypass RLS', async () => {
    const [who] = await sql<{ rolsuper: boolean; rolbypassrls: boolean }[]>`
      SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
    assert.equal(who?.rolsuper, false, 'a superuser bypasses RLS — the test would prove nothing');
    assert.equal(who?.rolbypassrls, false);
  });

  it('cannot be bypassed by the table owner — FORCE is on', async () => {
    const [row] = await sql<{ relforcerowsecurity: boolean }[]>`
      SELECT relforcerowsecurity FROM pg_class WHERE relname = 'sales'`;
    assert.equal(row?.relforcerowsecurity, true);
  });

  it('protects every table in the public schema', async () => {
    const unprotected = await sql<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND rowsecurity = false
      ORDER BY tablename`;
    assert.deepEqual(
      unprotected.map((r) => r.tablename),
      [],
    );
  });
});
