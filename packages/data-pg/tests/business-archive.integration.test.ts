import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { archiveCurrentBusiness, openSession, resolveSession } from '../src/security';
import { integrationSuite } from './support/db';

/**
 * P-08's archive row against the real function: the business is soft-deleted,
 * its devices revoked, its portal sessions ended, and its members can no longer
 * sign in to it — while another tenant is untouched. A throwaway tenant each
 * run.
 */
const { url, describe } = integrationSuite();
const OTHER = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const stamp = Date.now().toString(36).toUpperCase().padStart(10, '0').slice(-10);
const BIZ = `01HZ8XQN9GZJXVARCH${stamp}`.slice(0, 26);
const DEV = `01HZ8XQN9GZJXVADEV${stamp}`.slice(0, 26);

describe('archiving a business', () => {
  let db: Db;
  const userId = randomUUID();
  let session = '';

  const memberships = async () =>
    db.execute<{ business_id: string }>(
      sql`SELECT business_id FROM xangarro.memberships_for_user(${userId})`,
    );

  beforeAll(async () => {
    db = createDb(url as string);
    await db.execute(sql`
      INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${`${userId}@arch.mx`}, 'x')`);
    await withBusiness(db, BIZ, async (tx) => {
      await tx.execute(sql`
        INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
        VALUES (${BIZ}, 'Archivable', 'RESICO', 125, ${BIZ}, ${DEV}, now(), now())`);
      await tx.execute(sql`
        INSERT INTO devices (id, nombre, plataforma, modelo, business_id, created_at, updated_at)
        VALUES (${DEV}, 'Caja', 'android', 'x', ${BIZ}, now(), now())`);
      await tx.execute(sql`
        INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
        VALUES (${DEV.replace('DEV', 'MEM')}, ${userId}, 'owner', ${BIZ}, now(), now())`);
    });
    session = await openSession(db, userId, BIZ, 3600);
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('before: the owner belongs to it and the session resolves', async () => {
    assert.deepEqual(
      [...(await memberships())].map((r) => r.business_id),
      [BIZ],
    );
    assert.ok(await resolveSession(db, session, 600));
  });

  it('archives the tenant of the transaction, and only it', async () => {
    const otherBefore = await withBusiness(db, OTHER, (tx) =>
      tx.execute<{ n: number }>(
        sql`SELECT count(*)::int AS n FROM devices WHERE revoked_at IS NULL`,
      ),
    );
    await withBusiness(db, BIZ, (tx) => archiveCurrentBusiness(tx));

    const [row] = await withBusiness(db, BIZ, (tx) =>
      tx.execute<{ archived: boolean; live_devices: number }>(sql`
        SELECT (SELECT deleted_at IS NOT NULL FROM businesses WHERE id = ${BIZ}) AS archived,
               (SELECT count(*)::int FROM devices WHERE revoked_at IS NULL) AS live_devices`),
    );
    assert.deepEqual(row, { archived: true, live_devices: 0 });
    const otherAfter = await withBusiness(db, OTHER, (tx) =>
      tx.execute<{ n: number }>(
        sql`SELECT count(*)::int AS n FROM devices WHERE revoked_at IS NULL`,
      ),
    );
    assert.deepEqual([...otherAfter], [...otherBefore], 'another tenant is untouched');
  });

  it('after: the session is over and nobody can sign in to it', async () => {
    assert.equal(await resolveSession(db, session, 600), null);
    assert.equal([...(await memberships())].length, 0);
  });

  it('refuses to run with no tenant', async () => {
    await assert.rejects(db.execute(sql`SELECT xangarro.business_archive()`));
  });
});
