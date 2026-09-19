import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';
import { BIZ_A, BIZ_B, seedTwoTenants } from './support/tenants';
import { testId } from './support/test-ids';

/**
 * 0020: `clients.rfc` is additive. A row written the pre-0020 way (no RFC)
 * keeps its shape and reads `NULL`, the tenant role can write and read the
 * column through the table's existing ACLs, and RLS keeps the row scoped to
 * its business exactly as before.
 */
const { url, describe } = integrationSuite();

describe('0020 clients.rfc', () => {
  let app: postgres.Sql;
  const MINE = BIZ_A;
  const THEIRS = BIZ_B;

  beforeAll(async () => {
    app = postgres(url as string, { max: 1, onnotice: () => undefined });
    await seedTwoTenants(app);
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
  });

  const as = (biz: string) => app`SELECT set_config('xangarro.business_id', ${biz}, false)`;

  async function insertClient(id: string, biz: string, rfc?: string): Promise<void> {
    await as(biz);
    await app`
      INSERT INTO clients (id, nombre, telefono, email, nota, rfc,
                           business_id, device_id, created_by_user_id,
                           created_at, updated_at, deleted_at)
      VALUES (${id}, 'Doña Mary', '55 1234 5678', NULL, NULL, ${rfc ?? null},
              ${biz}, 'portal', NULL, now(), now(), NULL)`;
  }

  it('a pre-0020 row (no RFC in the INSERT) reads NULL, not an error', async () => {
    const id = testId('L');
    await insertClient(id, MINE);
    await as(MINE);
    const [row] = await app<{ rfc: string | null }[]>`SELECT rfc FROM clients WHERE id = ${id}`;
    assert.equal(row?.rfc ?? null, null);
  });

  it('the tenant writes and reads back an RFC on its own row', async () => {
    const id = testId('L');
    await insertClient(id, MINE, 'XAXX010101000');
    await as(MINE);
    const [row] = await app<{ rfc: string | null }[]>`SELECT rfc FROM clients WHERE id = ${id}`;
    assert.equal(row?.rfc, 'XAXX010101000');
  });

  it('another business never sees the row, RFC included', async () => {
    const id = testId('L');
    await insertClient(id, MINE, 'XEXX010101000');
    await as(THEIRS);
    const rows = await app<{ rfc: string | null }[]>`
      SELECT rfc FROM clients WHERE id = ${id}`;
    assert.equal(rows.length, 0);
  });
});
