import postgres from 'postgres';

import { superDatabaseUrl } from './db-url';

/**
 * The seeded tenant is shared, so writing to it is a scheduled privilege.
 *
 * `fullyParallel` runs three viewport projects against one Postgres, and most
 * of the portal's interesting specs read Taquería Don Pedro's seeded rows. A
 * spec that *writes* those rows while the others read them is a coin flip: four
 * consecutive full runs failed in four different files, each of which passed
 * alone. `test.skip(project !== 'desktop')` never fixed that — it stops the
 * three viewports of ONE file from colliding and does nothing about two files
 * racing inside the same project.
 *
 * So the rule is a schedule, not a docblock: **a test that writes to the seeded
 * tenant carries the `@serial` tag**, which routes it out of the viewport
 * projects and into the `serial` project (`workers: 1`), after they finish.
 *
 * This module is what makes the rule enforceable. While the viewport projects
 * run, every table that carries a `business_id` holds a trigger that raises on
 * any write to the seeded tenant — so an untagged test that writes to it fails
 * with an error naming the table instead of quietly poisoning a sibling four
 * files away. The `unlock` project releases the lock once the viewport phase is
 * over; `serial`, `operador` and `sync` all run behind it.
 *
 * Nothing here is a migration. The triggers are test-only DDL, installed on the
 * throwaway database by the global setup and dropped again by the teardown —
 * and the lock expires after 30 minutes, so a killed run cannot leave the
 * database refusing writes to the demo tenant.
 */
export const SHARED_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

/** The tag that moves a test into the serial project. */
export const SERIAL_TAG = '@serial';

/** The seeded business's name, for the tests that rename it to prove a write. */
export const SHARED_BIZ_NOMBRE = 'Taquería Don Pedro';

/**
 * Tables that carry a `business_id` and still move under a read.
 *
 * Guarding these would fail honest specs: a sign-in writes a session row, the
 * metering cron writes counters, and the sync plumbing only ever moves because
 * a guarded table did. None of them is data a spec asserts.
 */
const NOT_TENANT_DATA = [
  // Opening /asesor materialises its insights into `notices` on every render
  // (ADR-088), so reading that page writes here — for every tenant, in every
  // project. The specs that write avisos on purpose still carry the tag.
  'public.notices',
  'xangarro.portal_sessions',
  'public.usage_counters',
  'public.usage_notices',
  'public.sync_log',
  'public.sync_cursors',
  'public.sync_receipts',
  'public.sync_rejections',
];

async function asOwner<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(superDatabaseUrl(), { max: 1, onnotice: () => undefined });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** The message a violating write fails with — the whole point of the guard. */
const VIOLATION = [
  `e2e: % on % wrote to the shared seeded tenant while the viewport projects were running.`,
  `A test that writes Taquería Don Pedro rows must carry the @serial tag, which runs it in the`,
  `serial project after they finish. See apps/web/e2e/shared-tenant.ts.`,
].join(' ');

const GUARD_FUNCTION = `
  CREATE SCHEMA IF NOT EXISTS e2e;
  CREATE TABLE IF NOT EXISTS e2e.shared_tenant_lock (
    only_row boolean PRIMARY KEY DEFAULT true CHECK (only_row),
    locked boolean NOT NULL,
    phase text NOT NULL,
    at timestamptz NOT NULL DEFAULT now()
  );
  INSERT INTO e2e.shared_tenant_lock (locked, phase) VALUES (false, 'installed')
    ON CONFLICT (only_row) DO NOTHING;
  -- SECURITY DEFINER so the app role can fire it without a grant on the lock.
  CREATE OR REPLACE FUNCTION e2e.shared_tenant_guard() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = e2e, pg_temp AS $fn$
  DECLARE
    biz text;
  BEGIN
    IF TG_OP = 'DELETE' THEN biz := OLD.business_id; ELSE biz := NEW.business_id; END IF;
    -- The staleness window is a safety valve: a run killed between the lock and
    -- the unlock must not leave this database refusing every write to the demo
    -- tenant an hour later, when someone points pnpm dev at it.
    IF biz = TG_ARGV[0]
       AND (SELECT locked AND at > now() - interval '30 minutes' FROM e2e.shared_tenant_lock)
    THEN
      RAISE EXCEPTION '${VIOLATION}', TG_OP, TG_TABLE_NAME;
    END IF;
    RETURN NULL;
  END $fn$;`;

/**
 * `DO` takes no parameters, so the two constants above are inlined into the
 * statement — both are literals in this file, never anything a test supplies.
 */
const ATTACH = `
  DO $do$
  DECLARE
    t record;
  BEGIN
    FOR t IN
      SELECT c.table_schema AS s, c.table_name AS n
      FROM information_schema.columns c
      JOIN information_schema.tables x
        ON x.table_schema = c.table_schema AND x.table_name = c.table_name
       AND x.table_type = 'BASE TABLE'
      WHERE c.column_name = 'business_id'
        AND c.table_schema || '.' || c.table_name <> ALL (ARRAY[${NOT_TENANT_DATA.map(
          (t) => `'${t}'`,
        ).join(', ')}])
    LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS e2e_shared_tenant_guard ON %I.%I', t.s, t.n);
      EXECUTE format(
        'CREATE TRIGGER e2e_shared_tenant_guard AFTER INSERT OR UPDATE OR DELETE ON %I.%I '
        || 'FOR EACH ROW EXECUTE FUNCTION e2e.shared_tenant_guard(%L)', t.s, t.n, '${SHARED_BIZ}');
    END LOOP;
  END $do$;`;

/** Installs the trigger on every tenant table, unlocked. Idempotent. */
export async function installSharedTenantGuard(): Promise<void> {
  await asOwner(async (sql) => {
    await sql.unsafe(GUARD_FUNCTION);
    await sql.unsafe(ATTACH);
  });
}

/** Removes it, so a plain `pnpm dev` against this database is unencumbered. */
export async function removeSharedTenantGuard(): Promise<void> {
  await asOwner(async (sql) => {
    const rows = await sql<{ table: string }[]>`
      SELECT n.nspname || '.' || c.relname AS "table"
      FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE t.tgname = 'e2e_shared_tenant_guard'`;
    for (const { table } of rows) {
      await sql.unsafe(`DROP TRIGGER IF EXISTS e2e_shared_tenant_guard ON ${table}`);
    }
  });
}

async function setLock(locked: boolean, phase: string): Promise<void> {
  await asOwner(
    (sql) => sql`
      UPDATE e2e.shared_tenant_lock
      SET locked = ${locked}, phase = ${phase}, at = now()`,
  );
}

/** Closes the seeded tenant to writes: the viewport projects are about to run. */
export async function lockSharedTenant(): Promise<void> {
  await setLock(true, 'viewport projects');
}

/** Opens it again, for the serial projects that own it one at a time. */
export async function unlockSharedTenant(phase: string): Promise<void> {
  await setLock(false, phase);
}

/**
 * Puts the seeded business's name back.
 *
 * Two tests rename it to prove a write landed — «Negocio B 1764…» — and one of
 * them used to leave it that way, which is how a spec that reads the name ended
 * up at the mercy of scheduling. Whoever renames it restores it, in a hook that
 * also runs when the test fails.
 */
export async function restoreSharedBusinessName(): Promise<void> {
  await asOwner(
    (sql) => sql`
      UPDATE businesses SET nombre = ${SHARED_BIZ_NOMBRE}, updated_at = now()
      WHERE id = ${SHARED_BIZ}`,
  );
}
