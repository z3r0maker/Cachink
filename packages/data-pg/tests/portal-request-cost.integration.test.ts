import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hashToken } from '@xangarro/auth-core';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { openSession, resolveSession } from '../src/security';
import { integrationSuite } from './support/db';

/**
 * 0046 (audit DB2-PAGE-01): what every portal navigation costs the database.
 *
 * - `session_resolve` used to UPDATE `last_seen_at` on every request. It now
 *   touches the row only when the stored stamp is more than a minute old, and
 *   still judges idleness against the stored stamp.
 * - `negocios_for_user` returns each membership with its business's name, so
 *   the switcher needs one call instead of one tenant transaction per business.
 */
const { url, describe } = integrationSuite();
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0PRC01';
const ARCHIVED = '01HZ8XQN9GZJXV8AKQ5X0PRC02';
const suffix = Date.now().toString().slice(-4);
const MEMBER = `01HZ8XQN9GZJXV8AKQ5XPRC${suffix}`.replace(/[ILOU]/g, 'A');
const MEMBER_ARCHIVED = `01HZ8XQN9GZJXV8AKQ5XPRD${suffix}`.replace(/[ILOU]/g, 'A');

describe('0046 — the portal’s per-request cost', () => {
  let db: Db;
  let owner: Db;
  const userId = randomUUID();

  const lastSeen = async (token: string): Promise<Date> => {
    const [row] = await owner.execute<{ at: string }>(
      sql`SELECT last_seen_at::text AS at FROM xangarro.portal_sessions WHERE token_hash = ${hashToken(token)}`,
    );
    assert.ok(row, 'session row exists');
    return new Date(row.at);
  };
  const ageSession = (token: string, seconds: number) =>
    owner.execute(sql`
      UPDATE xangarro.portal_sessions SET last_seen_at = now() - make_interval(secs => ${seconds})
       WHERE token_hash = ${hashToken(token)}`);

  beforeAll(async () => {
    db = createDb(url as string);
    owner = createDb(process.env.DATABASE_SUPER_URL as string);
    await owner.execute(sql`
      INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${`${userId}@test.mx`}, 'x')`);
    for (const [biz, nombre, deleted] of [
      [BIZ, 'Taquería Prueba', null],
      [ARCHIVED, 'Archivado', '2026-09-01T00:00:00Z'],
    ] as const) {
      await owner.execute(sql`
        INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at, deleted_at)
        VALUES (${biz}, ${nombre}, 'RESICO', 125, ${biz}, 'dev', now(), now(), ${deleted})
        ON CONFLICT (id) DO NOTHING`);
    }
    for (const [id, biz] of [
      [MEMBER, BIZ],
      [MEMBER_ARCHIVED, ARCHIVED],
    ] as const) {
      await withBusiness(owner, biz, (tx) =>
        tx.execute(sql`
          INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
          VALUES (${id}, ${userId}, 'owner', ${biz}, now(), now())`),
      );
    }
  });

  afterAll(async () => {
    await owner.execute(sql`DELETE FROM xangarro.portal_sessions WHERE user_id = ${userId}::uuid`);
    await owner.execute(
      sql`DELETE FROM business_members WHERE id IN (${MEMBER}, ${MEMBER_ARCHIVED})`,
    );
    await owner.execute(sql`DELETE FROM businesses WHERE id IN (${BIZ}, ${ARCHIVED})`);
    await owner.execute(sql`DELETE FROM auth.users WHERE id = ${userId}::uuid`);
    await owner.$client.end({ timeout: 5 });
    await db?.$client.end({ timeout: 5 });
  });

  it('does not rewrite a session seen less than a minute ago', async () => {
    const token = await openSession(db, userId, BIZ, 3600);
    await ageSession(token, 20);
    const before = await lastSeen(token);
    assert.equal((await resolveSession(db, token, 600))?.businessId, BIZ);
    assert.equal((await lastSeen(token)).getTime(), before.getTime(), 'no write on a fresh stamp');
  });

  it('touches a session last seen more than a minute ago', async () => {
    const token = await openSession(db, userId, BIZ, 3600);
    await ageSession(token, 120);
    const before = await lastSeen(token);
    assert.equal((await resolveSession(db, token, 600))?.role, 'owner');
    assert.ok((await lastSeen(token)).getTime() > before.getTime() + 60_000, 'stamp moved to now');
  });

  it('still ends a session idle past the limit, judged on the stored stamp', async () => {
    const token = await openSession(db, userId, BIZ, 3600);
    await ageSession(token, 700);
    assert.equal(await resolveSession(db, token, 600), null);
  });

  it('lists the user’s live businesses with their names, archived ones excluded', async () => {
    const rows = await db.execute<{ business_id: string; role: string; nombre: string }>(
      sql`SELECT business_id, role, nombre FROM xangarro.negocios_for_user(${userId})`,
    );
    assert.deepEqual(
      [...rows].map((r) => ({ ...r })),
      [{ business_id: BIZ, role: 'owner', nombre: 'Taquería Prueba' }],
    );
  });
});
