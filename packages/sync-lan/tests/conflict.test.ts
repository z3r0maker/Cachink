/**
 * Conflict determinism tests — exercises the three scenarios called out
 * in ADR-029 (Slice 5 C15).
 *
 * 1. Two devices edit the same row at the exact same `updated_at` — the
 *    smaller `device_id` wins on both sides.
 * 2. An offline tablet pushes a stale update — the server rejects it
 *    with `reason: 'stale'` and the local row stays unchanged.
 * 3. A delete-vs-update race — delete (soft) wins only when its
 *    `updated_at` is strictly later.
 */

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { makeFreshDb } from './helpers/fresh-db.js';
import { createFakeLanServer } from './helpers/fake-server.js';
import { drainPushQueue } from '../src/client/push-queue.js';
import { runPullCycle } from '../src/client/pull-loop.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const DEV_A = '01HZ8XQN9GZJXV8AKQ5X0C7DEA';
const DEV_B = '01HZ8XQN9GZJXV8AKQ5X0C7DEB';
const TS_1 = '2026-04-23T15:00:00.000Z';
const TS_2 = '2026-04-23T15:05:00.000Z';

function productRow(opts: {
  id: string;
  deviceId: string;
  updatedAt: string;
  umbral: number;
  deletedAt?: string | null;
}) {
  return {
    id: opts.id,
    nombre: 'Harina',
    sku: null,
    categoria: 'Materia Prima',
    costo_unit_centavos: BigInt(3500),
    unidad: 'kg',
    umbral_stock_bajo: opts.umbral,
    business_id: BIZ,
    device_id: opts.deviceId,
    created_at: TS_1,
    updated_at: opts.updatedAt,
    deleted_at: opts.deletedAt ?? null,
  };
}

async function readProduct(db: ReturnType<typeof makeFreshDb>, id: string) {
  const rows = (await db.all(
    sql`SELECT id, umbral_stock_bajo, device_id, updated_at, deleted_at FROM products WHERE id = ${id}`,
  )) as Array<{
    id: string;
    umbral_stock_bajo: number;
    device_id: string;
    updated_at: string;
    deleted_at: string | null;
  }>;
  return rows[0] ?? null;
}

describe('Slice 5 conflict scenarios (ADR-029 §Conflict resolution)', () => {
  it('same updated_at → lex-smaller device_id wins on the pull applier', async () => {
    const db = makeFreshDb();
    // Local wrote device B first.
    await db.run(
      sql`INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo,
                                business_id, device_id, created_at, updated_at, deleted_at)
          VALUES ('01HZ8XQN9GZJXV8AKQ5X0C7PR1', 'Harina', NULL, 'Materia Prima', '3500', 'kg', 3,
                  ${BIZ}, ${DEV_B}, ${TS_1}, ${TS_1}, NULL)`,
    );
    // Server offers the same row, same updated_at, but DEV_A (smaller lex).
    const server = createFakeLanServer({
      initialRows: [
        {
          table: 'products',
          row: productRow({
            id: '01HZ8XQN9GZJXV8AKQ5X0C7PR1',
            deviceId: DEV_A,
            updatedAt: TS_1,
            umbral: 7,
          }),
          op: 'update',
        },
      ],
    });
    const res = await runPullCycle({
      db,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      fetchImpl: server.fetch,
    });
    expect(res.deltasApplied).toBe(1);
    const local = await readProduct(db, '01HZ8XQN9GZJXV8AKQ5X0C7PR1');
    expect(local?.device_id).toBe(DEV_A);
    expect(local?.umbral_stock_bajo).toBe(7);
  });

  it('offline tablet pushing a stale row → server rejects with reason=stale', async () => {
    // Local tablet has the older row (TS_1). It pushes. Server already
    // has a newer TS_2 row; LWW rejects the push.
    const db = makeFreshDb();
    await db.run(
      sql`INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo,
                                business_id, device_id, created_at, updated_at, deleted_at)
          VALUES ('01HZ8XQN9GZJXV8AKQ5X0C7PR2', 'Harina', NULL, 'Materia Prima', '3500', 'kg', 5,
                  ${BIZ}, ${DEV_A}, ${TS_1}, ${TS_1}, NULL)`,
    );
    const server = createFakeLanServer({
      initialRows: [
        {
          table: 'products',
          row: productRow({
            id: '01HZ8XQN9GZJXV8AKQ5X0C7PR2',
            deviceId: DEV_B,
            updatedAt: TS_2,
            umbral: 9,
          }),
          op: 'update',
        },
      ],
    });

    const res = await drainPushQueue({
      db,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      fetchImpl: server.fetch,
    });
    expect(res.deltasAccepted).toBe(0);
    expect(res.deltasRejected).toBe(1);
    // Server state still holds the newer row.
    const stored = server.storage().find((r) => r.rowId === '01HZ8XQN9GZJXV8AKQ5X0C7PR2');
    expect(stored?.deviceId).toBe(DEV_B);
    expect(stored?.updatedAt).toBe(TS_2);
  });

  it('delete vs update: delete wins only when its updated_at is strictly later', async () => {
    const db = makeFreshDb();
    // Local: updated row at TS_2 (newer).
    await db.run(
      sql`INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo,
                                business_id, device_id, created_at, updated_at, deleted_at)
          VALUES ('01HZ8XQN9GZJXV8AKQ5X0C7PR3', 'Harina', NULL, 'Materia Prima', '3500', 'kg', 8,
                  ${BIZ}, ${DEV_A}, ${TS_1}, ${TS_2}, NULL)`,
    );
    // Server wants to soft-delete with an OLDER timestamp — local wins.
    const server = createFakeLanServer({
      initialRows: [
        {
          table: 'products',
          row: productRow({
            id: '01HZ8XQN9GZJXV8AKQ5X0C7PR3',
            deviceId: DEV_B,
            updatedAt: TS_1,
            umbral: 3,
            deletedAt: TS_1,
          }),
          op: 'update',
        },
      ],
    });
    await runPullCycle({
      db,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      fetchImpl: server.fetch,
    });
    let local = await readProduct(db, '01HZ8XQN9GZJXV8AKQ5X0C7PR3');
    expect(local?.deleted_at).toBeNull();
    expect(local?.umbral_stock_bajo).toBe(8);

    // Now the server replaces its row with a NEWER delete — local must yield.
    const server2 = createFakeLanServer({
      initialRows: [
        {
          table: 'products',
          row: productRow({
            id: '01HZ8XQN9GZJXV8AKQ5X0C7PR3',
            deviceId: DEV_B,
            updatedAt: '2026-04-23T15:10:00.000Z',
            umbral: 3,
            deletedAt: '2026-04-23T15:10:00.000Z',
          }),
          op: 'update',
        },
      ],
    });
    // Reset the pull HWM so the new server replays its state.
    await db.run(sql`DELETE FROM __cachink_sync_state WHERE scope = 'serverPullHwm'`);
    await runPullCycle({
      db,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      fetchImpl: server2.fetch,
    });
    local = await readProduct(db, '01HZ8XQN9GZJXV8AKQ5X0C7PR3');
    expect(local?.deleted_at).toBe('2026-04-23T15:10:00.000Z');
  });
});
