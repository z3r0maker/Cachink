/**
 * Push queue round-trip (Slice 5 C12) — drives a fresh SQLite DB through
 * multiple pushes and asserts the HWM advances one batch at a time.
 */

import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { makeFreshDb } from './helpers/fresh-db.js';
import { createFakeLanServer } from './helpers/fake-server.js';
import { drainPushQueue } from '../src/client/push-queue.js';
import { readHwm } from '@cachink/data';
import { sales } from '@cachink/data/schema';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV';
const TS = '2026-04-23T15:00:00.000Z';

function makeSaleRow(i: number) {
  const pad = i.toString().padStart(3, '0');
  return {
    id: `01HZ8XQN9GZJXV8AKQ5X0C7${pad}` as string,
    fecha: '2026-04-23',
    concepto: `Venta ${i}`,
    categoria: 'Producto' as const,
    monto: BigInt(100 * i),
    metodo: 'Efectivo' as const,
    clienteId: null,
    estadoPago: 'pagado' as const,
    businessId: BIZ,
    deviceId: DEV,
    createdAt: TS,
    updatedAt: TS,
    deletedAt: null,
  };
}

describe('push queue — drainPushQueue', () => {
  it('pushes nothing when the change log is empty', async () => {
    const db = makeFreshDb();
    const server = createFakeLanServer();
    const res = await drainPushQueue({
      db,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      fetchImpl: server.fetch,
    });
    expect(res.batchesSent).toBe(0);
    expect(server.pushCallCount()).toBe(0);
  });

  it('pushes a batch and advances the HWM', async () => {
    const db = makeFreshDb();
    const server = createFakeLanServer();
    await db.insert(sales).values(makeSaleRow(1)).run();
    await db.insert(sales).values(makeSaleRow(2)).run();

    const res = await drainPushQueue({
      db,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      fetchImpl: server.fetch,
    });

    expect(server.pushCallCount()).toBe(1);
    expect(res.deltasAccepted).toBe(2);
    expect(await readHwm(db, 'localPushHwm')).toBe(2);
  });

  it('continues through multiple batches of 500 until drained', async () => {
    const db = makeFreshDb();
    const server = createFakeLanServer();
    const N = 550;
    for (let i = 1; i <= N; i += 1) {
      await db.insert(sales).values(makeSaleRow(i)).run();
    }

    const res = await drainPushQueue({
      db,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      fetchImpl: server.fetch,
    });

    // 550 rows → 2 batches (500 + 50)
    expect(server.pushCallCount()).toBe(2);
    expect(res.deltasAccepted).toBe(N);
    expect(await readHwm(db, 'localPushHwm')).toBe(N);
  });

  it('stops advancing the HWM when the server returns an error', async () => {
    const db = makeFreshDb();
    await db.insert(sales).values(makeSaleRow(1)).run();
    const broken: typeof fetch = async () => new Response('boom', { status: 500 });

    await expect(
      drainPushQueue({
        db,
        serverUrl: 'http://fake',
        accessToken: 'tok',
        fetchImpl: broken,
      }),
    ).rejects.toThrow(/push failed/);
    expect(await readHwm(db, 'localPushHwm')).toBe(0);
  });

  it('skips change-log entries for unknown tables without blocking progress', async () => {
    const db = makeFreshDb();
    const server = createFakeLanServer();
    // Insert a change-log row for a made-up table. The queue should skip
    // it, advance the HWM past it, and keep going.
    await db.run(
      sql`INSERT INTO __cachink_change_log
          (table_name, row_id, row_updated_at, row_device_id, op)
          VALUES ('app_config', '01HZ8XQN9GZJXV8AKQ5X0C7SX1', ${TS}, ${DEV}, 'insert')`,
    );
    await db.insert(sales).values(makeSaleRow(2)).run();

    const res = await drainPushQueue({
      db,
      serverUrl: 'http://fake',
      accessToken: 'tok',
      fetchImpl: server.fetch,
    });

    expect(res.deltasAccepted).toBe(1);
    expect(await readHwm(db, 'localPushHwm')).toBeGreaterThanOrEqual(2);
  });
});
