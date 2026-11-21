import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, type Db } from '../src/client';
import { noteSessionError, openSession, revokeSession, sessionLastError } from '../src/index';
import { integrationSuite } from './support/db';

/**
 * The last error a portal session was shown, against the real functions
 * (0061, P-48): what «Algo no funciona» attaches to a report. The token is
 * the cookie's; only its hash reaches the database.
 */
const { url, describe } = integrationSuite();

const EVENT = '0f1e2d3c4b5a69788796a5b4c3d2e1f0';
const NEWER = '1f1e2d3c4b5a69788796a5b4c3d2e1f1';

describe('a session and its last error', () => {
  let db: Db;

  async function session(): Promise<string> {
    const id = randomUUID();
    await db.execute(sql`
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
      VALUES (${id}::uuid, ${`${id}@error.test.mx`}, 'hash', now())`);
    return openSession(db, id, 'biz-error', 3_600);
  }

  beforeAll(() => {
    db = createDb(url as string);
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('a new session has seen no error', async () => {
    assert.equal(await sessionLastError(db, await session()), null);
  });

  it('keeps the newest error with the instant it was kept', async () => {
    const token = await session();
    assert.equal(await noteSessionError(db, token, EVENT), true);
    assert.equal(await noteSessionError(db, token, NEWER), true);
    const last = await sessionLastError(db, token);
    assert.equal(last?.eventId, NEWER);
    assert.match(last?.at ?? '', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('one session never reads another one’s error', async () => {
    const mine = await session();
    const theirs = await session();
    await noteSessionError(db, theirs, EVENT);
    assert.equal(await sessionLastError(db, mine), null);
  });

  it('refuses what is not an event id', async () => {
    const token = await session();
    assert.equal(await noteSessionError(db, token, 'DROP TABLE'), false);
    assert.equal(await noteSessionError(db, token, EVENT.toUpperCase()), false);
    assert.equal(await sessionLastError(db, token), null);
  });

  it('a session that ended keeps nothing and gives nothing back', async () => {
    const token = await session();
    await noteSessionError(db, token, EVENT);
    await revokeSession(db, token);
    assert.equal(await sessionLastError(db, token), null);
    assert.equal(await noteSessionError(db, token, NEWER), false);
    assert.equal(await noteSessionError(db, 'y'.repeat(43), EVENT), false);
  });
});
