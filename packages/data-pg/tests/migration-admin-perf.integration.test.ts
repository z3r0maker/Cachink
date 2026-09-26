import assert from 'node:assert/strict';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { integrationSuite } from './support/db';
import {
  ADMIN_DIR,
  applyFile,
  createScratchDb,
  migrateUpTo,
  type ScratchDb,
} from './support/scratch-db';

/**
 * Old → new for the console's DB2-CRON-01 migrations (admin 0020–0022;
 * ADR-109), on a throwaway database carrying every data-pg file and the
 * console's files up to 0019 — the order hosted applies them in. Each check
 * runs as `xangarro_admin`, the role the console connects as.
 */
const { describe } = integrationSuite();
const USER = '3f1c0e2a-0000-4000-8000-00000000c001';
const OLD = '01HZADMINPERF0000000000OLD';
const NEW_ = '01HZADMINPERF0000000000NEW';

describe('console migrations 0020–0022, old → new', () => {
  let db: ScratchDb;
  let sql: postgres.Sql;
  let admin: postgres.Sql;

  beforeAll(async () => {
    db = await createScratchDb(process.env.DATABASE_SUPER_URL as string);
    sql = db.sql;
    await migrateUpTo(sql, '9999', '0020');
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${USER}::uuid, 'duena@test.mx', 'x')`;
    const u = new URL(db.url);
    u.username = 'xangarro_admin';
    u.password = 'xangarro_admin';
    admin = postgres(u.toString(), { max: 1, onnotice: () => undefined });
  }, 120_000);

  afterAll(async () => {
    await admin?.end({ timeout: 5 });
    await db?.drop();
  });

  const email = async (id: string | null) =>
    (await admin<{ e: string | null }[]>`SELECT xangarro.admin_user_email(${id}) AS e`)[0]?.e;

  it('0020: the same answers as 0010, found by primary key', async () => {
    const before = [await email(USER), await email('not-a-uuid'), await email(null)];
    assert.deepEqual(before, ['duena@test.mx', null, null]);
    await applyFile(sql, join(ADMIN_DIR, '0020_admin_user_email_uuid.sql'));
    assert.equal(await email(USER), 'duena@test.mx');
    assert.equal(await email(USER.toUpperCase()), 'duena@test.mx', 'uuid text is case-free');
    // 0010 answered NULL for anything that is not a uuid; a bare cast would
    // raise instead and blank the tenants list.
    assert.equal(await email('not-a-uuid'), null);
    assert.equal(await email(`${USER}' OR true --`), null);
    assert.equal(await email(null), null);
    const [fn] = await sql<{ src: string }[]>`
      SELECT prosrc AS src FROM pg_proc WHERE proname = 'admin_user_email'`;
    assert.doesNotMatch(fn?.src ?? '', /u\.id::text/, 'the column is never cast');
  });

  it('0021: the console can run security_prune, which keeps what is still live', async () => {
    await assert.rejects(() => admin`SELECT * FROM xangarro.security_prune()`, /permission denied/);
    await applyFile(sql, join(ADMIN_DIR, '0021_admin_security_prune.sql'));
    const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
    await sql`INSERT INTO xangarro.portal_sessions (token_hash, user_id, business_id, created_at, last_seen_at, expires_at, revoked_at)
              VALUES ('h-expired', ${USER}::uuid, 'b', ${ago(40)}, ${ago(40)}, ${ago(10)}, NULL),
                     ('h-revoked', ${USER}::uuid, 'b', ${ago(5)}, ${ago(5)}, ${ago(-5)}, ${ago(3)}),
                     ('h-live', ${USER}::uuid, 'b', ${ago(1)}, ${ago(0)}, ${ago(-7)}, NULL)`;
    await sql`INSERT INTO xangarro.throttle (key, window_start, hits, locked_until)
              VALUES ('k-stale', ${ago(3)}, 2, NULL), ('k-locked', ${ago(3)}, 0, ${ago(-1)})`;
    const [r] = await admin<{ throttle_rows: number; session_rows: number }[]>`
      SELECT * FROM xangarro.security_prune()`;
    assert.deepEqual({ ...r }, { throttle_rows: 1, session_rows: 2 });
    const left = await sql<{ k: string }[]>`
      SELECT token_hash AS k FROM xangarro.portal_sessions
      UNION ALL SELECT key FROM xangarro.throttle ORDER BY 1`;
    assert.deepEqual(
      left.map((x) => x.k),
      ['h-live', 'k-locked'],
    );
    await assert.rejects(() => admin`DELETE FROM xangarro.portal_sessions`, /permission denied/);
  });

  it('0022: the stored page matches the recount page, and reads zero where nothing is stored', async () => {
    const T = '2026-01-15T12:00:00.000Z';
    for (const [id, at] of [
      [OLD, '2025-01-01T00:00:00Z'],
      [NEW_, '2025-06-01T00:00:00Z'],
    ] as const) {
      await sql`INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
                VALUES (${id}, ${id.slice(-3)}, 'RESICO', 125, ${id}, 'dev', ${at}, ${at})`;
    }
    await sql`INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos, producto_id, cantidad, business_id, device_id, created_at, updated_at)
              VALUES ('s-1', 't-1', '2026-01-15', 'x', 'Producto', 100, 'p', 1, ${NEW_}, 'dev', ${T}, ${T}),
                     ('s-2', 't-2', '2026-01-15', 'x', 'Producto', 100, 'p', 1, ${NEW_}, 'dev', ${T}, ${T})`;
    await sql`INSERT INTO usage_counters (business_id, period, transactions, products)
              SELECT u.business_id, u.period, u.transactions, u.active_products
                FROM xangarro.usage_counts(ARRAY[${NEW_}, ${OLD}]::text[], '2025-11', '2026-01') u
               WHERE u.period <> '2025-11'`;
    await assert.rejects(
      () => admin`SELECT * FROM public.admin_tenant_usage_stored('2026-01', NULL, NULL, 10)`,
      /does not exist/,
    );
    await applyFile(sql, join(ADMIN_DIR, '0022_admin_usage_stored.sql'));
    const page = (fn: string) =>
      admin.unsafe(`SELECT business_id, period, transactions, active_products
                      FROM public.${fn}('2026-01', NULL, NULL, 10)
                     WHERE business_id IN ('${OLD}', '${NEW_}')`);
    const live = await page('admin_tenant_usage');
    const stored = await page('admin_tenant_usage_stored');
    assert.equal(stored.length, 6, 'two tenants × three months, newest tenant first');
    assert.deepEqual(
      stored.map((r) => `${r['business_id']}:${r['period']}:${r['transactions']}`),
      live.map((r) => `${r['business_id']}:${r['period']}:${r['transactions']}`),
    );
    assert.equal(stored[0]?.['transactions'], 2);
    await assert.rejects(
      () => admin`UPDATE usage_counters SET transactions = 0`,
      /permission denied/,
    );
  });
});
