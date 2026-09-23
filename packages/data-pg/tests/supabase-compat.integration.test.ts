import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';
import { BIZ_A, claims, seedTwoTenants } from './support/tenants';

/**
 * The contract the local compat layer exists to uphold.
 *
 * `local/0000_supabase_compat.sql` provisions what a hosted Supabase project
 * provides before any migration runs: the `auth` schema, the three request
 * roles, and `auth.uid()`/`auth.jwt()`/`auth.role()`. Without a test, a stub
 * that is merely *similar* to Supabase's is a local-only bug farm — it would
 * make local runs pass and production diverge, which is the opposite of why the
 * layer was added.
 *
 * Kept apart from `claims.integration.test.ts` on purpose: the proof that
 * tenant isolation works through an access token must not depend on a
 * local-only fixture. This file is the one that should also pass, unchanged,
 * against a hosted project.
 */
const { url, describe } = integrationSuite();

describe('the Supabase compatibility layer', () => {
  let sql: postgres.Sql;

  beforeAll(async () => {
    sql = postgres(url as string, { max: 1, onnotice: () => undefined });
    await seedTwoTenants(sql);
  });

  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  it('reads the same business_id through auth.jwt() as the policies do', async () => {
    await sql`SELECT set_config('request.jwt.claims', ${claims(BIZ_A)}, false)`;
    const [row] = await sql<{ via_auth: string | null; via_policy: string | null }[]>`
      SELECT auth.jwt() ->> 'business_id' AS via_auth,
             xangarro.current_business_id() AS via_policy`;
    assert.equal(row?.via_auth, BIZ_A);
    assert.equal(
      row?.via_policy,
      row?.via_auth,
      'if these ever disagree, a policy written against auth.jwt() would not match one written against the function',
    );
  });

  it('resolves auth.uid() to the token subject, and NULL without a token', async () => {
    await sql`SELECT set_config('request.jwt.claims', ${claims(BIZ_A)}, false)`;
    const [withToken] = await sql<{ uid: string | null; role: string | null }[]>`
      SELECT auth.uid()::text AS uid, auth.role() AS role`;
    assert.equal(withToken?.uid, '3f1c0e2a-0000-4000-8000-000000000001');
    assert.equal(withToken?.role, 'authenticated');

    await sql`SELECT set_config('request.jwt.claims', '', false)`;
    const [without] = await sql<{ uid: string | null }[]>`SELECT auth.uid()::text AS uid`;
    assert.equal(without?.uid, null, 'no token must mean no subject, never an error');
  });

  it('makes the app role a member of authenticated, as the hosted project would', async () => {
    // Postgres decides whether a policy's `TO <role>` clause applies by role
    // *membership*. No policy uses one today (ADR-079/080: the portal connects
    // as `xangarro_app` and the Data API is off), but the compat layer mirrors
    // Supabase's role tree so a future `TO` clause behaves locally as hosted.
    const [member] = await sql<{ ok: boolean }[]>`
      SELECT pg_has_role(current_user, 'authenticated', 'MEMBER') AS ok`;
    assert.equal(member?.ok, true);
  });

  it('gives authenticated no table grants — the Data API stays a closed door', async () => {
    // `SET ROLE authenticated` succeeds (the compat layer created the role and
    // granted membership), but the role holds no privileges on `public` tables.
    // That is the intended posture, not a gap: since ADR-079/080 the portal
    // connects as `xangarro_app`, the Data API is off (O-2), and
    // `hosted/0000_revoke_data_api_grants.sql` strips Supabase's default grants
    // to `anon`/`authenticated`/`service_role` before anything is created.
    //
    // Pinning it here means nobody grants to `authenticated` by accident: this
    // test fails the moment that changes, forcing a deliberate, reviewed
    // decision about production security rather than a side effect.
    await sql`SELECT set_config('request.jwt.claims', ${claims(BIZ_A)}, false)`;
    await sql`SET ROLE authenticated`;
    try {
      await assert.rejects(
        () => sql`SELECT id FROM businesses`,
        /permission denied/i,
        'if this now succeeds, something granted to `authenticated` — update this test deliberately',
      );
    } finally {
      await sql`RESET ROLE`;
    }
  });
});
