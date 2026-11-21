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
 * Old → new data for `0061_session_last_error.sql` (CLAUDE.md §2.9).
 *
 * A portal session gains the id of the last error it was shown (P-48,
 * ADR-162 §8). A session opened before the migration must stay open and read
 * as having seen no error. It runs the real file on a database migrated up to
 * 0060 and holding sessions written the old way.
 */
const { describe } = integrationSuite();
const MIGRATION = join(DATA_PG_DIR, '0061_session_last_error.sql');

const EVENT = 'a3f1c2d4e5b60718293a4b5c6d7e8f90';
const LATER = 'b3f1c2d4e5b60718293a4b5c6d7e8f91';

describe('migration 0061: a session remembers its last error', () => {
  let scratch: ScratchDb;
  const user = randomUUID();
  const ABIERTA = 'a'.repeat(64);
  const REVOCADA = 'b'.repeat(64);
  const VENCIDA = 'c'.repeat(64);

  const note = async (hash: string, eventId: string): Promise<boolean | undefined> => {
    const [row] = await scratch.sql<{ ok: boolean }[]>`
      SELECT xangarro.session_note_error(${hash}, ${eventId}) AS ok`;
    return row?.ok;
  };
  const last = (hash: string) =>
    scratch.sql<{ event_id: string; at: Date }[]>`
      SELECT event_id, at FROM xangarro.session_last_error(${hash})`;

  beforeAll(async () => {
    scratch = await createScratchDb(process.env.DATABASE_SUPER_URL as string);
    await migrateUpTo(scratch.sql, '0061');
    const { sql } = scratch;
    await sql`
      INSERT INTO auth.users (id, email, encrypted_password)
      VALUES (${user}, 'antes@sesion.test.mx', 'h')`;
    await sql`
      INSERT INTO xangarro.portal_sessions (token_hash, user_id, business_id, expires_at, revoked_at)
      VALUES (${ABIERTA}, ${user}, 'biz-antes', now() + interval '1 day', NULL),
             (${REVOCADA}, ${user}, 'biz-antes', now() + interval '1 day', now()),
             (${VENCIDA}, ${user}, 'biz-antes', now() - interval '1 minute', NULL)`;
    await applyFile(sql, MIGRATION);
  });

  afterAll(async () => {
    await scratch?.drop();
  });

  it('a session opened before the migration stays open and has seen no error', async () => {
    const [row] = await scratch.sql<
      { revoked_at: Date | null; last_error_event_id: string | null }[]
    >`
      SELECT revoked_at, last_error_event_id FROM xangarro.portal_sessions
       WHERE token_hash = ${ABIERTA}`;
    assert.deepEqual(row, { revoked_at: null, last_error_event_id: null });
    assert.deepEqual([...(await last(ABIERTA))], []);
  });

  it('keeps the error a live session was shown, and the newest one replaces it', async () => {
    assert.equal(await note(ABIERTA, EVENT), true);
    const [first] = await last(ABIERTA);
    assert.equal(first?.event_id, EVENT);
    assert.ok(first?.at instanceof Date);
    assert.equal(await note(ABIERTA, LATER), true);
    const [second] = await last(ABIERTA);
    assert.equal(second?.event_id, LATER);
  });

  it('refuses an id that is not a Sentry event id, and keeps what it had', async () => {
    assert.equal(await note(ABIERTA, EVENT.toUpperCase()), false);
    assert.equal(await note(ABIERTA, 'not-an-id'), false);
    assert.equal(await note(ABIERTA, ''), false);
    const [row] = await last(ABIERTA);
    assert.equal(row?.event_id, LATER);
  });

  it('a revoked, an expired and an unknown session keep nothing and read as nothing', async () => {
    for (const hash of [REVOCADA, VENCIDA, 'd'.repeat(64)]) {
      assert.equal(await note(hash, EVENT), false);
      assert.deepEqual([...(await last(hash))], []);
    }
  });

  it('the app role may call both and still cannot read the table', async () => {
    const { sql } = scratch;
    const rows = await sql.begin(async (tx) => {
      await tx`SET LOCAL ROLE xangarro_app`;
      await tx`SELECT xangarro.session_note_error(${ABIERTA}, ${EVENT})`;
      return tx<
        { event_id: string }[]
      >`SELECT event_id FROM xangarro.session_last_error(${ABIERTA})`;
    });
    assert.equal(rows[0]?.event_id, EVENT);
    await assert.rejects(
      () =>
        sql.begin(async (tx) => {
          await tx`SET LOCAL ROLE xangarro_app`;
          await tx`SELECT last_error_event_id FROM xangarro.portal_sessions`;
        }),
      /permission denied/,
    );
  });

  it('applies a second time without losing what a session holds (the hosted runner may retry)', async () => {
    await applyFile(scratch.sql, MIGRATION);
    const [row] = await last(ABIERTA);
    assert.equal(row?.event_id, EVENT);
  });
});
