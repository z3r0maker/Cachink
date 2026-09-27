/**
 * The device half of the snapshot bootstrap (C-23, ADR-119): baseline +
 * recent movements = full-history stock, echoes forgotten in chunks, a page
 * applied all or nothing, and a re-link that never counts a movement twice.
 */

import { afterAll, beforeAll, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';
import {
  SNAPSHOT_MOVEMENT_WINDOW_DAYS,
  type PullResponse,
  type ReferenceTables,
} from '@xangarro/contracts';
import { buildFixtures, startMockServer, type RunningMock } from '@xangarro/contracts/mock';
import {
  DrizzleAppConfigRepository,
  DrizzleInventoryMovementsRepository,
  type XangarroDatabase,
} from '@xangarro/data';
import type { ProductId } from '@xangarro/domain';
import { makeFreshDb } from '../../data/tests/helpers/fresh-db.js';
import { ApiClient } from '../src/api-client.js';
import { applyPulledPage } from '../src/page-applier.js';
import { pullAll } from '../src/pull.js';
import { SYNC_CONFIG_KEYS } from '../src/sync-keys.js';
import { activatedDevice } from './helpers/device.js';

const DAY = 86_400_000;
const fx = buildFixtures();
const BIZ = fx.businesses[0]!.id;
const [P1, P2, P3] = fx.products.map((p) => p.id);

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ulid = (n: number): string => {
  let out = '';
  for (let v = n, i = 0; i < 20; i += 1, v = Math.floor(v / 32)) out = ALPHABET[v % 32] + out;
  return `01JMVT${out}`;
};

function movementRow(
  n: number,
  productoId: string,
  daysAgo: number,
  tipo: string,
  cantidad: number,
) {
  const at = new Date(Date.now() - daysAgo * DAY).toISOString();
  return {
    id: ulid(n),
    productoId,
    fecha: at.slice(0, 10),
    tipo,
    cantidad,
    costoUnitCentavos: 1500n,
    motivo: tipo === 'entrada' ? 'Compra a proveedor' : 'Merma / daño',
    nota: null,
    origen: 'manual',
    businessId: BIZ,
    deviceId: '01JDEVZ0000000000000000001',
    createdByUserId: null,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
  };
}

/** 1,200 movements over 300 days on three products — a year-old shop in miniature. */
const HISTORY = Array.from({ length: 1_200 }, (_, i) =>
  movementRow(
    i + 1,
    [P1, P2, P3][i % 3]!,
    300 - (i % 300),
    i % 4 === 0 ? 'salida' : 'entrada',
    1 + (i % 7),
  ),
);

const stockOf = (db: XangarroDatabase, p: string) =>
  new DrizzleInventoryMovementsRepository(db, 'DEV' as never).sumStock(p as ProductId);

const count = async (db: XangarroDatabase, table: string): Promise<number> =>
  ((await db.get(sql.raw(`SELECT COUNT(*) AS n FROM ${table}`))) as { n: number }).n;

function emptyTables(over: Partial<Record<keyof ReferenceTables, unknown>> = {}): ReferenceTables {
  return {
    businesses: [],
    products: [],
    clients: [],
    users: [],
    employees: [],
    recurring_expenses: [],
    conversion_recetas: [],
    mensajes_operador: [],
    opening_balances: [],
    opening_balance_clients: [],
    inventory_movements: [],
    feature_flags: {},
    ...over,
  } as unknown as ReferenceTables;
}

const page = (
  tables: ReferenceTables,
  snapshot?: Partial<NonNullable<PullResponse['snapshot']>>,
) => ({
  serverSeq: 900,
  serverTime: new Date().toISOString(),
  tables,
  ...(snapshot === undefined
    ? {}
    : {
        snapshot: {
          cutoff: new Date(Date.now() - SNAPSHOT_MOVEMENT_WINDOW_DAYS * DAY).toISOString(),
          first: true,
          next: null,
          stockBaseline: [],
          ...snapshot,
        },
      }),
});

describe('snapshot bootstrap on the device (C-23)', () => {
  let mock: RunningMock;
  beforeAll(async () => {
    mock = await startMockServer(0);
  });
  afterAll(async () => {
    await mock.close();
  });

  it('baseline + recent movements gives every product the stock full history gives', async () => {
    const d = await activatedDevice(mock.url);
    for (const m of HISTORY) mock.api.state.upsert('inventory_movements', m);
    mock.api.state.snapshotBudget = { rows: 100, bytes: 2_000_000 };
    const client = new ApiClient({ baseUrl: mock.url });

    const legacy = await client.pull(d.token, 0);
    if (!legacy.ok) throw new Error(legacy.message);
    await applyPulledPage(d.db, legacy.data, BIZ, {});

    const fresh = makeFreshDb();
    const appConfig = new DrizzleAppConfigRepository(fresh);
    const out = await pullAll({ db: fresh, appConfig, client, token: d.token });
    assert.equal(out.error, null);
    // ~360 recent movements + the catalogue + the baseline, 100 rows a page, then one delta pull.
    assert.ok(out.pages >= 5, `${out.pages} pages at 100 rows a page`);

    for (const p of [P1, P2, P3])
      assert.equal(await stockOf(fresh, p!), await stockOf(d.db, p!), p);
    assert.ok(
      (await count(fresh, 'inventory_movements')) < HISTORY.length / 2,
      'old movements stay home',
    );
    assert.ok((await count(fresh, '__stock_baseline')) > 0);
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.bootstrapNext), null, 'snapshot closed');
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.pullSeq), String(mock.api.state.serverSeq));
    assert.equal(await count(fresh, '__xangarro_change_log'), 0, 'nothing to push back');
  });

  it('forgets the echoes of 40,000 rows in chunks — past SQLite’s 32,766 variables', async () => {
    const db = makeFreshDb();
    const rows = Array.from({ length: 40_000 }, (_, i) =>
      movementRow(10_000 + i, P1!, 5, 'entrada', 1),
    );
    await applyPulledPage(db, page(emptyTables({ inventory_movements: rows })), BIZ, {});
    assert.equal(await count(db, 'inventory_movements'), 40_000);
    assert.equal(await count(db, '__xangarro_change_log'), 0);
    assert.equal(await stockOf(db, P1!), 40_000);
  });

  it('applies a page all or nothing: a bad row leaves no row, baseline or cursor behind', async () => {
    const db = makeFreshDb();
    const appConfig = new DrizzleAppConfigRepository(db);
    await appConfig.set(SYNC_CONFIG_KEYS.pullSeq, '5');
    const good = movementRow(1, P1!, 3, 'entrada', 4);
    const bad = { ...movementRow(2, P1!, 3, 'entrada', 4), cantidad: null };
    const broken = page(
      emptyTables({ products: [fx.products[0]], inventory_movements: [good, bad] }),
      {
        stockBaseline: [{ productoId: P1!, cantidad: 50 }],
        next: 'more',
      },
    );
    await assert.rejects(
      applyPulledPage(db, broken, BIZ, {
        [SYNC_CONFIG_KEYS.pullSeq]: '900',
        [SYNC_CONFIG_KEYS.bootstrapNext]: 'more',
      }),
    );
    assert.equal(await count(db, 'products'), 0);
    assert.equal(await count(db, 'inventory_movements'), 0);
    assert.equal(await count(db, '__stock_baseline'), 0);
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.pullSeq), '5');
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.bootstrapNext), null);
  });

  it('the first page resets the baseline, later pages add to it', async () => {
    const db = makeFreshDb();
    await db.run(sql`INSERT INTO __stock_baseline (producto_id, cantidad) VALUES (${P3!}, 99)`);
    await applyPulledPage(
      db,
      page(emptyTables(), { stockBaseline: [{ productoId: P1!, cantidad: 5 }], next: 't' }),
      BIZ,
      {},
    );
    await applyPulledPage(
      db,
      page(emptyTables(), { first: false, stockBaseline: [{ productoId: P2!, cantidad: 3 }] }),
      BIZ,
      {},
    );
    assert.deepEqual(
      [await stockOf(db, P1!), await stockOf(db, P2!), await stockOf(db, P3!)],
      [5, 3, 0],
    );
    await applyPulledPage(
      db,
      page(emptyTables(), { stockBaseline: [{ productoId: P1!, cantidad: 2 }] }),
      BIZ,
      {},
    );
    assert.deepEqual([await stockOf(db, P1!), await stockOf(db, P2!)], [2, 0]);
  });

  it('re-linking over a kept database counts no movement twice, and keeps the unsent one', async () => {
    const db = makeFreshDb();
    const old = movementRow(1, P1!, 200, 'entrada', 10);
    await applyPulledPage(db, page(emptyTables({ inventory_movements: [old] })), BIZ, {});
    // A local movement never pushed: the server's baseline cannot contain it.
    await new DrizzleInventoryMovementsRepository(db, 'DEV' as never).create({
      ...movementRow(2, P1!, 150, 'entrada', 4),
      id: undefined,
      costoUnitCentavos: 1500n,
    } as never);
    await db.run(
      sql`UPDATE inventory_movements SET created_at = ${old.createdAt} WHERE id <> ${old.id}`,
    );
    assert.equal(await stockOf(db, P1!), 14);
    // The server's snapshot: its baseline already holds `old` (10) and more (+6).
    await applyPulledPage(
      db,
      page(emptyTables(), { stockBaseline: [{ productoId: P1!, cantidad: 16 }] }),
      BIZ,
      {},
    );
    assert.equal(await stockOf(db, P1!), 20, '16 from the server + 4 not sent yet');
  });

  it('an older server that ignores ?snapshot ends the bootstrap in its one legacy page', async () => {
    const db = makeFreshDb();
    const appConfig = new DrizzleAppConfigRepository(db);
    await appConfig.set(SYNC_CONFIG_KEYS.bootstrapNext, 'stale-token');
    const legacy = {
      ...page(emptyTables({ inventory_movements: [movementRow(1, P1!, 400, 'entrada', 3)] })),
    };
    const calls: (string | undefined)[] = [];
    const client = {
      pull: async (_t: string, _since: number, snapshot?: string) => {
        calls.push(snapshot);
        const empty = calls.length > 1;
        return {
          ok: true as const,
          data: {
            ...(empty ? page(emptyTables()) : legacy),
            entitlement: { payload: { businessId: BIZ } },
            acknowledgedThrough: 0,
          } as unknown as PullResponse,
        };
      },
    } as unknown as ApiClient;
    const out = await pullAll({ db, appConfig, client, token: 't' });
    assert.equal(out.error, null);
    assert.deepEqual(calls, ['stale-token', undefined]);
    assert.equal(await appConfig.get(SYNC_CONFIG_KEYS.bootstrapNext), null);
    assert.equal(await stockOf(db, P1!), 3, 'full history, no baseline');
  });
});
