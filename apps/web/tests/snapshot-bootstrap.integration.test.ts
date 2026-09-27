import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import { ApplyPushUseCase } from '@xangarro/application';
import {
  MAX_SNAPSHOT_PAGE_BYTES,
  encodeJson,
  encodeSnapshotToken,
  type PullQuery,
  type PullResponse,
  type StockBaselineRow,
} from '@xangarro/contracts';
import { DEV_KEYS } from '@xangarro/contracts/mock';
import { createDb, withBusiness, type Db } from '@xangarro/data-pg';
import { integrationSuite } from '@xangarro/testing/integration';

import { mintActivationCode } from '../src/lib/activation-code';
import { activate, Refusal } from '../src/server/device/activate';
import { referenceTables } from '../src/server/device/bootstrap';
import { PgPushStore } from '../src/server/sync/pg-push-store';
import { pull, type PullRefusal } from '../src/server/sync/pull';
import { pushFixtures } from './support/push-fixtures';

/**
 * The snapshot bootstrap on real Postgres under RLS (C-23, ADR-119; audit
 * DB3-BOOT-01): a tenant with 30,000 live movements links a device in pages
 * that each stay under 2 MB, and the stock a device sums from them — baseline
 * plus rows — equals the sum of every movement, including ones pushed while
 * the snapshot was being paged.
 */
const { url, describe: suite } = integrationSuite();

/** A valid ULID (`pushId()` carries a U, which the domain's ULIDs exclude). */
const ulid = () => `01SN${randomUUID().replaceAll('-', '').slice(0, 22).toUpperCase()}`;
const A = ulid();
const DEVICE = ulid();
const TAG = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();
// Overridable to measure a whale (`SNAPSHOT_MOVEMENTS=375000 SNAPSHOT_SPREAD_DAYS=365`).
const MOVEMENTS = Number(process.env.SNAPSHOT_MOVEMENTS ?? 30_000);
const SPREAD_DAYS = Number(process.env.SNAPSHOT_SPREAD_DAYS ?? 180);
const PRODUCTS = 40;
const EMAIL = `snapshot-${TAG.toLowerCase()}@xangarro.mx`;
const TOUCHED = [
  'inventory_movements',
  'products',
  'sync_log',
  'sync_receipts',
  'sync_cursors',
  'devices',
  'activation_codes',
  'businesses',
];

type Movement = { id: string; productoId: string; tipo: string; cantidad: number };
const signed = (m: Movement) => (m.tipo === 'entrada' ? m.cantidad : -m.cantidad);

suite('snapshot bootstrap on Postgres', () => {
  let db: Db;
  let owner: postgres.Sql;
  const productIds = Array.from({ length: PRODUCTS }, () => ulid());
  const caller = { businessId: A, deviceId: DEVICE } as Parameters<typeof pull>[0];

  const pullPage = async (query: Partial<PullQuery>): Promise<PullResponse> => {
    const r = await pull(caller, { since: 0, ...query });
    if ('refused' in r) throw new Error(JSON.stringify(r));
    return r;
  };

  /** What the device sums: every stock baseline row plus every movement row, once per id. */
  function deviceStock(pages: readonly PullResponse[]): Map<string, number> {
    const stock = new Map<string, number>();
    const add = (p: string, n: number) => stock.set(p, (stock.get(p) ?? 0) + n);
    const baseline: StockBaselineRow[] = pages.flatMap((p) => p.snapshot?.stockBaseline ?? []);
    for (const b of baseline) add(b.productoId, b.cantidad);
    const rows = new Map<string, Movement>();
    for (const p of pages)
      for (const m of p.tables.inventory_movements as unknown as Movement[]) rows.set(m.id, m);
    for (const m of rows.values()) add(m.productoId, signed(m));
    return stock;
  }

  async function ledgerStock(): Promise<Map<string, number>> {
    const rows = await owner<{ producto_id: string; n: string }[]>`
      SELECT producto_id, SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -cantidad END)::text AS n
        FROM inventory_movements WHERE business_id = ${A} AND deleted_at IS NULL GROUP BY producto_id`;
    return new Map(rows.map((r) => [r.producto_id, Number(r.n)]));
  }

  /** Movements `from`..`to`, `daysBack` spread, logged at consecutive seqs past the cursor. */
  async function insertMovements(from: number, to: number, daysBack: (g: string) => string) {
    await owner.unsafe(
      `
      WITH m AS (
        INSERT INTO inventory_movements (id, business_id, producto_id, fecha, tipo, cantidad,
          costo_unit_centavos, motivo, nota, origen, device_id, created_by_user_id,
          created_at, updated_at, deleted_at)
        SELECT '01SNP${TAG}' || upper(lpad(to_hex(g), 16, '0')), '${A}',
               ($1::text[])[1 + g % ${PRODUCTS}],
               to_char(now() - (${daysBack('g')}) * interval '1 day', 'YYYY-MM-DD'),
               CASE WHEN g % 4 = 0 THEN 'salida' ELSE 'entrada' END, 1 + g % 7, 1500,
               CASE WHEN g % 4 = 0 THEN 'Merma / daño' ELSE 'Compra a proveedor' END,
               'nota de prueba para que la fila pese lo que pesa en producción', 'manual',
               '${DEVICE}', NULL,
               now() - (${daysBack('g')}) * interval '1 day', now(), NULL
          FROM generate_series(${from}, ${to}) AS g
        RETURNING id),
      c AS (
        INSERT INTO sync_cursors (business_id, last_seq) VALUES ('${A}', ${to - from + 1})
        ON CONFLICT (business_id) DO UPDATE SET last_seq = sync_cursors.last_seq + ${to - from + 1}
        RETURNING last_seq)
      INSERT INTO sync_log (business_id, seq, table_name, row_id, op, created_at, updated_at)
      SELECT '${A}', (SELECT last_seq FROM c) - ${to - from + 1} + row_number() OVER (ORDER BY id),
             'inventory_movements', id, 'insert', now(), now() FROM m`,
      [productIds],
    );
  }

  beforeAll(async () => {
    process.env.ENTITLEMENT_PRIVATE_KEY ??= DEV_KEYS.privateHex;
    process.env.DEVICE_TOKEN_SECRET ??= 'snapshot-integration-only';
    db = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, { max: 1, onnotice: () => {} });
    // A business like the seeded conformance one, under a fresh id.
    await owner`
      INSERT INTO businesses SELECT (jsonb_populate_record(NULL::businesses,
        to_jsonb(b) || jsonb_build_object('id', ${A}::text, 'business_id', ${A}::text))).*
      FROM businesses b WHERE b.id = '01HZ8XQN9GZJXV8AKQ5X0CNF01'`;
    const { product } = pushFixtures(A, DEVICE);
    await withBusiness(db, A, (tx) =>
      new ApplyPushUseCase(new PgPushStore(tx, A, DEVICE), A, () => undefined).execute({
        deltas: productIds.map((p) => product(p)),
      }),
    );
    // 30,000 movements over half a year; roughly half inside the 90-day window.
    await insertMovements(1, MOVEMENTS, (g) => `(${g} % ${SPREAD_DAYS}) + (${g} % 1000) / 1000.0`);
  }, 120_000);

  afterAll(async () => {
    for (const table of TOUCHED)
      await owner?.unsafe(`DELETE FROM ${table} WHERE business_id = $1`, [A]);
    await db?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('refuses the legacy all-history bootstrap past 5,000 movements with 426, and says how big it was', async () => {
    const r = (await pull(caller, { since: 0 })) as PullRefusal;
    assert.equal(r.refused.code, 'PROTOCOL_UNSUPPORTED');
    assert.equal(r.refused.status, 426);
    const legacy = await withBusiness(db, A, (tx) => referenceTables(tx));
    const bytes = Buffer.byteLength(encodeJson(legacy));
    console.info(`legacy bootstrap, ${MOVEMENTS} movements: ${(bytes / 1e6).toFixed(1)} MB`);
    assert.ok(bytes > 4_500_000, 'the old body is past the 4.5 MB limit');
  });

  it('pages 30K movements under 2 MB a response, and baseline + rows = every movement', async () => {
    const started = performance.now();
    const pages = [await pullPage({ snapshot: 'start' })];
    const first = pages[0]!;
    // A phone pushes late while the snapshot is paged: one old movement, one new.
    await insertMovements(
      MOVEMENTS + 1,
      MOVEMENTS + 2,
      (g) => `CASE WHEN ${g} % 2 = 0 THEN 200 ELSE 1 END`,
    );
    for (let next = first.snapshot?.next; next; next = pages.at(-1)?.snapshot?.next)
      pages.push(await pullPage({ snapshot: next }));
    // The baseline is the cursor's, not the clock's: read again after the late
    // push, at the same cursor, it leaves the late old movement out.
    const cursor = { c: first.serverSeq, cutoff: first.snapshot!.cutoff, a: null };
    const again = await pullPage({
      snapshot: encodeSnapshotToken({ ...cursor, s: 'stock_baseline' }),
    });
    assert.deepEqual(again.snapshot?.stockBaseline, first.snapshot?.stockBaseline);
    const sizes = pages.map((p) => Buffer.byteLength(encodeJson(p)));
    const largest = Math.max(...sizes);
    console.info(
      `snapshot: ${pages.length} pages, largest ${(largest / 1e6).toFixed(2)} MB, ` +
        `${(sizes.reduce((a, b) => a + b, 0) / 1e6).toFixed(1)} MB in all, ` +
        `${Math.round((performance.now() - started) / pages.length)} ms a page`,
    );
    assert.ok(pages.length >= 3, `${pages.length} pages`);
    for (const b of sizes) assert.ok(b < 2_000_000, `a page of ${b} bytes`);
    assert.ok(MAX_SNAPSHOT_PAGE_BYTES < 2_000_000);
    const seq = pages[0]!.serverSeq;
    assert.ok(pages.every((p) => p.serverSeq === seq));
    // The ordinary pull from the snapshot's cursor brings the late pushes.
    const after = await pullPage({ since: seq });
    assert.equal(after.tables.inventory_movements.length, 2);
    assert.deepEqual(deviceStock([...pages, after]), await ledgerStock());
    const rows = pages.reduce((n, p) => n + p.tables.inventory_movements.length, 0);
    assert.ok(rows < MOVEMENTS * 0.6, `${rows} movement rows, not ${MOVEMENTS}`);
  }, 120_000);

  it('activation refuses an older device without spending the code, and links a new one in pages', async () => {
    const code = mintActivationCode();
    await owner`
      INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
      VALUES (${code}, ${EMAIL}, now() + interval '1 hour', ${A}, now(), now())`;
    const device = {
      name: 'Caja grande',
      platform: 'web',
      appVersion: '1',
      osVersion: 'x',
    } as const;
    const input = { email: EMAIL, code, device };
    await assert.rejects(
      activate(input),
      (e) => e instanceof Refusal && e.code === 'PROTOCOL_UNSUPPORTED',
    );
    const started = performance.now();
    const res = await activate({ ...input, bootstrap: 'snapshot' });
    console.info(`activation with the first page: ${Math.round(performance.now() - started)} ms`);
    assert.ok(Buffer.byteLength(encodeJson(res)) < 2_000_000);
    assert.equal(res.bootstrap.snapshot?.first, true);
    assert.ok(res.bootstrap.snapshot?.next, 'a tenant this size takes more than one page');
    assert.equal(res.bootstrap.tables.businesses[0]?.id, A);
  }, 120_000);
});
