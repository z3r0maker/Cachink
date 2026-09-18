import { afterAll, beforeAll, it } from 'vitest';
import assert from 'node:assert/strict';
import postgres from 'postgres';

import { integrationSuite } from './support/db';
import { BIZ_A, BIZ_B, seedTwoTenants } from './support/tenants';

/**
 * Migration 0003_business_onboarding (N-12 … N-15): a portal-only table, one
 * row per business, isolated like every tenant table and never deletable by
 * the app role. Runs as `xangarro_app`, which RLS binds.
 */
const NOW = '2026-09-18T12:00:00.000Z';
const { url, describe } = integrationSuite();

async function as(sql: postgres.Sql, biz: string): Promise<void> {
  await sql`SELECT set_config('xangarro.business_id', ${biz}, false)`;
}

describe('business_onboarding', () => {
  let sql: postgres.Sql;

  beforeAll(async () => {
    sql = postgres(url as string, { max: 1, onnotice: () => undefined });
    await seedTwoTenants(sql);
    for (const biz of [BIZ_A, BIZ_B]) {
      await as(sql, biz);
      await sql`
        INSERT INTO business_onboarding (business_id, answers, updated_at)
        VALUES (${biz}, ${sql.json({ manejaInventario: biz === BIZ_A })}, ${NOW})
        ON CONFLICT (business_id) DO UPDATE SET answers = EXCLUDED.answers`;
    }
  });

  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  it('defaults the JSON columns so a fresh row reads as "nothing answered"', async () => {
    await as(sql, BIZ_A);
    const [row] = await sql<{ checklist: unknown; pending_paid_answers: unknown }[]>`
      SELECT checklist, pending_paid_answers FROM business_onboarding`;
    assert.deepEqual(row?.checklist, {});
    assert.deepEqual(row?.pending_paid_answers, []);
  });

  it('shows a tenant only its own row', async () => {
    await as(sql, BIZ_B);
    const rows = await sql<{ business_id: string }[]>`SELECT business_id FROM business_onboarding`;
    assert.deepEqual(
      rows.map((r) => r.business_id),
      [BIZ_B],
    );
  });

  it("refuses to write another tenant's row", async () => {
    await as(sql, BIZ_A);
    await assert.rejects(
      sql`INSERT INTO business_onboarding (business_id, updated_at) VALUES ('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ', ${NOW})`,
      /row-level security/,
    );
    const updated = await sql`
      UPDATE business_onboarding SET completed_at = ${NOW} WHERE business_id = ${BIZ_B}`;
    assert.equal(updated.count, 0, 'B is invisible to A, so nothing is updated');
  });

  it('does not let the app role delete a row', async () => {
    await as(sql, BIZ_A);
    await assert.rejects(
      sql`DELETE FROM business_onboarding WHERE business_id = ${BIZ_A}`,
      /permission denied/,
    );
  });
});
