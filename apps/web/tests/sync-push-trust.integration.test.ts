import assert from 'node:assert/strict';
import { afterAll, beforeAll, beforeEach, it } from 'vitest';
import postgres from 'postgres';
import { ApplyPushUseCase, type PushAnomaly } from '@xangarro/application';
import type { Delta } from '@xangarro/contracts';
import { createDb, withBusiness, type Db } from '@xangarro/data-pg';
import { integrationSuite } from '@xangarro/testing/integration';

import { PgPushStore } from '../src/server/sync/pg-push-store';
import { PUSH_T1, PUSH_TOUCHED, pushFixtures, pushId as id } from './support/push-fixtures';

/**
 * What a push is no longer trusted for inside its own tenant (security audit
 * 2026-11, F-05), end to end — `ApplyPushUseCase` over `PgPushStore` on real
 * Postgres under RLS: a clock from the future (a), a `rowId` that is not its
 * row's id (b), and the anomalies that are observed and never refused (c).
 * Same database contract as `sync-push.integration.test.ts`.
 */
const { url, describe: suite } = integrationSuite();

const A = id();
const DEVICE = id();
const OLD_DEVICE = id();
const { expense, delta } = pushFixtures(A, DEVICE);
const NOON = new Date('2026-11-09T18:00:00.000Z');
const FAR = '2099-01-01T00:00:00.000Z';

suite('what a push is trusted for', () => {
  let db: Db;
  let owner: postgres.Sql;
  let clock: Date;
  const logged: { scope: unknown; anomalies: readonly PushAnomaly[] }[] = [];

  /** One push in one tenant transaction, as the route runs it, on the test's clock. */
  const push = (deltas: Delta[]) =>
    withBusiness(db, A, (tx) => {
      const store = new PgPushStore(tx, A, DEVICE, {
        now: () => clock,
        logAnomalies: (scope, anomalies) => logged.push({ scope, anomalies }),
      });
      return new ApplyPushUseCase(store, A, (e) => {
        throw e;
      }).execute({ deltas });
    });
  const stored = async (rowId: string) => {
    const [row] = await owner<{ concepto: string; updated: Date }[]>`
      SELECT concepto, updated_at AS updated FROM expenses WHERE id = ${rowId}`;
    return row === undefined ? null : [row.concepto, row.updated.toISOString()];
  };

  beforeAll(async () => {
    db = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    await owner`
      INSERT INTO devices (id, nombre, plataforma, business_id, created_at, updated_at)
      VALUES (${DEVICE}, 'Caja', 'android', ${A}, ${PUSH_T1}, ${PUSH_T1})`;
  });

  beforeEach(() => {
    clock = NOON;
    logged.length = 0;
  });

  afterAll(async () => {
    for (const table of [...PUSH_TOUCHED, 'client_payments', 'clients']) {
      await owner?.unsafe(`DELETE FROM ${table} WHERE business_id = $1`, [A]);
    }
    await db?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('a far-future row is accepted, stored at the server’s time, and re-pushed idempotently', async () => {
    const row = expense(id(), { updatedAt: FAR, concepto: 'del futuro' });
    const first = await push([row]);
    assert.deepEqual(first.rejected, []);
    assert.deepEqual(await stored(row.rowId), ['del futuro', NOON.toISOString()]);

    clock = new Date(NOON.getTime() + 60_000);
    const again = await push([row]);
    assert.equal(again.accepted[0]?.serverSeq, first.accepted[0]?.serverSeq);
    assert.deepEqual(await stored(row.rowId), ['del futuro', NOON.toISOString()], 'not rewritten');
  });

  it('then an ordinary edit wins: the row is no longer pinned', async () => {
    const rowId = id();
    await push([expense(rowId, { updatedAt: FAR, concepto: 'del futuro' })]);
    clock = new Date(NOON.getTime() + 600_000);
    const edit = expense(rowId, { updatedAt: clock.toISOString(), concepto: 'corregido' });
    const r = await push([{ ...edit, op: 'update' } as Delta]);
    assert.equal(r.accepted.length, 1);
    assert.deepEqual(await stored(rowId), ['corregido', clock.toISOString()]);
  });

  it('a wrong clock keeps syncing: opened and closed in one push, the later state is stored', async () => {
    // Both versions clamp to the same server instant; the second must still win.
    const rowId = id();
    const opened = expense(rowId, { updatedAt: FAR, concepto: 'abierto' });
    const closed = expense(rowId, { updatedAt: '2099-01-01T08:00:00.000Z', concepto: 'cerrado' });
    const r = await push([opened, { ...closed, op: 'update' } as Delta]);
    assert.deepEqual(r.rejected, []);
    assert.equal(r.accepted.length, 2);
    assert.equal((await stored(rowId))?.[0], 'cerrado');
  });

  it('a past timestamp is stored as the device wrote it', async () => {
    const row = expense(id());
    await push([row]);
    assert.deepEqual(await stored(row.rowId), ['Renta', PUSH_T1]);
  });

  it('refuses a delta whose rowId is not its row’s id, and writes neither row', async () => {
    const [named, written, honest] = [id(), id(), expense(id())];
    const disguised = { ...expense(written), rowId: named } as Delta;
    const r = await push([disguised, honest]);
    assert.deepEqual(
      r.rejected.map((x) => [x.rowId, x.code, x.retryable]),
      [[named, 'VALIDATION', false]],
    );
    assert.deepEqual([await stored(named), await stored(written)], [null, null]);
    assert.equal((await stored(honest.rowId))?.[0], 'Renta');
    const receipts = await owner`
      SELECT row_id FROM sync_receipts WHERE business_id = ${A} AND row_id IN (${named}, ${written})`;
    assert.equal(receipts.length, 0);
  });

  it('accepts a row captured under another device id or with a negative abono, and says so once', async () => {
    const relinked = expense(id(), { deviceId: OLD_DEVICE });
    const cliente = delta('clients', { id: id(), nombre: 'Doña Lupe' });
    const abono = delta('client_payments', {
      id: id(),
      clienteId: cliente.rowId,
      fecha: '2026-09-26',
      montoCentavos: -500n,
      metodo: 'Efectivo',
      nota: null,
    });
    const honest = expense(id());
    const r = await push([relinked, honest, cliente, abono]);
    assert.deepEqual(r.rejected, [], 'observed, never refused');
    assert.equal(r.accepted.length, 4);
    const [device] = await owner`SELECT device_id FROM expenses WHERE id = ${relinked.rowId}`;
    assert.equal(device?.['device_id'], OLD_DEVICE, 'stored exactly as pushed');

    assert.equal(logged.length, 1, 'one line for the push');
    assert.deepEqual(logged[0]?.scope, { businessId: A, deviceId: DEVICE });
    assert.deepEqual(
      logged[0]?.anomalies.map((a) => [a.table, a.rowId, a.kind, a.field]),
      [
        ['expenses', relinked.rowId, 'DEVICE_MISMATCH', 'deviceId'],
        ['client_payments', abono.rowId, 'NEGATIVE_MONEY', 'montoCentavos'],
      ],
    );
  });

  it('says nothing for an honest push, and nothing again for a retry already answered', async () => {
    await push([expense(id()), expense(id())]);
    assert.equal(logged.length, 0);
    const relinked = expense(id(), { deviceId: OLD_DEVICE });
    await push([relinked]);
    await push([relinked]);
    assert.equal(logged.length, 1, 'the retry is answered from its receipt');
  });
});
