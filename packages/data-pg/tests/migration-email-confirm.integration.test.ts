import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';

import { integrationSuite } from './support/db';
import {
  applyFile,
  createScratchDb,
  DATA_PG_DIR,
  migrateUpTo,
  type ScratchDb,
} from './support/scratch-db';

/**
 * Old → new data for `0057_email_confirm_second_factor.sql` (CLAUDE.md §2.9).
 *
 * The migration starts refusing a password sign-in on an unconfirmed address
 * (N-83). Every account that predates it never had a way to confirm, so each
 * must come out **confirmed**: otherwise shipping this would stop every
 * existing owner at their next sign-in. It runs the real file on a database
 * migrated up to 0056 and holding rows written the old way.
 */
const { describe } = integrationSuite();
const MIGRATION = join(DATA_PG_DIR, '0057_email_confirm_second_factor.sql');

describe('migration 0057: email confirmation and the second factor', () => {
  let scratch: ScratchDb;
  const vieja = randomUUID();
  const yaConfirmada = randomUUID();
  const HASH = 'a'.repeat(64);

  beforeAll(async () => {
    scratch = await createScratchDb(process.env.DATABASE_SUPER_URL as string);
    await migrateUpTo(scratch.sql, '0057');
    const { sql } = scratch;
    await sql`
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at)
      VALUES (${vieja}, 'vieja@antes.test.mx', 'h', NULL, '2026-09-01T12:00:00Z'),
             (${yaConfirmada}, 'ya@antes.test.mx', 'h', '2026-08-01T00:00:00Z', '2026-07-01T00:00:00Z')`;
    await sql`
      INSERT INTO xangarro.portal_sessions (token_hash, user_id, business_id, expires_at)
      VALUES (${HASH}, ${vieja}, 'biz-vieja', now() + interval '1 day')`;
    await sql`
      INSERT INTO xangarro.auth_links (token_hash, user_id, kind, expires_at)
      VALUES (${'b'.repeat(64)}, ${vieja}, 'reset', now() + interval '30 minutes')`;
    await applyFile(sql, MIGRATION);
  });

  afterAll(async () => {
    await scratch?.drop();
  });

  it('an account that predates the migration comes out confirmed, at its creation date', async () => {
    const [row] = await scratch.sql<{ at: Date | null }[]>`
      SELECT email_confirmed_at AS at FROM auth.users WHERE id = ${vieja}`;
    assert.equal(row?.at?.toISOString(), '2026-09-01T12:00:00.000Z');
    const [ok] = await scratch.sql<{ ok: boolean }[]>`
      SELECT xangarro.account_confirmed(${vieja}::uuid) AS ok`;
    assert.equal(ok?.ok, true);
  });

  it('an address confirmed earlier keeps its own date', async () => {
    const [row] = await scratch.sql<{ at: Date }[]>`
      SELECT email_confirmed_at AS at FROM auth.users WHERE id = ${yaConfirmada}`;
    assert.equal(row?.at.toISOString(), '2026-08-01T00:00:00.000Z');
  });

  it('an open session survives, and has proven no second factor yet', async () => {
    const [row] = await scratch.sql<{ stepped_up_at: Date | null; revoked_at: Date | null }[]>`
      SELECT stepped_up_at, revoked_at FROM xangarro.portal_sessions WHERE token_hash = ${HASH}`;
    assert.deepEqual(row, { stepped_up_at: null, revoked_at: null });
    const [fresh] = await scratch.sql<{ ok: boolean }[]>`
      SELECT xangarro.session_stepped_up(${HASH}, 900) AS ok`;
    assert.equal(fresh?.ok, false);
  });

  it('a link issued before the migration still reads as what it was', async () => {
    const [row] = await scratch.sql<{ state: string; confirmed: boolean }[]>`
      SELECT state, confirmed FROM xangarro.link_peek(${'b'.repeat(64)}, 'reset')`;
    assert.deepEqual(row, { state: 'fresh', confirmed: true });
  });

  it('accepts the three new kinds of link and still refuses an unknown one', async () => {
    for (const kind of ['confirm', 'pending', 'challenge']) {
      await scratch.sql`
        INSERT INTO xangarro.auth_links (token_hash, user_id, kind, expires_at)
        VALUES (${randomUUID()}, ${vieja}, ${kind}, now() + interval '1 hour')`;
    }
    await assert.rejects(
      () => scratch.sql`
        INSERT INTO xangarro.auth_links (token_hash, user_id, kind, expires_at)
        VALUES (${randomUUID()}, ${vieja}, 'otra', now() + interval '1 hour')`,
      /auth_links_kind_check/,
    );
  });

  it('no account starts with a second factor, and an enrolment needs its seed', async () => {
    const [state] = await scratch.sql<{ enrolled_at: Date | null; codes_left: number }[]>`
      SELECT enrolled_at, codes_left FROM xangarro.second_factor_state(${vieja}::uuid)`;
    assert.deepEqual(state, { enrolled_at: null, codes_left: 0 });
    await assert.rejects(
      () => scratch.sql`
        INSERT INTO xangarro.portal_second_factor (user_id, enrolled_at) VALUES (${vieja}, now())`,
      /portal_second_factor_enrolled_has_seed/,
    );
  });

  it('applies a second time without changing anything (the hosted runner may retry)', async () => {
    await applyFile(scratch.sql, MIGRATION);
    const [row] = await scratch.sql<{ at: Date }[]>`
      SELECT email_confirmed_at AS at FROM auth.users WHERE id = ${vieja}`;
    assert.equal(row?.at.toISOString(), '2026-09-01T12:00:00.000Z');
  });
});
