import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { celebraciones } from '../src/schema';
import { createAccount, openSession, resolveSession } from '../src/security';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * 0020: the account's display name rides the identity row and the session
 * (O-24, ADR-087) — never a grant on `auth.users` — and celebraciones are
 * write-once, tenant-isolated markers (P-33).
 */
const { url, describe } = integrationSuite();
const BIZ = testId('N');
const USER = randomUUID();
const EMAIL = `dos-mil-veinte-${randomUUID()}@test.mx`;

describe('0020 display name + celebraciones', () => {
  let db: Db;

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${testId('M')}, ${USER}, 'owner', ${BIZ}, now(), now())`);
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('stores the name with the identity and hands it to the session', async () => {
    assert.equal(
      await createAccount(db, {
        id: USER,
        email: EMAIL,
        passwordHash: 'x',
        nombre: '  Pedro  ',
        at: new Date().toISOString(),
      }),
      true,
    );
    const token = await openSession(db, USER, BIZ, 3_600);
    const session = await resolveSession(db, token, 3_600);
    assert.equal(session?.nombre, 'Pedro', 'trimmed at the boundary, not in transit');
    assert.equal(session?.role, 'owner');
  });

  it('a skipped name is null, never an empty greeting', async () => {
    const other = randomUUID();
    const otherEmail = `sin-nombre-${randomUUID()}@test.mx`;
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${testId('M')}, ${other}, 'admin', ${BIZ}, now(), now())`);
    });
    assert.equal(
      await createAccount(db, {
        id: other,
        email: otherEmail,
        passwordHash: 'x',
        nombre: '   ',
        at: new Date().toISOString(),
      }),
      true,
    );
    const token = await openSession(db, other, BIZ, 3_600);
    assert.equal((await resolveSession(db, token, 3_600))?.nombre, null);
  });

  it('celebrates once: a marker row is insertable and a repeat is a violation', async () => {
    await withBusiness(db, BIZ, (tx) =>
      tx.insert(celebraciones).values({ clave: 'meta:01J', businessId: BIZ }),
    );
    const repeat = await withBusiness(db, BIZ, (tx) =>
      tx.insert(celebraciones).values({ clave: 'meta:01J', businessId: BIZ }),
    ).catch((err: Error & { cause?: Error }) => `${err.message} ${err.cause?.message ?? ''}`);
    assert.match(repeat as string, /duplicate key|unique constraint/i);
  });

  it('markers are tenant-isolated and write-once for the app role', async () => {
    const otherBiz = testId('O');
    await withBusiness(db, otherBiz, (tx) =>
      tx.insert(celebraciones).values({ clave: 'racha:3', businessId: otherBiz }),
    );
    const mine = await withBusiness(db, BIZ, (tx) =>
      tx.select().from(celebraciones).where(eq(celebraciones.clave, 'racha:3')),
    );
    assert.equal(mine.length, 0, 'another tenant’s marker is invisible');
    const del = await withBusiness(db, BIZ, (tx) =>
      tx.execute(sql`DELETE FROM celebraciones WHERE clave = 'meta:01J'`),
    ).catch((err: Error & { cause?: Error }) => `${err.message} ${err.cause?.message ?? ''}`);
    assert.match(
      del as string,
      /permission denied/i,
      'the app role cannot delete what it never could',
    );
  });
});
