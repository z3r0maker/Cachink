import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';
import postgres from 'postgres';

import { integrationSuite } from './support/db';
import { BIZ_A, BIZ_B, seedTwoTenants } from './support/tenants';

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
 *   pnpm --filter @xangarro/data-pg db:reset
 *   pnpm --filter @xangarro/data-pg test:db
 *
 * `test:db` sets `REQUIRE_DB=1`, so a missing database fails this suite rather
 * than skipping it. See `./support/db.ts` for why that matters.
 *
 * The session-GUC path is asserted here; the access-token path that production
 * uses is asserted in `claims.integration.test.ts`.
 */
const NOW = '2026-09-17T12:00:00.000Z';
const { url, describe } = integrationSuite();

describe('row-level security isolates tenants', () => {
  let sql: postgres.Sql;

  beforeAll(async () => {
    // Connects as `xangarro_app`, **not** as a superuser: superusers bypass RLS
    // entirely and `FORCE` does not apply to them, so a test run as `postgres`
    // would pass every assertion while protecting nothing.
    sql = postgres(url as string, { max: 1, onnotice: () => undefined });
    await seedTwoTenants(sql);
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
