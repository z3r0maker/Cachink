import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb, type CorpDb } from '../src/client';
import { findFounderByStaffId, listFounders } from '../src/queries/founders';
import { listProjects } from '../src/queries/projects';

/**
 * E-01's foundation (ADR-124 §1–§2): the corp schema exists with Xangarro as
 * its first project; only the console's corp login writes it, the agents'
 * login only reads, and neither the portal's nor the console's platform login
 * can see it at all. Nobody deletes a founder.
 */
const { url, describe } = integrationSuite();
const env = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`${name} is not set`);
  return value;
};

const STAFF = `staff-${randomUUID()}`;
const OTHER = `staff-${randomUUID()}`;

describe('corp schema, roles and founders', () => {
  let owner: postgres.Sql;
  let corp: postgres.Sql;
  let agent: postgres.Sql;
  let db: CorpDb;

  beforeAll(async () => {
    owner = postgres(env('DATABASE_SUPER_URL'), { max: 1, onnotice: () => {} });
    corp = postgres(url as string, { max: 1, onnotice: () => {} });
    agent = postgres(env('CORP_AGENT_URL'), { max: 1, onnotice: () => {} });
    db = createCorpDb(url as string);
    await owner`DELETE FROM corp.founders`;
  });

  afterAll(async () => {
    await owner`DELETE FROM corp.founders`;
    await Promise.all([owner.end(), corp.end(), agent.end()]);
  });

  it('ships with Xangarro as the first project', async () => {
    assert.deepEqual(await listProjects(db), [
      { id: 'xangarro', slug: 'xangarro', nombre: 'Xangarro' },
    ]);
  });

  it('lets the console register founders 1 and 2 and finds them by staff id', async () => {
    await corp`INSERT INTO corp.founders (id, staff_member_id, numero, nombre, created_at)
               VALUES (${randomUUID()}, ${STAFF}, 1, 'Fundador Uno', now())`;
    const found = await findFounderByStaffId(db, STAFF);
    assert.equal(found?.numero, 1);
    assert.equal(found?.nombre, 'Fundador Uno');
    assert.equal(await findFounderByStaffId(db, OTHER), null);
    assert.deepEqual(
      (await listFounders(db)).map((f) => f.numero),
      [1],
    );
  });

  it('refuses a third founder number and a staff member registered twice', async () => {
    await assert.rejects(
      corp`INSERT INTO corp.founders (id, staff_member_id, numero, nombre, created_at)
           VALUES (${randomUUID()}, ${OTHER}, 3, 'Tercero', now())`,
      /check constraint/,
    );
    await assert.rejects(
      corp`INSERT INTO corp.founders (id, staff_member_id, numero, nombre, created_at)
           VALUES (${randomUUID()}, ${STAFF}, 2, 'Duplicado', now())`,
      /duplicate key/,
    );
  });

  it('never lets the console delete a founder', async () => {
    await assert.rejects(corp`DELETE FROM corp.founders`, /permission denied/);
  });

  it('gives the agents read access and nothing else', async () => {
    const rows = await agent`SELECT count(*)::int AS n FROM corp.founders`;
    assert.equal(rows[0]?.n, 1);
    await assert.rejects(
      agent`INSERT INTO corp.projects (id, slug, nombre, created_at)
            VALUES (${randomUUID()}, 'otro', 'Otro', now())`,
      /permission denied/,
    );
  });

  it('is invisible to the portal and to the console platform login', async () => {
    for (const name of ['APP_URL', 'ADMIN_URL']) {
      const sql = postgres(env(name), { max: 1, onnotice: () => {} });
      try {
        await assert.rejects(sql`SELECT 1 FROM corp.founders`, /permission denied/, name);
      } finally {
        await sql.end();
      }
    }
  });
});
