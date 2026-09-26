/**
 * The migration ledger on the hosted database (DB-MIG-01): one row per applied
 * file, with the checksum it had. It lives in its own schema so the
 * `ON ALL TABLES IN SCHEMA public` grants of 0001_rls never reach it.
 */
import type { Sql } from 'postgres';

import { concurrentIndexNames } from './lint';
import type { AppliedMigration, MigrationFile } from './plan';
import { splitStatements } from './statements';

export const LEDGER = 'xangarro_ops.migrations';

export async function ensureLedger(sql: Sql): Promise<void> {
  await sql.unsafe(`
    CREATE SCHEMA IF NOT EXISTS xangarro_ops;
    REVOKE ALL ON SCHEMA xangarro_ops FROM PUBLIC;
    CREATE TABLE IF NOT EXISTS ${LEDGER} (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );`);
}

/** Applied rows; none when the ledger does not exist yet (dry run, first run). */
export async function readApplied(sql: Sql): Promise<AppliedMigration[]> {
  const [reg] = await sql<{ exists: boolean }[]>`
    SELECT to_regclass(${LEDGER}) IS NOT NULL AS exists`;
  if (reg?.exists !== true) return [];
  return sql<AppliedMigration[]>`
    SELECT name, checksum FROM ${sql.unsafe(LEDGER)} ORDER BY applied_at, name`;
}

/**
 * One file, one transaction: its statements and its ledger row commit
 * together or not at all. `lock_timeout` makes a migration that would queue
 * behind live traffic fail fast instead of stalling every request behind it.
 *
 * A `-- xangarro:no-transaction` file (`lint.ts`) runs statement by statement
 * instead, on one reserved connection, and its ledger row is written only
 * after the last statement succeeds.
 */
export async function applyMigration(sql: Sql, file: MigrationFile): Promise<void> {
  if (!file.transactional) {
    await applyOutsideTransaction(sql, file);
    return;
  }
  await sql.begin(async (tx) => {
    await tx.unsafe(`SET LOCAL lock_timeout = '10s'`);
    if (file.body.trim() !== '') await tx.unsafe(file.body);
    await tx`
      INSERT INTO ${tx.unsafe(LEDGER)} (name, checksum) VALUES (${file.name}, ${file.checksum})`;
  });
}

/**
 * Each statement autocommits, as under `psql -f`. A failure leaves the ones
 * before it applied and no ledger row, so the next run repeats the file:
 * `lint.ts` makes every statement repeatable, and the INVALID index a failed
 * `CREATE INDEX CONCURRENTLY` leaves behind — which `IF NOT EXISTS` would
 * otherwise skip forever — is dropped here first.
 */
async function applyOutsideTransaction(sql: Sql, file: MigrationFile): Promise<void> {
  const conn = await sql.reserve();
  try {
    await conn.unsafe(`SET lock_timeout = '10s'`);
    await dropInvalidIndexes(conn, concurrentIndexNames(file.body));
    for (const statement of splitStatements(file.body)) await conn.unsafe(statement);
    await conn`
      INSERT INTO ${conn.unsafe(LEDGER)} (name, checksum) VALUES (${file.name}, ${file.checksum})`;
  } finally {
    await conn.unsafe('RESET lock_timeout').catch(() => undefined);
    conn.release();
  }
}

/** Drop the INVALID leftovers of an interrupted concurrent build of `names`. */
export async function dropInvalidIndexes(sql: Sql, names: readonly string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const rows = await sql<{ qualified: string }[]>`
    SELECT format('%I.%I', n.nspname, c.relname) AS qualified
      FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE NOT i.indisvalid AND c.relname = ANY(${names as string[]})`;
  for (const { qualified } of rows)
    await sql.unsafe(`DROP INDEX CONCURRENTLY IF EXISTS ${qualified}`);
  return rows.map((r) => r.qualified);
}

/**
 * A database that already has the schema but no ledger was migrated by
 * something else (`db-local.sh`, `supabase db push`). Applying 0000 on top
 * would fail half-way; refuse before touching it.
 */
export async function unledgeredSchema(sql: Sql): Promise<boolean> {
  const [row] = await sql<{ found: boolean }[]>`
    SELECT to_regclass('public.businesses') IS NOT NULL
       AND to_regclass(${LEDGER}) IS NULL AS found`;
  return row?.found === true;
}
