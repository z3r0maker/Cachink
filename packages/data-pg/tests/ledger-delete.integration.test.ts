import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';
import { BIZ_A, seedTwoTenants } from './support/tenants';

/**
 * DB-RLS-01 (`0036_revoke_ledger_delete.sql`, B-03): the app role cannot
 * hard-delete.
 *
 * RLS decides *which* rows a role may touch; privileges decide *what* it may
 * do to them. `tenant_isolation` has no `FOR` clause, so before 0036 a DELETE
 * on a tenant's own rows sailed through both — the audit's "one portal bug
 * hard-deletes the books" case. These assertions run as `xangarro_app`
 * against a real Postgres, because a privilege you believe is revoked but is
 * not is worse than one you never revoked.
 */
const LEDGER = ['sales', 'expenses', 'inventory_movements', 'tickets', 'sync_log'] as const;
const { url, describe } = integrationSuite();

describe('the app role cannot hard-delete (DB-RLS-01)', () => {
  let app: postgres.Sql;
  let owner: postgres.Sql;

  beforeAll(async () => {
    app = postgres(url as string, { max: 1, onnotice: () => undefined });
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    await seedTwoTenants(owner);
    await app`SELECT set_config('xangarro.business_id', ${BIZ_A}, false)`;
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('holds no DELETE privilege on any table in public', async () => {
    const rows = await owner<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.role_table_grants
      WHERE grantee = 'xangarro_app' AND table_schema = 'public' AND privilege_type = 'DELETE'
      ORDER BY table_name`;
    assert.deepEqual(
      rows.map((r) => r.table_name),
      [],
      'a table here has DELETE granted back — it needs a per-table reason next to its GRANT',
    );
  });

  for (const table of LEDGER) {
    it(`is refused a DELETE on ${table}, even for its own tenant's rows`, async () => {
      await assert.rejects(
        () => app.unsafe(`DELETE FROM ${table} WHERE business_id = '${BIZ_A}'`),
        /permission denied/i,
      );
    });
  }

  it('does not receive DELETE on a table created after 0036', async () => {
    // Default privileges are what 0001 used to hand DELETE to every new table;
    // 0036 revokes that too. Probe inside a transaction so nothing persists.
    const [probe] = await owner.begin(async (tx) => {
      await tx`CREATE TABLE public.zz_delete_probe (id int)`;
      const rows = await tx<{ can_delete: boolean; can_select: boolean }[]>`
        SELECT has_table_privilege('xangarro_app', 'public.zz_delete_probe', 'DELETE') AS can_delete,
               has_table_privilege('xangarro_app', 'public.zz_delete_probe', 'SELECT') AS can_select`;
      await tx`DROP TABLE public.zz_delete_probe`;
      return rows;
    });
    assert.equal(probe?.can_delete, false);
    assert.equal(probe?.can_select, true, 'the other default privileges must survive the revoke');
  });

  it('leaves the owner able to delete — cleanup and the dormancy job still work', async () => {
    await assert.doesNotReject(() => owner`DELETE FROM sales WHERE id = 'no-such-row'`);
  });
});
