import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness } from '../src/client';
import { tenantPlanOverrides, tenantPlatformRules } from '../src/queries/entitlement-inputs';
import { integrationSuite } from './support/db';
import { BIZ_A, BIZ_B, seedTwoTenants } from './support/tenants';
import { testId } from './support/test-ids';

/**
 * `0039_entitlement_inputs.sql` (N-09, N-06): the portal reads the console's
 * flags and overrides only through two tenant-scoped definer functions. The
 * console's own migrations are applied here (they are idempotent — its e2e
 * setup re-applies them the same way) so the functions meet the real tables.
 */
const ADMIN_MIGRATIONS = join(
  import.meta.dirname,
  '../../../apps/backoffice/src/server/db/migrations',
);
const { url, describe } = integrationSuite();

describe('entitlement inputs from the console (0039)', () => {
  const staff = testId('S');
  const [overA, overB] = [testId('O'), testId('O')];
  let app: postgres.Sql;
  let owner: postgres.Sql;

  beforeAll(async () => {
    app = postgres(url as string, { max: 1, onnotice: () => undefined });
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    await seedTwoTenants(owner);
    for (const f of ['0001_staff.sql', '0003_plan_overrides.sql', '0005_platform_flags.sql'])
      await owner.unsafe(readFileSync(join(ADMIN_MIGRATIONS, f), 'utf8'));
    await owner`
      INSERT INTO staff_members (id, user_id, email, nombre, created_at)
      VALUES (${staff}, ${staff}, ${`${staff}@staff.test.mx`}, 'Staff', now())`;
    await owner`
      INSERT INTO plan_overrides (id, business_id, kind, plan_id, reason, expires_at, created_by, created_at)
      VALUES (${overA}, ${BIZ_A}, 'comp_plan', 'xangarrote', 'beta tester', now() + interval '30 days', ${staff}, now()),
             (${overB}, ${BIZ_B}, 'comp_plan', 'xangarro', 'otro negocio', now() + interval '30 days', ${staff}, now())`;
  });

  afterAll(async () => {
    await app?.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('returns only the calling tenant’s overrides, without reason or author', async () => {
    await app`SELECT set_config('xangarro.business_id', ${BIZ_A}, false)`;
    const rows = await app`SELECT * FROM xangarro.tenant_plan_overrides()`;
    assert.deepEqual(
      rows.map((r) => r['id']).filter((id) => id === overA || id === overB),
      [overA],
    );
    assert.deepEqual(Object.keys(rows[0] ?? {}).sort(), [
      'created_at',
      'days',
      'expires_at',
      'id',
      'kind',
      'plan_id',
    ]);
  });

  it('cuts every allowlist down to the calling tenant', async () => {
    // Inside a rolled-back transaction, dated ahead: always the latest rule for
    // the key, and nothing left behind for any other suite.
    await owner
      .begin(async (tx) => {
        await tx`
        INSERT INTO platform_flag_events (id, flag_key, mode, allowlist_business_ids, reason, updated_by, updated_at)
        VALUES (${testId('F')}, 'merma', 'allowlist', ${[BIZ_A, BIZ_B]}, 'beta de merma', ${staff}, now() + interval '1 day')`;
        await tx`SET LOCAL ROLE xangarro_app`;
        await tx`SELECT set_config('xangarro.business_id', ${BIZ_A}, true)`;
        const [merma] = await tx<{ allowlist_business_ids: string[]; mode: string }[]>`
        SELECT allowlist_business_ids, mode FROM xangarro.tenant_platform_flags() WHERE flag_key = 'merma'`;
        assert.deepEqual(
          merma?.allowlist_business_ids,
          [BIZ_A],
          'no tenant learns who else is in a beta',
        );
        assert.equal(merma?.mode, 'allowlist');
        throw new Error('rollback');
      })
      .catch((e: Error) => assert.equal(e.message, 'rollback'));
  });

  it('maps onto the domain facts the entitlement rule reads', async () => {
    const db = createDb(url as string);
    try {
      const { overrides, rules } = await withBusiness(db, BIZ_A, async (tx) => ({
        overrides: await tenantPlanOverrides(tx),
        rules: await tenantPlatformRules(tx),
      }));
      const mine = overrides.find((o) => o.id === overA);
      assert.equal(mine?.kind, 'comp_plan');
      assert.equal(mine?.kind === 'comp_plan' && mine.planId, 'xangarrote');
      assert.ok(mine && !('reason' in mine), 'no staff reason reaches the portal');
      for (const r of rules)
        assert.ok(
          r.allowlistBusinessIds.every((id) => id === BIZ_A),
          r.key,
        );
    } finally {
      await db.$client.end({ timeout: 5 });
    }
  });

  it('answers nothing without a tenant, and never exposes the tables themselves', async () => {
    await app`SELECT set_config('xangarro.business_id', '', false)`;
    assert.equal((await app`SELECT * FROM xangarro.tenant_plan_overrides()`).length, 0);
    await assert.rejects(() => app`SELECT id FROM plan_overrides`, /permission denied/);
    await assert.rejects(() => app`SELECT id FROM platform_flag_events`, /permission denied/);
  });

  it('answers «no rows» where the console’s tables do not exist, instead of failing', async () => {
    await owner
      .begin(async (tx) => {
        await tx`ALTER TABLE plan_overrides RENAME TO plan_overrides_hidden`;
        await tx`ALTER VIEW platform_flags_for_entitlement RENAME TO pffe_hidden`;
        await tx`SET LOCAL ROLE xangarro_app`;
        await tx`SELECT set_config('xangarro.business_id', ${BIZ_A}, true)`;
        assert.equal((await tx`SELECT * FROM xangarro.tenant_plan_overrides()`).length, 0);
        assert.equal((await tx`SELECT * FROM xangarro.tenant_platform_flags()`).length, 0);
        throw new Error('rollback');
      })
      .catch((e: Error) => assert.equal(e.message, 'rollback'));
  });
});
