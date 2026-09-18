import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';
import { BIZ_A, BIZ_B, claims, seedTwoTenants } from './support/tenants';

/**
 * The `request.jwt.claims` path through `xangarro.current_business_id()`.
 *
 * That function COALESCEs two sources — the JWT claim PostgREST sets, and the
 * session GUC `withBusiness()` sets. Until this file, **only the GUC branch was
 * ever tested**: nothing in the repository set `request.jwt.claims`, so the
 * branch that production would actually use was unexercised from the day it was
 * written. The first assertion written against it found a live defect (below).
 *
 * This suite needs no Supabase and no compat layer: `request.jwt.claims` is an
 * ordinary two-part custom GUC that any role may `set_config` on a plain
 * Postgres. Which makes the gap the more striking — it was always testable.
 */
const { url, describe } = integrationSuite();

describe('the access-token claim path', () => {
  let sql: postgres.Sql;

  beforeAll(async () => {
    sql = postgres(url as string, { max: 1, onnotice: () => undefined });
    await seedTwoTenants(sql);
  });

  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  it('scopes reads to the business_id in the access token', async () => {
    await sql`SELECT set_config('request.jwt.claims', ${claims(BIZ_A)}, false)`;
    const rows = await sql<{ id: string }[]>`SELECT id FROM businesses`;
    assert.deepEqual(
      rows.map((r) => r.id),
      [BIZ_A],
      'the token path must isolate exactly as the session path does',
    );
  });

  it('refuses a write that claims another tenant, through the token path', async () => {
    await sql`SELECT set_config('request.jwt.claims', ${claims(BIZ_A)}, false)`;
    await assert.rejects(
      () => sql`
        INSERT INTO notices (id, source, severity, title, body, business_id, created_at, updated_at)
        VALUES ('n-token-cross', 'sistema', 'info', 'x', 'y', ${BIZ_B}, now(), now())`,
      /row-level security/i,
    );
  });

  it('prefers the token over the session setting when they disagree', async () => {
    // Pins the COALESCE order as a *decision*, not an accident: production must
    // honour the signed token, never a session variable. It also documents the
    // hazard — a pooled connection carrying a session-scoped
    // `request.jwt.claims` would override `withBusiness()`'s transaction-scoped
    // GUC. `src/client.ts` never sets the claims GUC, so we are safe today;
    // without this test a future one-line change would be a silent cross-tenant
    // read.
    await sql`SELECT set_config('xangarro.business_id', ${BIZ_B}, false)`;
    await sql`SELECT set_config('request.jwt.claims', ${claims(BIZ_A)}, false)`;
    const rows = await sql<{ id: string }[]>`SELECT id FROM businesses`;
    assert.deepEqual(
      rows.map((r) => r.id),
      [BIZ_A],
      'the token must win over the session GUC',
    );
  });

  it('falls back to the session setting when the token carries no business_id', async () => {
    const partial = JSON.stringify({
      sub: '3f1c0e2a-0000-4000-8000-000000000001',
      role: 'authenticated',
    });
    await sql`SELECT set_config('request.jwt.claims', ${partial}, false)`;
    await sql`SELECT set_config('xangarro.business_id', ${BIZ_A}, false)`;
    const rows = await sql<{ id: string }[]>`SELECT id FROM businesses`;
    assert.deepEqual(
      rows.map((r) => r.id),
      [BIZ_A],
      'the fallback the rest of the suite depends on must keep working',
    );
  });

  it('treats an empty claims setting as no claim, not as an error', async () => {
    // This assertion found a shipping defect. `current_setting(...)::jsonb` on
    // an empty string raises 22P02, so a single empty `request.jwt.claims` —
    // a state PostgREST produces — turned *every* query on all 25 tenant tables
    // into `invalid input syntax for type json`. The fix is `NULLIF(…, '')`
    // before the cast, which is what Supabase's own `auth.jwt()` does.
    await sql`SELECT set_config('xangarro.business_id', '', false)`;
    await sql`SELECT set_config('request.jwt.claims', '', false)`;
    const rows = await sql`SELECT id FROM businesses`;
    assert.equal(rows.length, 0, 'an empty claim must mean no rows, not an error');
  });
});
