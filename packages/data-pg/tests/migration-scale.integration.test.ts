import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { applyMigration, ensureLedger, readApplied } from '../scripts/hosted/ledger';
import { listMigrations, type MigrationFile } from '../scripts/hosted/plan';
import { integrationSuite } from './support/db';
import {
  applyFile,
  createScratchDb,
  DATA_PG_DIR,
  migrateUpTo,
  type ScratchDb,
} from './support/scratch-db';

/**
 * Old → new for the scale audit's migrations (CLAUDE.md §2.9; DB2-MIG-01,
 * DB2-IDX-01, DB2-HOT-01, DB2-RLS-01; ADR-119), on a throwaway database
 * migrated through 0044 and filled with rows in the old shape. 0045 and 0047 run
 * through the hosted runner itself (`applyMigration`), because they are its
 * first no-transaction files: that is the path production takes.
 */
const { url, describe } = integrationSuite();
const REPO = resolve(import.meta.dirname, '../../..');
const A = '01HZSCALE0000000000000AAAA';
const B = '01HZSCALE0000000000000BBBB';
const T = '2026-09-20T12:00:00.000Z';
const USER = '3f1c0e2a-0000-4000-8000-00000000a001';

const fileNamed = (name: string): MigrationFile => {
  const f = listMigrations(REPO).find((m) => m.name === `data-pg/${name}`);
  assert.ok(f, name);
  return f;
};

async function seedOldRows(sql: postgres.Sql): Promise<void> {
  for (const biz of [A, B]) {
    await sql`INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
              VALUES (${biz}, ${`Negocio ${biz.slice(-4)}`}, 'RESICO', 125, ${biz}, 'dev', ${T}, ${T})`;
    await sql`INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago, business_id, device_id, created_at, updated_at)
              VALUES (${`t-${biz}`}, 1, '2026-09-20', 'Venta', 'Efectivo', 'pagado', ${biz}, ${`dev-${biz}`}, ${T}, ${T})`;
    await sql`INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos, producto_id, cantidad, business_id, device_id, created_at, updated_at)
              VALUES (${`s-${biz}`}, ${`t-${biz}`}, '2026-09-20', 'Taco', 'Producto', 2500, 'p1', 1, ${biz}, 'dev', ${T}, ${T})`;
    await sql`INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id, device_id, created_at, updated_at)
              VALUES (${`e-${biz}`}, '2026-09-20', 'Renta', 'Renta', 100000, ${biz}, 'dev', ${T}, ${T})`;
    await sql`INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
              VALUES (${`m-${biz}`}, 'p1', '2026-09-20', 'salida', 1, 900, 'Venta', ${biz}, 'dev', ${T}, ${T})`;
  }
  await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${USER}::uuid, 'scale@test.mx', 'x')`;
  await sql`INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
            VALUES ('bm-1', ${USER}, 'owner', ${A}, ${T}, ${T})`;
  // Old-shape latency rows: no slot yet. 90 fast calls and 10 slow ones today.
  await sql`INSERT INTO xangarro.api_latency_counters (day, endpoint, bucket_ms, hits)
            VALUES ((now() AT TIME ZONE 'America/Mexico_City')::date, 'sync/push', 50, 90),
                   ((now() AT TIME ZONE 'America/Mexico_City')::date, 'sync/pull', 700, 10)`;
}

const indexState = async (sql: postgres.Sql, names: readonly string[]) =>
  (
    await sql<{ name: string; valid: boolean }[]>`
    SELECT c.relname AS name, i.indisvalid AS valid
      FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relname = ANY(${names as string[]}) AND n.nspname IN ('public', 'xangarro')
     ORDER BY 1`
  ).map((r) => ({ name: r.name, valid: r.valid }));

const indexDef = async (sql: postgres.Sql, name: string) =>
  (
    await sql<{ def: string }[]>`SELECT indexdef AS def FROM pg_indexes WHERE indexname = ${name}`
  )[0]?.def ?? '';

/** The per-table storage options 0045 sets (DB3-OPS-01), as `pg_class` has them. */
const reloptions = async (sql: postgres.Sql) =>
  Object.fromEntries(
    (
      await sql<{ t: string; o: string[] | null }[]>`
      SELECT n.nspname || '.' || c.relname AS t, c.reloptions AS o
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE (n.nspname, c.relname) IN (
         ('public', 'devices'), ('public', 'sync_cursors'), ('xangarro', 'throttle'),
         ('xangarro', 'api_latency_counters'), ('xangarro', 'portal_sessions'),
         ('public', 'sales'), ('public', 'tickets'), ('public', 'expenses'),
         ('public', 'inventory_movements'), ('public', 'sync_log'), ('public', 'sync_receipts'))
       ORDER BY 1`
    ).map((r) => [r.t, [...(r.o ?? [])].sort()]),
  );

const unwrapped = async (sql: postgres.Sql) =>
  (
    await sql<{ policy: string }[]>`
    SELECT tablename || '.' || policyname AS policy FROM pg_policies
     WHERE regexp_replace(coalesce(qual, '') || ' ' || coalesce(with_check, ''),
             '\\(\\s*SELECT xangarro\\.current_business_id\\(\\) AS current_business_id\\)', '', 'g')
           ~ 'current_business_id\\(\\)'
     ORDER BY 1`
  ).map((r) => r.policy);

const NEW = [
  'sales_business_created_idx',
  'expenses_business_created_idx',
  'inventory_movements_business_created_idx',
  'inventory_movements_business_producto_idx',
  'sales_business_fecha_id_live_idx',
  'expenses_business_fecha_id_live_idx',
  'tickets_business_turno_idx',
  'expenses_business_turno_idx',
  'tickets_business_cliente_idx',
  'sales_business_producto_idx',
  'tickets_business_cancelled_idx',
  'sync_receipts_business_received_idx',
  'business_members_user_idx',
  'business_members_business_user_uq',
  'portal_sessions_business_idx',
  'usage_counters_period_idx',
];
const REDUNDANT = [
  'sync_receipts_business_idx',
  'sync_cursors_business_idx',
  'billing_customers_business_idx',
  'business_logos_business_idx',
  'business_onboarding_business_idx',
  'notice_preferences_business_idx',
  'usage_counters_business_idx',
  // Round 3 (DB3-IDX-01): prefixes of the new indexes.
  'business_members_business_idx',
  'sales_business_idx',
  'expenses_business_idx',
];

describe('scale migrations 0045–0047, old → new', () => {
  let db: ScratchDb;
  let sql: postgres.Sql;

  beforeAll(async () => {
    db = await createScratchDb(process.env.DATABASE_SUPER_URL as string);
    sql = db.sql;
    await migrateUpTo(sql, '0045');
    await seedOldRows(sql);
    await ensureLedger(sql);
  }, 120_000);

  afterAll(async () => {
    await db?.drop();
  });

  it('before 0045 the redundant indexes exist and no table has storage options', async () => {
    assert.equal((await indexState(sql, REDUNDANT)).length, REDUNDANT.length);
    const opts = await reloptions(sql);
    assert.equal(Object.keys(opts).length, 11);
    assert.ok(Object.values(opts).every((o) => o.length === 0));
  });

  it('0045 refuses duplicate memberships before building anything', async () => {
    await sql`INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
              VALUES ('bm-dup', ${USER}, 'viewer', ${A}, ${T}, ${T})`;
    await assert.rejects(
      () => applyMigration(sql, fileNamed('0045_scale_indexes.sql')),
      /duplicate/,
    );
    assert.deepEqual(await indexState(sql, NEW), [], 'nothing was built');
    assert.equal((await readApplied(sql)).length, 0, 'no ledger row');
  });

  it('0045 sweeps the INVALID index an interrupted build left, and rebuilds it', async () => {
    // What a lock_timeout half-way through a unique build leaves behind.
    await assert.rejects(
      () => sql`CREATE UNIQUE INDEX CONCURRENTLY business_members_business_user_uq
                  ON public.business_members (business_id, user_id)`,
    );
    assert.deepEqual(await indexState(sql, ['business_members_business_user_uq']), [
      { name: 'business_members_business_user_uq', valid: false },
    ]);
    // The same name, INVALID, in another schema: the sweep must leave it be (R2-12).
    await sql`CREATE SCHEMA scale_other`;
    await sql`CREATE TABLE scale_other.bm (business_id text, user_id text)`;
    await sql`INSERT INTO scale_other.bm VALUES ('a', 'u'), ('a', 'u')`;
    await assert.rejects(
      () => sql`CREATE UNIQUE INDEX CONCURRENTLY business_members_business_user_uq
                  ON scale_other.bm (business_id, user_id)`,
    );
    await sql`DELETE FROM business_members WHERE id = 'bm-dup'`;
    await applyMigration(sql, fileNamed('0045_scale_indexes.sql'));
    const [other] = await sql<{ valid: boolean }[]>`
      SELECT i.indisvalid AS valid FROM pg_index i
       WHERE i.indexrelid = 'scale_other.business_members_business_user_uq'::regclass`;
    assert.equal(other?.valid, false, 'another schema’s index is not the sweep’s business');
    await sql`DROP SCHEMA scale_other CASCADE`;
    const built = await indexState(sql, NEW);
    assert.deepEqual(
      built.map((r) => r.name),
      [...NEW].sort(),
    );
    assert.ok(
      built.every((r) => r.valid),
      'every new index is valid',
    );
    assert.deepEqual(
      await indexState(sql, REDUNDANT),
      [],
      'the duplicates of primary keys are gone',
    );
    assert.deepEqual(
      (await readApplied(sql)).map((r) => r.name),
      ['data-pg/0045_scale_indexes.sql'],
    );
  });

  it('0045 builds the round-3 shapes: INCLUDE, partial, business_id alone (DB3-IDX-01)', async () => {
    assert.match(await indexDef(sql, 'sales_business_created_idx'), /INCLUDE \(ticket_id\)/);
    assert.match(
      await indexDef(sql, 'inventory_movements_business_created_idx'),
      /INCLUDE \(origen\)/,
    );
    assert.match(
      await indexDef(sql, 'tickets_business_cliente_idx'),
      /WHERE \(cliente_id IS NOT NULL\)/,
    );
    assert.match(
      await indexDef(sql, 'tickets_business_cancelled_idx'),
      /\(business_id, id\) WHERE \(cancelled_at IS NOT NULL\)/,
    );
    assert.match(
      await indexDef(sql, 'portal_sessions_business_idx'),
      /xangarro\.portal_sessions USING btree \(business_id\)$/,
      'last_seen_at is not indexed, so the session touch stays HOT',
    );
  });

  it('0045 sets fillfactor on the hot-update rows and faster autovacuum on the append tables (DB3-OPS-01)', async () => {
    const hot = ['fillfactor=80'];
    const append = [
      'autovacuum_analyze_scale_factor=0.02',
      'autovacuum_vacuum_insert_scale_factor=0.02',
    ];
    assert.deepEqual(await reloptions(sql), {
      'public.devices': hot,
      'public.expenses': append,
      'public.inventory_movements': append,
      'public.sales': append,
      'public.sync_cursors': hot,
      'public.sync_log': append,
      'public.sync_receipts': append,
      'public.tickets': append,
      'xangarro.api_latency_counters': hot,
      'xangarro.portal_sessions': hot,
      'xangarro.throttle': hot,
    });
  });

  it('a month of live sales or expenses is still an index range after the (business_id, fecha) drop', async () => {
    // Two years of one tenant's history among 20 tenants, so the planner has
    // real statistics to choose from; removed again below.
    for (const table of ['sales', 'expenses'] as const) {
      const extra = table === 'sales' ? sql`, ticket_id, producto_id` : sql``;
      const extraVals = table === 'sales' ? sql`, 't-x', 'p' || (g % 40)` : sql``;
      const cat = table === 'sales' ? 'Producto' : 'Renta';
      await sql`
        INSERT INTO ${sql(table)} (id, fecha, concepto, categoria, monto_centavos, business_id, device_id, created_at, updated_at ${extra})
        SELECT 'x-' || g, to_char(date '2025-01-01' + (g % 730), 'YYYY-MM-DD'), 'x', ${cat}, 100,
               CASE WHEN g % 20 = 0 THEN ${A} ELSE 'biz-' || (g % 20) END, 'dev', now(), now() ${extraVals}
          FROM generate_series(1, 60000) g`;
      await sql`ANALYZE ${sql(table)}`;
    }
    try {
      for (const table of ['sales', 'expenses'] as const) {
        const plan = (
          await sql<{ 'QUERY PLAN': string }[]>`
          EXPLAIN SELECT sum(monto_centavos) FROM ${sql(table)}
           WHERE business_id = ${A} AND deleted_at IS NULL
             AND fecha >= '2026-09-01' AND fecha < '2026-10-01'`
        )
          .map((r) => r['QUERY PLAN'])
          .join('\n');
        assert.match(plan, new RegExp(`${table}_business_fecha_id_live_idx`), plan);
        assert.match(plan, /Index Cond: .*fecha >= /, plan);
      }
    } finally {
      await sql`DELETE FROM sales WHERE id LIKE 'x-%'`;
      await sql`DELETE FROM expenses WHERE id LIKE 'x-%'`;
    }
  });

  it('0045 keeps every row, enforces one membership per person, and repeats as a no-op', async () => {
    const [n] = await sql<{ s: number; e: number; m: number; t: number }[]>`
      SELECT (SELECT count(*) FROM sales)::int AS s, (SELECT count(*) FROM expenses)::int AS e,
             (SELECT count(*) FROM inventory_movements)::int AS m, (SELECT count(*) FROM tickets)::int AS t`;
    assert.deepEqual(n, { s: 2, e: 2, m: 2, t: 2 });
    await assert.rejects(
      () => sql`INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
                VALUES ('bm-dup2', ${USER}, 'viewer', ${A}, ${T}, ${T})`,
      /business_members_business_user_uq/,
    );
    // `psql -f` (db-local.sh, CI) re-applies the file the same way.
    await applyFile(sql, join(DATA_PG_DIR, '0045_scale_indexes.sql'));
    assert.equal((await indexState(sql, NEW)).length, NEW.length);
  });

  it('0046 keeps the old counts in slot 0, and the p95 reads them unchanged', async () => {
    const p95 = async () =>
      (await sql<{ ms: number | null }[]>`SELECT xangarro.admin_sync_p95(1) AS ms`)[0]?.ms;
    assert.equal(await p95(), 700, 'before: 90 at ≤50 ms, 10 at ≤700 ms');
    const timeout = async () =>
      (await sql<{ v: string }[]>`SELECT current_setting('lock_timeout') AS v`)[0]?.v;
    const before = await timeout();
    assert.equal(typeof before, 'string');
    await applyMigration(sql, fileNamed('0046_api_latency_slots.sql'));
    assert.equal(await timeout(), before, 'SET LOCAL: nothing leaks onto the session (R2-13)');
    const rows = await sql<{ slot: number; hits: number }[]>`
      SELECT slot, hits FROM xangarro.api_latency_counters ORDER BY bucket_ms`;
    assert.deepEqual(
      [...rows],
      [
        { slot: 0, hits: 90 },
        { slot: 0, hits: 10 },
      ],
    );
    assert.equal(await p95(), 700, 'after: the same answer from the same rows');
    await sql`SELECT xangarro.api_latency_record('sync/push', 40) FROM generate_series(1, 200)`;
    const [sum] = await sql<{ hits: number; rows: number }[]>`
      SELECT sum(hits)::int AS hits, count(*)::int AS rows FROM xangarro.api_latency_counters
       WHERE endpoint = 'sync/push' AND bucket_ms = 50`;
    assert.equal(sum?.hits, 290, 'no call lost across the slots');
    assert.ok((sum?.rows ?? 0) > 1 && (sum?.rows ?? 0) <= 16, `${sum?.rows} rows`);
    await assert.rejects(
      () => sql`INSERT INTO xangarro.api_latency_counters (day, endpoint, bucket_ms, slot, hits)
                VALUES (current_date, 'sync/push', 50, 16, 1)`,
      /api_latency_slot_range/,
    );
  });

  it('0047 wraps all 29 bare policies, and tenant isolation still binds', async () => {
    assert.equal((await unwrapped(sql)).length, 29, 'the audit counted 29');
    await applyMigration(sql, fileNamed('0047_rls_wrapped.sql'));
    assert.deepEqual(await unwrapped(sql), []);
    const u = new URL(db.url);
    u.username = 'xangarro_app';
    u.password = 'xangarro_app';
    const app = postgres(u.toString(), { max: 1, onnotice: () => undefined });
    try {
      await app`SELECT set_config('xangarro.business_id', ${A}, false)`;
      const seen = await app<{ id: string }[]>`SELECT id FROM sales ORDER BY id`;
      assert.deepEqual(
        seen.map((r) => r.id),
        [`s-${A}`],
      );
      await assert.rejects(
        () => app`INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id, device_id, created_at, updated_at)
                  VALUES ('e-x', '2026-09-20', 'Otro', 'Otro', 1, ${B}, 'dev', ${T}, ${T})`,
        /row-level security/,
      );
    } finally {
      await app.end({ timeout: 5 });
    }
  });
});

describe('the migrated test database (every file, as db-local applies them)', () => {
  it('has no tenant policy left calling current_business_id() bare', async () => {
    const sql = postgres(process.env.DATABASE_SUPER_URL ?? (url as string), {
      max: 1,
      onnotice: () => undefined,
    });
    try {
      assert.deepEqual(await unwrapped(sql), []);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
