import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, type Db } from '../src/client';
import { liveBusinessIds } from '../src/queries/metering';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * `liveBusinessIds` — P-30's cross-tenant enumeration — against a real
 * Postgres, on the role that is supposed to be able to run it and on the role
 * that is not.
 *
 * Three claims, and the third is the one that matters: `xangarro_metering`
 * sees every live business **without a tenant claim**, a soft-deleted business
 * is not live, and the tenant role running the same SQL sees only its own row.
 * If that last one ever returns two, the fan-out is not the only thing broken.
 */
const { url, describe } = integrationSuite();
const LIVE_A = testId('W');
const LIVE_B = testId('W');
const BORRADO = testId('W');

function roleUrl(appUrl: string, role: string): string {
  const u = new URL(appUrl);
  u.username = role;
  u.password = role;
  return u.toString();
}

async function seed(owner: postgres.Sql): Promise<void> {
  const fila = (id: string, deleted: string | null) => ({
    id,
    business_id: id,
    device_id: 'dev',
    created_at: '2026-05-01T12:00:00.000Z',
    updated_at: '2026-05-01T12:00:00.000Z',
    deleted_at: deleted,
    nombre: `Fan-out ${id.slice(-4)}`,
    regimen_fiscal: 'RESICO',
    isr_tasa: 125,
  });
  for (const [id, deleted] of [
    [LIVE_A, null],
    [LIVE_B, null],
    [BORRADO, '2026-05-02T12:00:00.000Z'],
  ] as const) {
    await owner`INSERT INTO businesses ${owner(fila(id, deleted))}`;
  }
}

describe('liveBusinessIds(): who the fan-out may enumerate', () => {
  let owner: postgres.Sql;
  let metering: Db;
  let app: postgres.Sql;

  beforeAll(async () => {
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    metering = createDb(roleUrl(url as string, 'xangarro_metering'));
    app = postgres(url as string, { max: 1, onnotice: () => {} });
    await seed(owner);
  });

  afterAll(async () => {
    // Restore: this suite's three rows are its own, and nothing else may
    // inherit them. Runs on failure too.
    await owner`DELETE FROM businesses WHERE id IN ${owner([LIVE_A, LIVE_B, BORRADO])}`.catch(
      () => undefined,
    );
    await metering?.$client.end({ timeout: 5 });
    await app?.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('returns every live business to the metering role, with no tenant claim set', async () => {
    const ids = await liveBusinessIds(metering);

    assert.ok(ids.includes(LIVE_A), 'the first live business is enumerated');
    assert.ok(ids.includes(LIVE_B), 'and so is the second — this read is cross-tenant');
    const otra = await liveBusinessIds(metering);
    assert.deepEqual(otra, ids, 'the same order twice — what sharding and resuming rely on');
  });

  it('does not call a soft-deleted business live', async () => {
    const ids = await liveBusinessIds(metering);
    assert.equal(ids.includes(BORRADO), false);
  });

  it('shows the tenant role only its own business, running the same SQL', async () => {
    // The fan-out cannot be built on the app connection, and this is why: RLS
    // scopes it to the claim. Asserted rather than assumed — it is the reason
    // P-30 needed a role decision at all.
    await app`SELECT set_config('xangarro.business_id', ${LIVE_A}, false)`;
    const rows = await app<
      { id: string }[]
    >`SELECT id FROM businesses WHERE deleted_at IS NULL ORDER BY id`;

    assert.deepEqual(
      rows.map((r) => r.id),
      [LIVE_A],
      'its own row, and no other tenant’s',
    );
  });
});
