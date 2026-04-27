/**
 * Pull loop tests (Slice 5 C13) — verifies LWW apply behaviour and the
 * batches-then-stops progression through `__cachink_sync_state`.
 */

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { makeFreshDb } from './helpers/fresh-db.js';
import { createFakeLanServer } from './helpers/fake-server.js';
import { runPullCycle } from '../src/client/pull-loop.js';
import { readHwm } from '@cachink/data';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const DEV_A = '01HZ8XQN9GZJXV8AKQ5X0C7DEA';
const DEV_B = '01HZ8XQN9GZJXV8AKQ5X0C7DEB';
const TS_OLD = '2026-04-23T15:00:00.000Z';
const TS_NEW = '2026-04-23T15:05:00.000Z';

function remoteSaleRow(id: string, deviceId: string, updatedAt: string, monto: number) {
  return {
    id,
    fecha: '2026-04-23',
    concepto: 'Taco',
    categoria: 'Producto',
    monto_centavos: BigInt(monto),
    metodo: 'Efectivo',
    cliente_id: null,
    estado_pago: 'pagado',
    business_id: BIZ,
    device_id: deviceId,
    created_at: updatedAt,
    updated_at: updatedAt,
    deleted_at: null,
  };
}

async function readSaleRow(db: ReturnType<typeof makeFreshDb>, id: string) {
  const rows = (await db.all(
    sql`SELECT id, monto_centavos, updated_at, device_id FROM sales WHERE id = ${id}`,
  )) as Array<{ id: string; monto_centavos: unknown; updated_at: string; device_id: string }>;
  return rows[0] ?? null;
}

describe('pull loop — runPullCycle', () => {
  it('pulls remote rows into an empty local db', async () => {
    const db = makeFreshDb();
    const server = createFakeLanServer({
      initialRows: [
        {
          table: 'sales',
          row: remoteSaleRow('01HZ8XQN9GZJXV8AKQ5X0C7S01', DEV_A, TS_OLD, 45_000),
          op: 'insert',
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
    const local = await readSaleRow(db, '01HZ8XQN9GZJXV8AKQ5X0C7S01');
    expect(local?.device_id).toBe(DEV_A);
    expect(await readHwm(db, 'serverPullHwm')).toBeGreaterThan(0);
  });

  it('LWW — newer remote update overwrites older local row', async () => {
    const db = makeFreshDb();
    // Seed a local row with the older timestamp.
    await db.run(
      sql`INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, cliente_id, estado_pago,
                             business_id, device_id, created_at, updated_at, deleted_at)
          VALUES ('01HZ8XQN9GZJXV8AKQ5X0C7S02', '2026-04-23', 'Old', 'Producto', '10000', 'Efectivo', NULL, 'pagado',
                  ${BIZ}, ${DEV_A}, ${TS_OLD}, ${TS_OLD}, NULL)`,
    );
    const server = createFakeLanServer({
      initialRows: [
        {
          table: 'sales',
          row: remoteSaleRow('01HZ8XQN9GZJXV8AKQ5X0C7S02', DEV_A, TS_NEW, 20_000),
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
    const local = await readSaleRow(db, '01HZ8XQN9GZJXV8AKQ5X0C7S02');
    expect(local?.updated_at).toBe(TS_NEW);
  });

  it('LWW — older remote update is rejected and recorded as a conflict', async () => {
    const db = makeFreshDb();
    await db.run(
      sql`INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, cliente_id, estado_pago,
                             business_id, device_id, created_at, updated_at, deleted_at)
          VALUES ('01HZ8XQN9GZJXV8AKQ5X0C7S03', '2026-04-23', 'Newer', 'Producto', '30000', 'Efectivo', NULL, 'pagado',
                  ${BIZ}, ${DEV_A}, ${TS_NEW}, ${TS_NEW}, NULL)`,
    );
    const server = createFakeLanServer({
      initialRows: [
        {
          table: 'sales',
          row: remoteSaleRow('01HZ8XQN9GZJXV8AKQ5X0C7S03', DEV_B, TS_OLD, 10_000),
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
    expect(res.deltasRejected).toBe(1);

    const conflicts = (await db.all(
      sql`SELECT direction, reason FROM __cachink_conflicts WHERE row_id = '01HZ8XQN9GZJXV8AKQ5X0C7S03'`,
    )) as Array<{ direction: string; reason: string }>;
    expect(conflicts).toEqual([{ direction: 'inbound', reason: 'stale' }]);
  });

  it('tiebreaks on equal updated_at by smaller device_id', async () => {
    const db = makeFreshDb();
    // Local row: DEV_B (larger lex)
    await db.run(
      sql`INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, cliente_id, estado_pago,
                             business_id, device_id, created_at, updated_at, deleted_at)
          VALUES ('01HZ8XQN9GZJXV8AKQ5X0C7S04', '2026-04-23', 'Local', 'Producto', '10000', 'Efectivo', NULL, 'pagado',
                  ${BIZ}, ${DEV_B}, ${TS_OLD}, ${TS_OLD}, NULL)`,
    );
    // Remote row: same updated_at, DEV_A (smaller lex) — must win.
    const server = createFakeLanServer({
      initialRows: [
        {
          table: 'sales',
          row: remoteSaleRow('01HZ8XQN9GZJXV8AKQ5X0C7S04', DEV_A, TS_OLD, 99_999),
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
    const local = await readSaleRow(db, '01HZ8XQN9GZJXV8AKQ5X0C7S04');
    expect(local?.device_id).toBe(DEV_A);
  });
});
