import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import { ownerNombre } from '../src/queries/owner-nombre';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * `xangarro.owner_nombre()` (0044): inside a tenant transaction the app role
 * gets the display name of THAT business's earliest owner (never a viewer's,
 * never another business's), and null when there is none.
 */
const { url, describe } = integrationSuite();
const BIZ = testId('N');
const OTRO = testId('Q');
const SIN = testId('S');

async function member(
  owner: postgres.Sql,
  biz: string,
  role: string,
  nombre: string | null,
  at: string,
) {
  const id = randomUUID();
  const meta = nombre === null ? {} : { nombre };
  await owner`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (${id}::uuid, ${`${id}@test.mx`}, ${owner.json(meta)})`;
  await owner`
    INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
    VALUES (${`m-${randomUUID()}`}, ${id}, ${role}, ${biz}, ${at}, ${at})`;
}

describe('xangarro.owner_nombre(): the owner of this tenant, for the caja', () => {
  let owner: postgres.Sql;
  let app: Db;

  beforeAll(async () => {
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    app = createDb(url as string);
    await member(owner, BIZ, 'viewer', 'Contadora', '2026-01-01T00:00:00Z');
    await member(owner, BIZ, 'owner', '  Pedro  ', '2026-02-01T00:00:00Z');
    await member(owner, BIZ, 'owner', 'Socio', '2026-03-01T00:00:00Z');
    await member(owner, OTRO, 'owner', 'Lupita', '2026-01-01T00:00:00Z');
    await member(owner, SIN, 'owner', null, '2026-01-01T00:00:00Z');
  });

  afterAll(async () => {
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it("returns the earliest owner's name, trimmed, never a viewer's", async () => {
    assert.equal(await withBusiness(app, BIZ, (tx) => ownerNombre(tx)), 'Pedro');
  });

  it('answers only for the business of the transaction', async () => {
    assert.equal(await withBusiness(app, OTRO, (tx) => ownerNombre(tx)), 'Lupita');
  });

  it('is null when the owner never set a name, and with no tenant claim', async () => {
    assert.equal(await withBusiness(app, SIN, (tx) => ownerNombre(tx)), null);
    assert.equal(await ownerNombre(app), null);
  });
});
